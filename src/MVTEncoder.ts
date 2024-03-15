import CanvasImmediateRenderer from 'ol/render/canvas/Immediate.js';
import RenderFeature from 'ol/render/Feature.js';
import Style, {StyleFunction} from 'ol/style/Style.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';

import {
  Extent,
  getHeight as getExtentHeight,
  getWidth as getExtentWidth,
} from 'ol/extent.js';
import {MVT} from 'ol/format.js';

import {
  CoordExtent,
  createWorldToVectorContextTransform,
  listTilesCoveringExtentAtResolution,
} from './encodeutils';
import {Transform} from 'ol/transform.js';
import {asOpacity} from './canvasUtils';
import {renderFeature} from 'ol/renderer/vector.js';
import {toContext} from 'ol/render.js';
import {transform2D} from 'ol/geom/flat/transform.js';

import CanvasBuilderGroup from 'ol/render/canvas/BuilderGroup.js';
import CanvasExecutorGroup from 'ol/render/canvas/ExecutorGroup.js';
import RBush from 'rbush';
import TileGrid from 'ol/tilegrid/TileGrid.js';
import {VERSION} from 'ol';
import type {Size} from 'ol/size.js';

const olMajorVersion = Number.parseInt(VERSION.split('.')[0]);

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
   * The layer to print.
   */
  layer: VectorTileLayer;
  /**
   * The printed extent in OpenLayers coordinates system.
   */
  printExtent: Extent;
  /**
   * The resolution to use for retrieving the PBF files (OpenLayers resolution).
   * This will directly impact the quantity of details.
   */
  tileResolution: number;
  /**
   * The resolution to use for styling the features (OpenLayers resolution).
   * This is the one passed to the style function.
   */
  styleResolution: number;
  /**
   * The virtual size of the canvas to print to. This must have the same ratio has the print extent.
   * This is in real pixels.
   */
  canvasSize: [number, number];
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
  canvasSize: [number, number];
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
   * @param declutter
   */
  private drawFeaturesToContextUsingRenderAPI_(
    featuresExtent: _FeatureExtent,
    styleFunction: StyleFunction,
    styleResolution: number,
    coordinateToPixelTransform: Transform,
    context: CanvasRenderingContext2D,
    renderBuffer: number,
    declutter: boolean
  ) {
    const pixelRatio = 1;
    const builderGroup = new CanvasBuilderGroup(
      0,
      featuresExtent.extent,
      styleResolution,
      pixelRatio
    );

    let declutterBuilderGroup: CanvasBuilderGroup | undefined;
    if (declutter && olMajorVersion <= 9) {
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
              olMajorVersion <= 9
                ? (declutterBuilderGroup as unknown as boolean)
                : declutter
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
    const transform = coordinateToPixelTransform;
    const viewRotation = 0;
    const snapToPixel = true;
    const scaledSize =
      olMajorVersion < 9
        ? (1 as unknown as Size)
        : [context.canvas.width, context.canvas.height];

    renderingExecutorGroup.execute(
      context,
      scaledSize,
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
        scaledSize,
        transform,
        viewRotation,
        snapToPixel,
        undefined,
        declutter
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

  assertCanvasSize(printExtent, canvasSize) {
    const eRatio = getExtentWidth(printExtent) / getExtentHeight(printExtent);
    const cRatio = canvasSize[0] / canvasSize[1];
    if (Math.abs(eRatio / cRatio - 1) > 0.02) {
      const msg = `The print extent ratio ${eRatio} and the canvas ratio ${cRatio} mismatch: ${
        Math.abs(eRatio / cRatio - 1) * 100
      } %`;
      throw new Error(msg);
    }
  }

  // avoid polyfilling
  async allFullfilled<MyType>(promises: Promise<MyType>[]) {
    const settled: MyType[] = [];
    for (const p of promises) {
      await p.then(
        (s: any) => settled.push(s),
        () => {
          // empty
        }
      );
    }
    return settled;
  }

  async fetchFeatures(mvtTiles: CoordExtent[], source: VectorTileSource) {
    const urlFunction = source.getTileUrlFunction();
    const projection = source.getProjection()!;

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
    // keep only the fullfiled ones
    return this.allFullfilled(featuresPromises);
  }

  /**
   * @param options
   */
  async encodeMVTLayer(options: PrintEncodeOptions): Promise<PrintResult[]> {
    const layer = options.layer;
    const outputFormat = options.outputFormat || 'png';
    const renderBuffer = layer.getRenderBuffer() || 100;
    const source = layer.getSource()!;
    const tileGrid = source.getTileGrid()!;
    const tileResolution = this.snapTileResolution(
      tileGrid,
      options.tileResolution
    );
    if (tileResolution !== options.tileResolution) {
      console.warn(
        `snapped and tile resolution mismatch: ${tileResolution} != ${options.tileResolution}`
      );
      options.tileResolution = tileResolution;
    }
    const printExtent = options.printExtent;
    const mvtTiles = listTilesCoveringExtentAtResolution(
      printExtent,
      tileResolution,
      tileGrid
    );

    const featuresAndExtents = await this.fetchFeatures(mvtTiles, source);

    // TODO:
    // decide on a reasonable number of paving tiles for the rendering
    // this depends on the size of the tiles in pixels.
    // This will be necessary when working with A0 or such big outputs.
    const canvasSize = options.canvasSize;
    this.assertCanvasSize(printExtent, canvasSize);
    const renderTiles: RenderTile[] = [
      {
        printExtent, // print extent
        canvasSize, // the size in pixel for the canvas
      },
    ];

    const styleResolution = options.styleResolution || tileResolution;
    const layerStyleFunction = layer.getStyleFunction()!; // there is always a default one
    const layerOpacity = layer.get('opacity');
    // declutter is a boolean in OpenLayers 9 but anq RBush in earlier versions
    const declutter: boolean =
      olMajorVersion < 9
        ? ((layer.getDeclutter()
            ? new RBush<any>(7)
            : undefined) as unknown as boolean)
        : !!layer.getDeclutter();

    // render to these tiles;
    const encodedLayers = renderTiles.map((rt) =>
      this.renderTile(
        featuresAndExtents,
        rt.printExtent,
        rt.canvasSize,
        styleResolution,
        layerStyleFunction,
        layerOpacity,
        renderBuffer,
        declutter,
        outputFormat
      )
    );
    return encodedLayers;
  }

  renderTile(
    featuresExtents: _FeatureExtent[],
    rtExtent: Extent,
    canvasSize: [number, number],
    styleResolution: number,
    layerStyleFunction: StyleFunction,
    layerOpacity: number,
    renderBuffer: number,
    declutter: boolean,
    outputFormat?: string
  ): PrintResult {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    console.assert(
      ctx,
      `Could not get the context ${canvas.width}x${canvas.height}`
    );
    const vectorContext = toContext(ctx, {
      size: canvasSize,
      pixelRatio: 1,
    });

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
          declutter
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
