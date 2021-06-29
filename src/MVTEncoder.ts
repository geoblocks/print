import {MVT} from 'ol/format';
import {getWidth as getExtentWidth, getHeight as getExtentHeight} from 'ol/extent.js';
import {transform2D} from 'ol/geom/flat/transform.js';
import {createWorldToVectorContextTransform, listTilesCoveringExtentAtResolution} from './encodeutils';
import {toContext} from 'ol/render';
import {PoolDownloader} from './PoolDownloader';
import {Size} from 'ol/size';
import RenderFeature from 'ol/render/Feature';
import {StyleFunction} from 'ol/style/Style';
import {Transform} from 'ol/transform';
import CanvasImmediateRenderer from 'ol/render/canvas/Immediate';


const pool = new PoolDownloader();
const mvtFormat = new MVT();


export default class MVTEncoder {

  drawFeaturesToContext_(features: RenderFeature[], styleFunction: StyleFunction, resolution: number,
    coordinateToPixelTransform: Transform, vectorContext: CanvasImmediateRenderer) {
    features.forEach((f) => {
      let geometry = f.getGeometry();
      // poor man copy
      geometry = Object.assign(Object.create(Object.getPrototypeOf(geometry)), geometry);
      // FIXME: can we avoid accessing private properties?
      const inCoos = geometry['flatCoordinates_'];
      const outCoos = geometry['flatCoordinates_'] = new Array(inCoos.length);
      const stride = 2;
      transform2D(inCoos, 0, inCoos.length, stride, coordinateToPixelTransform, outCoos);
      const styles = styleFunction(f, resolution);
      if (styles) {
        if (!Array.isArray(styles)) {
          vectorContext.setStyle(styles);
          vectorContext.drawGeometry(geometry);
        } else {
          styles.forEach((style) => {
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(geometry);
          });
        }
      }
    });
  }

  createRenderContext(canvas, targetExtent, resolution) {
    const width = getExtentWidth(targetExtent) / resolution;
    const height = getExtentHeight(targetExtent) / resolution;
    const size: Size = [width, height];
    console.log('createRenderContext', ...size);
    const ctx = canvas.getContext('2d');
    const vectorContext = toContext(ctx, {
      size,
      pixelRatio: 1,
    });
    return vectorContext;
  }

  /**
   *
   * @param {VectorTileLayer} layer
   * @param {number} resolution
   * @param {import('ol/extent.js').Extent} printExtent
   */
  async encodeMVTLayer(layer, resolution, printExtent, scale) {
    const source = layer.getSource();
    const projection = source.getProjection();
    const tileGrid = source.getTileGrid();
    // what resolution to use here? the best one? can't it be too much data?
    const bestFeatureResolution = ((rr) => rr[rr.length - 2])(tileGrid.getResolutions());
    const mvtTiles = listTilesCoveringExtentAtResolution(printExtent, bestFeatureResolution, tileGrid);

    const urlFunction = source.getTileUrlFunction();
    const featuresPromises = mvtTiles.map(t => {
      const url = urlFunction(t.coord, 1, null); // pixelratio and projection are not used
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

    const featuresAndExtents = await Promise.all(featuresPromises);

    // determinate a reasonable number of paving tiles for the rendering
    // this depend on the size of the tiles
    const renderTiles = [{
      printExtent // print extent
    }];

    const layerStyleFunction = layer.getStyleFunction();
    const layerName = layer.get('name');
    const layerOpacity = layer.get('opacity');
    // render to these tiles;
    const encodedLayers = renderTiles.map(rt => {
      const canvas = document.createElement('canvas');
      const rtExtent = rt.printExtent;
      const rtResolution = 10000 * scale; // scaled meters at 254 DPI
      const vectorContext = this.createRenderContext(canvas, rtExtent, rtResolution);
      featuresAndExtents.forEach(ft => {
        const transform = createWorldToVectorContextTransform(rtExtent, canvas.width, canvas.height);
        this.drawFeaturesToContext_(ft.features, layerStyleFunction, resolution, transform, vectorContext);
      });

      const baseUrl = canvas.toDataURL('PNG'); // png preserves quality (but is more heavy)
      return {
        extent: rtExtent,
        imageFormat: 'image/png',
        opacity: layerOpacity,
        name: layerName,
        baseURL: baseUrl,
      };
    });

    return encodedLayers;
  }
}
