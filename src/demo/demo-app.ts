import Feature from 'ol/Feature.js';
import Icon from 'ol/style/Icon.js';
import MVT from 'ol/format/MVT.js';
import MVTEncoder from '../MVTEncoder';
import OLMap from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import TileDebug from 'ol/source/TileDebug.js';
import TileGrid from 'ol/tilegrid/TileGrid.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View.js';
import stylefunction from 'ol-mapbox-style/dist/stylefunction.js';
import {Extent} from 'ol/extent.js';
import {LitElement, TemplateResult, css, html} from 'lit';
import {PDF_POINTS_PER_METER} from '../constants';
import {computePrintPosition, drawPaperDimensions} from '../postcompose';
import {customElement, query, state} from 'lit/decorators.js';
import {extentFromProjection} from 'ol/tilegrid.js';
import {fromLonLat, toLonLat} from 'ol/proj.js';
import {olCss} from './css';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon.js';
import {printerIcon} from '../printer';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

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
        position: absolute;
        top: 10em;
        left: 2.5em;
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
  private printExtentLayer?: VectorLayer;
  private targetSizeInPdfPoints = [510, 710]; // 72pts / inch => ~[18cm, 25cm]
  private printScale = 1 / 5000;

  @state()
  private result0;

  @state()
  private zoom = -1;

  configureVTStyle(layer: VectorTileLayer, url: string): void {
    fetch(url)
      .then((r) => r.json())
      .then((style) => {
        let spriteUrl, spriteDataUrl, spriteImageUrl, addMpFonts;

        if (style.sprite) {
          spriteUrl = style.sprite;

          // support relative spriteUrls
          if (spriteUrl.includes('./')) {
            spriteUrl = new URL(spriteUrl, url);
          }

          spriteDataUrl = spriteUrl.toString().concat('.json');
          spriteImageUrl = spriteUrl.toString().concat('.png');

          fetch(spriteDataUrl)
            .then((r) => r.json())
            .then((r) => r.data)
            .then((spriteData) => {
              stylefunction(
                layer,
                style,
                Object.keys(style.sources)[0],
                undefined,
                spriteData,
                spriteImageUrl,
                addMpFonts
              );
            });
        } else {
          stylefunction(
            layer,
            style,
            Object.keys(style.sources)[0],
            undefined,
            undefined,
            undefined,
            addMpFonts
          );
        }
      });
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
        zoom: 14,
      }),
    });
    this.configureSimpleDemo();

    this.map.on('postcompose', (evt) => {
      const res = evt.frameState.viewState.resolution;
      //const printResolution = 1 / PIXELS_PER_METER / this.printScale;
      drawPaperDimensions(evt, this.getPrintDimensions(res));
    });
    this.map.getView().on('change:resolution', () => {
      this.zoom = this.map?.getView().getZoom() || -1;
    });
    this.zoom = this.map?.getView().getZoom() || -1;
  }

  getPrintDimensions(resolution: number): number[] {
    return this.targetSizeInPdfPoints.map(
      (side) =>
        (side / PDF_POINTS_PER_METER / resolution / this.printScale) *
        devicePixelRatio
    );
  }

  firstUpdated(): void {
    this.createMap();
  }

  async print(): Promise<void> {
    const encoder = new MVTEncoder();
    const viewResolution = this.map!.getView().getResolution()!;
    const size = this.map!.getSize()!;

    const pp = computePrintPosition(
      this.getPrintDimensions(viewResolution),
      size[0],
      size[1]
    );
    const printExtent: Extent = [
      ...this.map!.getCoordinateFromPixel([pp[0], pp[3]]),
      ...this.map!.getCoordinateFromPixel([pp[2], pp[1]]), // top right
    ] as Extent;
    this.printExtentLayer?.getSource().clear();
    this.printExtentLayer?.getSource().addFeature(
      new Feature({
        geometry: polygonFromExtent(printExtent),
      })
    );
    const result = await encoder.encodeMVTLayer(
      this.mvtLayer!,
      viewResolution,
      printExtent
    );
    console.log(result);
    this.result0 = result[0];
  }

  configureSimpleDemo(): void {
    this.mvtLayer = new VectorTileLayer({
      style(feature) {
        if (feature.getGeometry()?.getType() === 'Point') {
          return new Style({
            text: new Text({
              font: 'bold 28px beach',
              text: 'beach',
              offsetY: 40,
            }),
            image: new Icon({
              src: `/beach.svg`,
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
        url: '/tiles/{z}/{x}/{y}.pbf',
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
          tileGrid: this.mvtLayer.getSource().getTileGrid(),
        }),
      }),
    ];
    layers!.extend(newLayers);
    this.map?.getView().setCenter(fromLonLat([6.57253, 46.51336]));
  }

  configureMapboxDemo(): void {
    const extent = extentFromProjection('EPSG:3857');
    const origin = [extent[0], extent[3]];
    this.mvtLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: new TileGrid({
          tileSize: 512,
          resolutions: [
            78271.5169640117238, 39135.7584820058619, 19567.8792410029309,
            9783.93962050146547, 4891.96981025073273, 2445.98490512536637,
            1222.99245256268318, 611.496226281341592, 305.7481131406708,
            152.8740565703354, 76.437028285167699, 38.2185141425838495,
            19.1092570712919247, 9.55462853564596237, 4.77731426782298119,
            2.38865713391149059, 1,
          ],
          extent: extent,
          origin: origin,
        }),
        url: 'https://adv-smart.de/tiles/smarttiles_de_public/{z}/{x}/{y}.pbf',
        maxZoom: 14,
      }),
    });
    this.configureVTStyle(
      this.mvtLayer,
      //'https://dev.adv-smart.de/styles/public/v0/de_style_grey.json'
      'https://adv-smart.de/styles/public/de_style_hillshade.json'
    );

    const layers = this.map?.getLayers();
    layers!.clear();
    const newLayers = [
      this.mvtLayer!,
      this.printExtentLayer!,
      new TileLayer({
        zIndex: 10000,
        source: new TileDebug({
          tileGrid: this.mvtLayer.getSource().getTileGrid(),
        }),
      }),
    ];
    layers!.extend(newLayers);
    this.map?.getView().setCenter(fromLonLat([8.355, 47.576]));
  }

  updateDemo(demo: string): void {
    switch (demo) {
      case 'simple':
        this.configureSimpleDemo();
        break;
      case 'mapbox':
        this.configureMapboxDemo();
        break;
      default:
    }
  }

  render(): TemplateResult {
    let img: TemplateResult | '' = '';
    let extent: TemplateResult | '' = '';
    if (this.result0) {
      const e = this.result0.extent;
      const c0 = [e[0], e[1]];
      const c1 = [e[2], e[3]];
      img = html`<img id="side" src="${this.result0.baseURL}" />`;
      extent = html`<div>
        ${JSON.stringify(toLonLat(c0, 'EPSG:3857'))}
        ${JSON.stringify(toLonLat(c1, 'EPSG:3857'))}
      </div>`;
    }
    return html`
      <label for="demo-select">Choose a demo:</label>
      <select
        name="demos"
        id="demo-select"
        value="mapbox"
        @change=${(evt) => this.updateDemo(evt.target.value)}
      >
        <option value="simple">Basic style function</option>
        <option value="mapbox">OL-Mapbox-style</option>
      </select>
      <div>${extent || 'Move around and click the print button...'}</div>
      <div>zoom: ${this.zoom.toFixed(1)}</div>
      <div>
        <div id="map"></div>
        ${img}
      </div>
      <button id="print" @click=${this.print}>
        ${unsafeHTML(printerIcon)}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-app': DemoApp;
  }
}
