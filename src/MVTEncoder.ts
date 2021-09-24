import {MVT} from 'ol/format';
import {getWidth as getExtentWidth, getHeight as getExtentHeight, Extent} from 'ol/extent.js';
import {transform2D} from 'ol/geom/flat/transform.js';
import {createWorldToVectorContextTransform, listTilesCoveringExtentAtResolution} from './encodeutils';
import {toContext} from 'ol/render';
import {PoolDownloader} from './PoolDownloader';
import {Size} from 'ol/size';
import RenderFeature from 'ol/render/Feature';
import Style, {StyleFunction} from 'ol/style/Style';
import {Transform} from 'ol/transform';
import CanvasImmediateRenderer from 'ol/render/canvas/Immediate';
import VectorTileLayer from 'ol/layer/VectorTile';
import {asOpacity} from './canvasUtils';


const pool = new PoolDownloader();
const mvtFormat = new MVT();

interface PrintEncodeOptions {
  canvasResolution?: number
  tileResolution?: number
  styleResolution?: number
  monitorResolution?: number
  monitorDPI?: number
  paperDPI?: number
}

interface PrintResult {
  extent: Extent,
  baseURL: string,
}

interface ToDraw {
  zIndex: number|undefined
  feature: RenderFeature
  naturalOrder: number
  styleIdx: number
}

/**
 * Encode an OpenLayers MVT layer to a list of canvases.
 */
export default class MVTEncoder {

  /**
   *
   * @param features A list of features to render (in world coordinates)
   * @param styleFunction The style function for the features
   * @param styleResolution The resolution used in the style function
   * @param coordinateToPixelTransform World to CSS coordinates transform (top-left is 0)
   * @param vectorContext
   */
  private drawFeaturesToContext_(features: RenderFeature[], styleFunction: StyleFunction, styleResolution: number,
    coordinateToPixelTransform: Transform, vectorContext: CanvasImmediateRenderer) {
    const toDraw: ToDraw[] = [];
    let i = 0;
    features.forEach((f) => {
      const styles = styleFunction(f, styleResolution);
      if (styles) {
        if (!Array.isArray(styles)) {
          toDraw.push({
            zIndex: styles.getZIndex(),
            feature: f,
            naturalOrder: ++i,
            styleIdx: -1
          });
        } else {
          styles.forEach((style, sIdx) => {
            toDraw.push({
              zIndex: style.getZIndex(),
              feature: f,
              naturalOrder: ++i,
              styleIdx: sIdx
            });
          });
        }
      }
    });

    // sort is stable for newer browsers
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
    // for security we handle the stability ourself
    toDraw.sort((a, b) => {
      const r = (a.zIndex || 0) - (b.zIndex || 0);
      return r || a.naturalOrder - b.naturalOrder;
    });

    // In order to honour zIndex we do drawing in 2 steps:
    // - first we create a list of geometries + style to render and order it by zIndex
    // - then we re-apply the style and draw.
    // We can not simply keep a reference to the style because they are mutable: some styles are reused
    // for several features and the value would be overwritten otherwise.
    for (const item of toDraw) {
      const styles = styleFunction(item.feature, styleResolution);
      const style = item.styleIdx === -1 ? styles : styles[item.styleIdx];
      vectorContext.setStyle(style);

      // Keep it simple by systematically getting the geometry either from the style or from the feature
      // Then the coordinates are transformed
      let geometry = style.getGeometry();
      if (typeof geometry === "function") {
        geometry = geometry();
      }
      if (!geometry) {
        geometry = item.feature.getGeometry();
      }

      // poor man copy
      geometry = Object.assign(Object.create(Object.getPrototypeOf(geometry)), geometry);
      // FIXME: can we avoid accessing private properties?
      const inCoos = geometry['flatCoordinates_'];
      const outCoos = geometry['flatCoordinates_'] = new Array(inCoos.length);
      const stride = geometry.getStride();
      transform2D(inCoos, 0, inCoos.length, stride, coordinateToPixelTransform, outCoos);

      // Finally draw the feature with previously set style
      vectorContext.drawGeometry(geometry);
    }
  }

  /**
   * Adjust size of the canvas and wrap it into the OL immediate API.
   * @param canvas The canvas to render to
   * @param targetExtent The extent for this canvas, in world coordinates
   * @param resolution The resolution for this canvas (will influence the size of the canvas)
   */
  createRenderContext(canvas: HTMLCanvasElement, targetExtent: Extent, resolution: number): CanvasImmediateRenderer {
    const width = getExtentWidth(targetExtent) / resolution;
    const height = getExtentHeight(targetExtent) / resolution;
    const size: Size = [width, height];
    console.log('createRenderContext', ...size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(`Could not get the context ${canvas.width}x${canvas.height}, expected ${width}x${height})`);
    }
    const vectorContext = toContext(ctx, {
      size,
      pixelRatio: 1,
    });
    return vectorContext;
  }

  computeReasonableTileResolution(tileGrid, monitorResolution, tileResolution) {
    const targetResolution = tileResolution || monitorResolution;
    const resolutions = tileGrid.getResolutions();
    let resolution = resolutions[resolutions.length - 2]; // the last one is exclusive?
    for (let i = resolutions.length - 2; i >= 0; i--) {
      const r = resolutions[i];
      if (r <= targetResolution) {
        resolution = r;
      } else {
        break;
      }
    }
    return resolution;
  }

  /**
   *
   * @param layer
   * @param defaultResolution
   * @param printExtent
   */
  async encodeMVTLayer(layer: VectorTileLayer, defaultResolution: number, printExtent: Extent, options: PrintEncodeOptions = {}): Promise<PrintResult[]> {
    const source = layer.getSource();
    const projection = source.getProjection();
    const tileGrid = source.getTileGrid();
    const monitorResolution = options.monitorResolution || defaultResolution;
    const tileResolution = this.computeReasonableTileResolution(tileGrid, monitorResolution, options.tileResolution);
    const mvtTiles = listTilesCoveringExtentAtResolution(printExtent, tileResolution, tileGrid);

    const urlFunction = source.getTileUrlFunction();
    const featuresPromises = mvtTiles.map(t => {
      // pixelratio and projection are not used
      const url = urlFunction(t.coord, 1, projection);
      if (!url) {
        return Promise.reject('Could not create URL');
      }
      return pool.fetch(url)
        .then(r => r.arrayBuffer())
        .then(data => {
          const features = mvtFormat.readFeatures(data, {
            extent: t.extent,
            featureProjection: projection,
          }) as RenderFeature[];
          return {
            features,
            extent: t.extent,
            url
          };
        });
    });

    let featuresAndExtents = await Promise.allSettled(featuresPromises);
    featuresAndExtents = featuresAndExtents.filter(r => r.status === 'fulfilled')

    // determinate a reasonable number of paving tiles for the rendering
    // this depend on the size of the tiles
    const renderTiles = [{
      printExtent // print extent
    }];

    // By default we want 254 DPI on paper VS 96 DPI on the display
    const paperDPI = options.paperDPI || 254;
    const monitorDPI = options.monitorDPI || 96;
    const rtResolution = options.canvasResolution || monitorDPI / paperDPI * monitorResolution;
    const styleResolution = options.styleResolution || tileResolution;
    const layerStyleFunction = layer.getStyleFunction()!; // there is always a default one
    const layerOpacity = layer.get('opacity');
    // render to these tiles;
    const encodedLayers = renderTiles.map(rt => {
      const canvas = document.createElement('canvas');
      const rtExtent = rt.printExtent;
      const vectorContext = this.createRenderContext(canvas, rtExtent, rtResolution);
      featuresAndExtents.forEach(ft => {
        if (ft.status === 'fulfilled') {
          const transform = createWorldToVectorContextTransform(rtExtent, canvas.width, canvas.height);
          this.drawFeaturesToContext_(ft.value.features, layerStyleFunction, styleResolution, transform, vectorContext);
        }
      });

      const baseUrl = (layerOpacity === 1 ? canvas: asOpacity(canvas, layerOpacity)).toDataURL('PNG');
      return {
        extent: rtExtent,
        baseURL: baseUrl,
      };
    });

    return encodedLayers;
  }
}
