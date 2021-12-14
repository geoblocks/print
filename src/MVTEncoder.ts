import CanvasImmediateRenderer from 'ol/render/canvas/Immediate.js';
import RenderFeature from 'ol/render/Feature.js';
import Style, {StyleFunction} from 'ol/style/Style.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import {
  Extent,
  getHeight as getExtentHeight,
  getWidth as getExtentWidth,
} from 'ol/extent.js';
import {MVT} from 'ol/format.js';

import {Size} from 'ol/size.js';
import {Transform} from 'ol/transform.js';
import {asOpacity} from './canvasUtils';
import {
  createWorldToVectorContextTransform,
  listTilesCoveringExtentAtResolution,
} from './encodeutils';
import {renderFeature} from 'ol/renderer/vector.js';
import {toContext} from 'ol/render.js';
import {transform2D} from 'ol/geom/flat/transform.js';

import CanvasBuilderGroup from 'ol/render/canvas/BuilderGroup.js';
import CanvasExecutorGroup from 'ol/render/canvas/ExecutorGroup.js';
import RBush from 'rbush';
import TileGrid from 'ol/tilegrid/TileGrid';

/**
 * Simple proxy to the fetch function for now.
 * Can be updated later to limit the number of concurrent requests.
 * Can be made to work on stub for testing.
 */
export class PoolDownloader {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return typeof fetch !== 'undefined'
      ? fetch(input, init)
      : Promise.reject('no Fetch');
  }
}

const pool = new PoolDownloader();
const mvtFormat = new MVT();

export interface PrintEncodeOptions {
  /**
   * The resolution of the output canvas (OpenLayers resolution).
   * You should provide this value if you have a requirement on the output size of the canvas.
   */
  canvasResolution?: number;
  /**
   * The resolution to use for retrieving the PBF files (OpenLayers resolution).
   * This will directly impact the quantity of details.
   */
  tileResolution?: number;
  /**
   * The resolution to use for styling the features (OpenLayers resolution).
   * This is the one passed to the style function.
   */
  styleResolution?: number;
  /**
   * The resolution of the view (OpenLayers resolution, typically the view resolution)
   */
  monitorResolution?: number;
  /**
   * The resolution of the monitor. Defaults to 96 DPI.
   */
  monitorDPI?: number;
  /**
   * The resolution of the printer. Defaults to 254 DPI.
   */
  paperDPI?: number;
  /**
   * PNG or JPEG
   */
  outputFormat?: string;
}

interface PrintResult {
  extent: Extent;
  baseURL: string;
}

interface ToDraw {
  zIndex: number | undefined;
  feature: RenderFeature;
  naturalOrder: number;
  styleIdx: number;
}

interface RenderTile {
  printExtent: Extent;
}

interface _FeatureExtent {
  features: RenderFeature[];
  extent: Extent;
  url: string;
}

/**
 * Encode an OpenLayers MVT layer to a list of canvases.
 */
export default class MVTEncoder {
  static useImmediateAPI = false;

  /**
   * @param featuresExtent A list of features to render (in world coordinates)
   * @param styleFunction The style function for the features
   * @param styleResolution The resolution used in the style function
   * @param coordinateToPixelTransform World to CSS coordinates transform (top-left is 0)
   * @param context
   * @param renderBuffer
   * @param declutterTree
   */
  private drawFeaturesToContextUsingRenderAPI_(
    featuresExtent: _FeatureExtent,
    styleFunction: StyleFunction,
    styleResolution: number,
    coordinateToPixelTransform: Transform,
    context: CanvasRenderingContext2D,
    renderBuffer: number,
    declutterTree?: RBush<any>
  ) {
    const pixelRatio = 1;
    const builderGroup = new CanvasBuilderGroup(
      0,
      featuresExtent.extent,
      styleResolution,
      pixelRatio
    );

    let declutterBuilderGroup: CanvasBuilderGroup | undefined;
    if (declutterTree) {
      declutterBuilderGroup = new CanvasBuilderGroup(
        0,
        featuresExtent.extent,
        styleResolution,
        pixelRatio
      );
    }

    function resourceLoadedListener() {
      console.log(
        'FIXME: some resource is now available, we should regenerate the image'
      );
    }

    /**
     * @param feature
     * @this {CanvasVectorTileLayerRenderer}
     */
    const localRenderFeature = function (feature: RenderFeature): boolean {
      let styles: Style[] | Style | undefined | void;
      const sf = feature.getStyleFunction() || styleFunction;
      if (sf) {
        styles = sf(feature, styleResolution);
      }
      let loading = false;
      if (styles) {
        if (!Array.isArray(styles)) {
          styles = [styles];
        }
        const tolerance = 0;
        for (const style of styles) {
          loading =
            renderFeature(
              builderGroup,
              feature,
              style,
              tolerance,
              resourceLoadedListener,
              undefined,
              declutterBuilderGroup
            ) || loading;
        }
      }
      return loading;
    };

    let loading = false;
    featuresExtent.features.forEach((f) => {
      loading = localRenderFeature(f) || loading;
    });

    if (loading) {
      console.log('FIXME: some styles are still loading');
    }

    const sourceHasOverlaps = true; // we don't care about performance
    const executorGroupInstructions = builderGroup.finish();
    const renderingExecutorGroup = new CanvasExecutorGroup(
      featuresExtent.extent,
      styleResolution,
      pixelRatio,
      sourceHasOverlaps,
      executorGroupInstructions,
      renderBuffer
    );
    const scale = 1;
    const transform = coordinateToPixelTransform;
    const viewRotation = 0;
    const snapToPixel = true;

    renderingExecutorGroup.execute(
      context,
      scale,
      transform,
      viewRotation,
      snapToPixel,
      undefined,
      null // we don't want to declutter the base layer
    );
    if (declutterBuilderGroup) {
      const declutterExecutorGroup = new CanvasExecutorGroup(
        featuresExtent.extent,
        styleResolution,
        pixelRatio,
        sourceHasOverlaps,
        declutterBuilderGroup.finish(),
        renderBuffer
      );
      declutterExecutorGroup.execute(
        context,
        scale,
        transform,
        viewRotation,
        snapToPixel,
        undefined,
        declutterTree
      );
    }
  }

  /**
   *
   * @param features A list of features to render (in world coordinates)
   * @param styleFunction The style function for the features
   * @param styleResolution The resolution used in the style function
   * @param coordinateToPixelTransform World to CSS coordinates transform (top-left is 0)
   * @param vectorContext
   */
  private drawFeaturesToContextUsingImmediateAPI_(
    features: RenderFeature[],
    styleFunction: StyleFunction,
    styleResolution: number,
    coordinateToPixelTransform: Transform,
    vectorContext: CanvasImmediateRenderer
  ) {
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
            styleIdx: -1,
          });
        } else {
          styles.forEach((style, sIdx) => {
            toDraw.push({
              zIndex: style.getZIndex(),
              feature: f,
              naturalOrder: ++i,
              styleIdx: sIdx,
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
      if (typeof geometry === 'function') {
        geometry = geometry();
      }
      if (!geometry) {
        geometry = item.feature.getGeometry();
      }

      // poor man copy
      geometry = Object.assign(
        Object.create(Object.getPrototypeOf(geometry)),
        geometry
      );
      // FIXME: can we avoid accessing private properties?
      const inCoos = geometry['flatCoordinates_'];
      const outCoos = (geometry['flatCoordinates_'] = new Array(inCoos.length));
      const stride = geometry.getStride();
      transform2D(
        inCoos,
        0,
        inCoos.length,
        stride,
        coordinateToPixelTransform,
        outCoos
      );

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
  createRenderContext(
    canvas: HTMLCanvasElement,
    targetExtent: Extent,
    resolution: number
  ): CanvasImmediateRenderer {
    const width = getExtentWidth(targetExtent) / resolution;
    const height = getExtentHeight(targetExtent) / resolution;
    const size: Size = [width, height];
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(
        `Could not get the context ${canvas.width}x${canvas.height}, expected ${width}x${height})`
      );
    }
    const vectorContext = toContext(ctx, {
      size,
      pixelRatio: 1,
    });
    return vectorContext;
  }

  snapTileResolution(tileGrid: TileGrid, targetResolution: number): number {
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
   * @param layer The VectorTileLayer to rasterize
   * @param defaultResolution The resolution to fallback when specific resolution is not available in options
   * @param printExtent The extent that should be printed (in map coordinates)
   * @param options Extra options
   */
  async encodeMVTLayer(
    layer: VectorTileLayer,
    defaultResolution: number,
    printExtent: Extent,
    options: PrintEncodeOptions = {}
  ): Promise<PrintResult[]> {
    const outputFormat = options.outputFormat || 'png';
    const renderBuffer = layer.getRenderBuffer() ?? 100;
    const source = layer.getSource();
    const projection = source.getProjection();
    const tileGrid = source.getTileGrid();
    const monitorResolution = options.monitorResolution || defaultResolution;
    const targetResolution = options.tileResolution || monitorResolution;
    const tileResolution = this.snapTileResolution(tileGrid, targetResolution);
    const mvtTiles = listTilesCoveringExtentAtResolution(
      printExtent,
      tileResolution,
      tileGrid
    );

    const urlFunction = source.getTileUrlFunction();
    const featuresPromises = mvtTiles.map((t) => {
      // pixelratio and projection are not used
      const url = urlFunction(t.coord, 1, projection);
      if (!url) {
        return Promise.reject('Could not create URL');
      }
      return pool
        .fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => {
          const features = mvtFormat.readFeatures(data, {
            extent: t.extent,
            featureProjection: projection,
          }) as RenderFeature[];
          return {
            features,
            extent: t.extent,
            url,
          } as _FeatureExtent;
        });
    });

    const featuresAndExtents = (await Promise.allSettled(featuresPromises))
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<_FeatureExtent>).value);

    // TODO:
    // decide on a reasonable number of paving tiles for the rendering
    // this depends on the size of the tiles in pixels.
    // This will be necessary when working with A0 or such big outputs.
    const renderTiles: RenderTile[] = [
      {
        printExtent, // print extent
      },
    ];

    // By default we want 254 DPI on paper VS 96 DPI on the display
    const paperDPI = options.paperDPI || 254;
    const monitorDPI = options.monitorDPI || 96;
    const rtResolution =
      options.canvasResolution || (monitorDPI / paperDPI) * monitorResolution;
    const styleResolution = options.styleResolution || tileResolution;
    const layerStyleFunction = layer.getStyleFunction()!; // there is always a default one
    const layerOpacity = layer.get('opacity');

    const decluterTree = layer.getDeclutter() ? new RBush<any>(9) : undefined;

    // render to these tiles;
    const encodedLayers = renderTiles.map((rt) =>
      this.renderTile(
        featuresAndExtents,
        rt.printExtent,
        rtResolution,
        styleResolution,
        layerStyleFunction,
        layerOpacity,
        renderBuffer,
        decluterTree,
        outputFormat
      )
    );
    return encodedLayers;
  }

  renderTile(
    featuresExtents: _FeatureExtent[],
    rtExtent: Extent,
    rtResolution: number,
    styleResolution: number,
    layerStyleFunction: StyleFunction,
    layerOpacity: number,
    renderBuffer: number,
    decluterTree?: RBush<any>,
    outputFormat?: string
  ): PrintResult {
    const canvas = document.createElement('canvas');
    const vectorContext = this.createRenderContext(
      canvas,
      rtExtent,
      rtResolution
    );
    const ctx = canvas.getContext('2d');

    featuresExtents.forEach((ft) => {
      const transform = createWorldToVectorContextTransform(
        rtExtent,
        canvas.width,
        canvas.height
      );
      if (MVTEncoder.useImmediateAPI) {
        this.drawFeaturesToContextUsingImmediateAPI_(
          ft.features,
          layerStyleFunction,
          styleResolution,
          transform,
          vectorContext
        );
      } else {
        this.drawFeaturesToContextUsingRenderAPI_(
          ft,
          layerStyleFunction,
          styleResolution,
          transform,
          ctx!,
          renderBuffer,
          decluterTree
        );
      }
    });

    const baseUrl = (
      layerOpacity === 1 ? canvas : asOpacity(canvas, layerOpacity)
    ).toDataURL(outputFormat);
    return {
      extent: rtExtent,
      baseURL: baseUrl,
    };
  }
}
