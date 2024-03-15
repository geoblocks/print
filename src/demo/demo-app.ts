/* eslint-disable sort-imports-es6-autofix/sort-imports-es6 */
import Feature from 'ol/Feature.js';
import Geometry from 'ol/geom/Geometry';
import Icon from 'ol/style/Icon.js';
import MVT from 'ol/format/MVT.js';
import MVTEncoder, {PrintEncodeOptions} from '../MVTEncoder';
import OLMap from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import TileDebug from 'ol/source/TileDebug.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View.js';
import {applyStyle} from 'ol-mapbox-style';
import {Extent} from 'ol/extent.js';
import {LitElement, TemplateResult, css, html} from 'lit';
import {PDF_POINTS_PER_METER} from '../constants';
import {canvasSizeFromDimensionsInPdfPoints} from '../canvasUtils';
import {centerPrintExtent, drawPrintExtent} from '../postcompose';
import {customElement, query, state} from 'lit/decorators.js';
import {fromLonLat, toLonLat} from 'ol/proj.js';
import {olCss} from './css';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon.js';
import {printerIcon} from '../printer';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

const defaults = {
  demo: 'mapbox1',
  declutter: true,
  immediateApi: false,
};

@customElement('demo-app')
export class DemoApp extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        border: solid 1px gray;
        padding: 16px;
      }
      #side {
        background-color: lightgray;
        display: inline-block;
      }
      #print {
        width: 30px;
        height: 30px;
      }
      #map {
        display: inline-block;
        width: 45%;
        height: calc(100vh - 32px - 20px - 40px);
      }
    `,
    olCss,
  ];

  @query('#map')
  private mapEl?: HTMLElement;

  private map?: OLMap;
  private mvtLayer?: VectorTileLayer;
  private printExtentLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;
  private targetSizeInPdfPoints: [number, number] = [255, 355]; // 72pts / inch => ~[9cm, 12.5cm]
  private printScale = 1 / 5000;
  private dpi = 96; // let's take a value adapted for a screen. For a printer 254 would be better.

  @state()
  private result0;

  @state()
  private zoom = -1;

  @state()
  private currentDemo = defaults.demo;

  @state()
  private shouldDeclutter = defaults.declutter;

  @state()
  private useImmediateApi = defaults.immediateApi;

  async configureVTStyle(
    layer: VectorTileLayer,
    url: string,
    sourceId: string
  ): Promise<void> {
    return fetch(url)
      .then((r) => r.json())
      .then((style) => applyStyle(layer, style, sourceId));
  }

  createMap(): void {
    this.printExtentLayer = new VectorLayer({
      // @ts-ignore
      'name': 'printExtent',
      source: new VectorSource({
        features: [],
      }),
    });
    this.map = new OLMap({
      target: this.mapEl,
      layers: [],
      view: new View({
        zoom: 15,
      }),
    });
    this.shouldDeclutter = defaults.declutter;
    this.updateDemo(defaults.demo);

    this.map.on('postcompose', (evt) => {
      const res = evt.frameState!.viewState.resolution;
      drawPrintExtent(
        evt,
        this.getPrintExtentSizeForResolution(res, devicePixelRatio)
      );
    });
    this.map.getView().on('change:resolution', () => {
      this.zoom = this.map?.getView().getZoom() || -1;
    });
    this.zoom = this.map?.getView().getZoom() || -1;
  }

  /**
   * @param resolution some resolution, typically the display resolution
   * @param pixelRatio typically the device pixel ratio
   * @return size
   */
  getPrintExtentSizeForResolution(
    resolution: number,
    pixelRatio: number
  ): number[] {
    return this.targetSizeInPdfPoints.map((side) => {
      const metersOnTheMap = side / PDF_POINTS_PER_METER / this.printScale;
      return (pixelRatio * metersOnTheMap) / resolution;
    });
  }

  firstUpdated(): void {
    this.createMap();
  }

  async print(): Promise<void> {
    MVTEncoder.useImmediateAPI = this.useImmediateApi;
    const encoder = new MVTEncoder();
    const viewResolution = this.map!.getView().getResolution()!;
    const size = this.map!.getSize()!;

    const peSize = this.getPrintExtentSizeForResolution(
      viewResolution,
      window.devicePixelRatio
    );
    const pp = centerPrintExtent(peSize, size[0], size[1]);
    const printExtent: Extent = [
      ...this.map!.getCoordinateFromPixel([pp[0], pp[3]]),
      ...this.map!.getCoordinateFromPixel([pp[2], pp[1]]), // top right
    ] as Extent;
    this.printExtentLayer?.getSource()?.clear();
    this.printExtentLayer?.getSource()?.addFeature(
      new Feature({
        geometry: polygonFromExtent(printExtent),
      })
    );
    const canvasSize = canvasSizeFromDimensionsInPdfPoints(
      this.targetSizeInPdfPoints,
      this.dpi
    );
    console.log(
      'Estimated size on screen',
      canvasSize.map((s) => (s / 96) * 2.54)
    );
    const options: PrintEncodeOptions = {
      layer: this.mvtLayer!,
      printExtent: printExtent,
      tileResolution: viewResolution,
      styleResolution: viewResolution,
      canvasSize: canvasSize,
    };
    const result = await encoder.encodeMVTLayer(options);
    console.log(result);
    this.result0 = result[0];
  }

  configureSimpleDemo(): void {
    this.mvtLayer = new VectorTileLayer({
      declutter: this.shouldDeclutter,
      style(feature) {
        if (feature.getGeometry()?.getType() === 'Point') {
          return new Style({
            text: new Text({
              font: 'bold 28px beach',
              text: 'beach',
              offsetY: 40,
            }),
            image: new Icon({
              src: `${document.baseURI}/beach.svg`,
              opacity: 0.5,
              scale: 0.05,
            }),
          });
        }
        return new Style({
          stroke: new Stroke({
            color: 'red',
          }),
        });
      },
      source: new VectorTileSource({
        format: new MVT(),
        url: document.baseURI + 'tiles/{z}/{x}/{y}.pbf',
        maxZoom: 14,
        // extent: trackExtent,
      }),
    });

    const layers = this.map?.getLayers();
    layers!.clear();
    const newLayers = [
      new TileLayer({
        source: new OSM(),
      }),
      this.mvtLayer!,
      this.printExtentLayer!,
      new TileLayer({
        zIndex: 10000,
        source: new TileDebug({
          tileGrid: this.mvtLayer.getSource()!.getTileGrid()!,
        }),
      }),
    ];
    layers!.extend(newLayers);
    this.map?.getView().setCenter(fromLonLat([6.5725, 46.51339]));
  }

  configureMapboxDemo1(): void {
    this.configureMapboxDemo(
      'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.leichte-basiskarte.vt/style.json',
      'leichtebasiskarte_v3.0.1'
    );
  }

  async configureMapboxDemo(styleURL: string, sourceId: string): Promise<void> {
    this.mvtLayer = new VectorTileLayer({
      declutter: this.shouldDeclutter,
    });
    await this.configureVTStyle(this.mvtLayer, styleURL, sourceId);

    const layers = this.map?.getLayers();
    layers!.clear();
    const newLayers = [
      this.mvtLayer!,
      this.printExtentLayer!,
      new TileLayer({
        zIndex: 10000,
        source: new TileDebug({
          tileGrid: this.mvtLayer.getSource()!.getTileGrid()!,
        }),
      }),
    ];
    layers!.extend(newLayers);
    this.map?.getView().setCenter(fromLonLat([7.44835, 46.94811]));
  }

  updateDemo(demo: string): void {
    this.currentDemo = demo;
    switch (demo) {
      case 'simple':
        this.configureSimpleDemo();
        break;
      case 'mapbox1':
        this.configureMapboxDemo1();
        break;
      default:
    }
  }

  formatExtent(e: Extent) {
    const c0 = [e[0], e[1]];
    const c1 = [e[2], e[3]];
    const p1 = toLonLat(c0, 'EPSG:3857')
      .map((v) => v.toFixed(3))
      .join(', ');
    const p2 = toLonLat(c1, 'EPSG:3857')
      .map((v) => v.toFixed(3))
      .join(', ');
    return `[${p1}, ${p2}]`;
  }

  render(): TemplateResult {
    let img: TemplateResult | '' = '';
    let extent: TemplateResult | '' = '';
    if (this.result0) {
      const e = this.result0.extent;
      img = html`<img id="side" src="${this.result0.baseURL}" />`;
      extent = html`<span>${this.formatExtent(e)}</span>`;
    }
    return html`
      <button id="print" @click=${this.print}>
        ${unsafeHTML(printerIcon)}
      </button>
      <label for="demo-select">Choose a demo:</label>
      <select
        name="demos"
        id="demo-select"
        .value="${this.currentDemo}"
        @change=${(evt) => this.updateDemo(evt.target.value)}
      >
        <option value="simple">Basic style function</option>
        <option value="mapbox1">OL-Mapbox-style1</option>
      </select>
      <label>
        <input
          type="checkbox"
          ?checked=${this.shouldDeclutter}
          @change=${(evt) => {
            this.shouldDeclutter = evt.target.checked;
            this.updateDemo(this.currentDemo);
          }}
        />
        declutter
      </label>
      <label>
        <input
          type="checkbox"
          ?checked=${this.useImmediateApi}
          @change=${(evt) => {
            this.useImmediateApi = evt.target.checked;
          }}
        />immediate API
      </label>
      <div>zoom: ${this.zoom.toFixed(1)}</div>
      <div>
        printed extent: ${extent || 'Move around and click the print button...'}
      </div>
      <div>
        <div id="map"></div>
        ${img}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-app': DemoApp;
  }
}
