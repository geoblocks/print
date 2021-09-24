import { LitElement, html, css, TemplateResult } from 'lit'
import {customElement, state, query} from 'lit/decorators.js'
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import OSM from 'ol/source/OSM'
import TileLayer from 'ol/layer/Tile'
import OLMap from "ol/Map"
import {fromLonLat, toLonLat} from 'ol/proj'
import View from 'ol/View'
import {computePrintPosition, drawPaperDimensions} from '../postcompose'
import {PDF_POINTS_PER_METER} from '../constants'
import {printerIcon} from '../printer';
import VectorTileSource from 'ol/source/VectorTile'
import VectorTileLayer from 'ol/layer/VectorTile'
import MVT from 'ol/format/MVT'
import {Extent} from 'ol/extent'
import MVTEncoder from '../MVTEncoder'
import TileDebug from 'ol/source/TileDebug';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import stylefunction from "ol-mapbox-style/dist/stylefunction";
import TileGrid from 'ol/tilegrid/TileGrid';
import {extentFromProjection} from "ol/tilegrid";

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('demo-app')
export class DemoApp extends LitElement {
  static styles = css`
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
    .ol-control {
      position: absolute;
      background-color: rgba(255,255,255,0.4);
      border-radius: 4px;
      padding: 2px;
    }
    .ol-control:hover {
      background-color: rgba(255,255,255,0.6);
    }
    .ol-zoom {
      top: .5em;
      left: .5em;
    }
    .ol-control button {
      display: block;
      margin: 1px;
      padding: 0;
      color: white;
      font-size: 1.14em;
      font-weight: bold;
      text-decoration: none;
      text-align: center;
      height: 1.375em;
      width: 1.375em;
      line-height: .4em;
      background-color: rgba(0,60,136,0.5);
      border: none;
      border-radius: 2px;
    }
    .ol-control button::-moz-focus-inner {
      border: none;
      padding: 0;
    }
    .ol-rotate {
      top: .5em;
      right: .5em;
      transition: opacity .25s linear, visibility 0s linear;
    }
    .ol-rotate.ol-hidden {
      opacity: 0;
      visibility: hidden;
      transition: opacity .25s linear, visibility 0s linear .25s;
    }
    .ol-attribution li {
      display: inline;
      list-style: none;
    }
    .ol-attribution li:not(:last-child):after {
      content: " ";
    }
    .ol-attribution img {
      max-height: 2em;
      max-width: inherit;
      vertical-align: middle;
    }
    .ol-attribution button {
      flex-shrink: 0;
    }
    .ol-attribution.ol-collapsed ul {
      display: none;
    }
    .ol-attribution:not(.ol-collapsed) {
      background: rgba(255,255,255,0.8);
    }
    .ol-attribution.ol-uncollapsible {
      bottom: 0;
      right: 0;
      border-radius: 4px 0 0;
    }
    .ol-attribution.ol-uncollapsible img {
      margin-top: -.2em;
      max-height: 1.6em;
    }
    .ol-attribution.ol-uncollapsible button {
      display: none;
    }
    .ol-viewport, .ol-unselectable {
      user-select: none;
    }
    .ol-selectable {
      user-select: text;
    }


  `

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
  private zoom: number = -1;

  configureVTStyle(layer, url) {
    fetch(url)
    .then(r => r.json())
    .then(style => {
        let spriteUrl, spriteDataUrl, spriteImageUrl, addMpFonts;

        if (style.sprite) {
            spriteUrl = style.sprite;

            // support relative spriteUrls
            if (spriteUrl.includes("./")) {
                spriteUrl = new URL(spriteUrl, url);
            }

            spriteDataUrl = spriteUrl.toString().concat(".json");
            spriteImageUrl = spriteUrl.toString().concat(".png");

            fetch(spriteDataUrl)
                .then(r => r.json())
                .then(r => r.data)
                .then(spriteData => {
                    stylefunction(layer, style, Object.keys(style.sources)[0], undefined, spriteData, spriteImageUrl, addMpFonts);
                }
                );
        }
        else {
            stylefunction(layer, style, Object.keys(style.sources)[0], undefined, undefined, undefined, addMpFonts);
        }
    });

  }

  createMap() {
    const extent = extentFromProjection('EPSG:3857');
    const origin = [extent[0], extent[3]];
    this.mvtLayer = new VectorTileLayer({
      // style(feature) {
      //   if (feature.getGeometry()?.getType() === 'Point') {
      //     return new Style({
      //       text: new Text({
      //         font: 'bold 28px beach',
      //         text: 'beach',
      //         offsetY: 40,
      //       }),
      //       image: new Icon({
      //         src: `/beach.svg`,
      //         opacity: 0.5,
      //         scale: 0.05,
      //       })
      //     })
      //   }
      //   return new Style({
      //     stroke: new Stroke({
      //       color: 'red'
      //     }),
      //   })
      // },
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: new TileGrid({
          tileSize: 512,
          resolutions: [78271.5169640117238, 39135.7584820058619,
            19567.8792410029309, 9783.93962050146547, 4891.96981025073273,
            2445.98490512536637, 1222.99245256268318, 611.496226281341592,
            305.7481131406708, 152.8740565703354, 76.437028285167699,
            38.2185141425838495, 19.1092570712919247, 9.55462853564596237,
            4.77731426782298119, 2.38865713391149059, 1],
            extent: extent,
            origin: origin,
        }),
        url: 'https://adv-smart.de/tiles/smarttiles_de_public/{z}/{x}/{y}.pbf',
        maxZoom: 14,
        // extent: trackExtent,
      })
    });
    this.configureVTStyle(this.mvtLayer,
      //'https://dev.adv-smart.de/styles/public/v0/de_style_grey.json'
      'https://adv-smart.de/styles/public/de_style_hillshade.json'
    );
    this.printExtentLayer = new VectorLayer({
      // @ts-ignore we add custom property, which is fine with OL
      'name': 'printExtent',
      source: new VectorSource({
        features: []
      })
    })
    this.map = new OLMap({
      target: this.mapEl,
      layers: [
        // new TileLayer({
        //   source: new OSM(),
        // }),
        this.printExtentLayer,
        this.mvtLayer,
        new TileLayer({
          //zIndex: 10000,
          source: new TileDebug({
            tileGrid: this.mvtLayer.getSource().getTileGrid()
          })
        }),
      ],
      view: new View({
        center: fromLonLat([8.355,47.576]),
        zoom: 14
      })
    })
    this.map.on('postcompose', evt => {
      const res = evt.frameState.viewState.resolution;
      //const printResolution = 1 / PIXELS_PER_METER / this.printScale;
      drawPaperDimensions(evt, this.getPrintDimensions(res));
    });
    this.map.getView().on('change:resolution', () => {
      this.zoom = this.map?.getView().getZoom() || -1;
    })
    this.zoom = this.map?.getView().getZoom() || -1;
  }

  getPrintDimensions(resolution) {
    return this.targetSizeInPdfPoints.map(side => (
      side / PDF_POINTS_PER_METER / resolution / this.printScale * devicePixelRatio)
    );
  }

  firstUpdated() {
    this.createMap()
  }

  async print() {
    const encoder = new MVTEncoder();
    const viewResolution = this.map?.getView().getResolution()!;
    const size = this.map!.getSize()!;

    const pp = computePrintPosition(this.getPrintDimensions(viewResolution), size[0], size[1]);
    const printExtent: Extent = [
      ...this.map!.getCoordinateFromPixel([pp[0], pp[3]]),
      ...this.map!.getCoordinateFromPixel([pp[2], pp[1]]), // top right
    ] as Extent;
    this.printExtentLayer?.getSource().clear();
    this.printExtentLayer?.getSource().addFeature(new Feature({
      geometry: polygonFromExtent(printExtent)
    }))
    const result = await encoder.encodeMVTLayer(this.mvtLayer!, viewResolution, printExtent);
    console.log(result);
    this.result0 = result[0];
  }

  render() {
    let img: TemplateResult|'' = '';
    let extent: TemplateResult|'' = '';
    if (this.result0) {
      const e = this.result0.extent;
      const c0 = [e[0], e[1]];
      const c1 = [e[2], e[3]];
      img = html`<img id="side" src="${this.result0.baseURL}" />`
      extent = html`<div>${JSON.stringify(toLonLat(c0, 'EPSG:3857'))} ${JSON.stringify(toLonLat(c1, 'EPSG:3857'))}</div>`;
    }
    return html`
      <div>${extent || 'Move around and click the print button...'}</div>
      <div>zoom: ${this.zoom.toFixed(1)}</div>
      <div>
        <div id="map"></div>
        ${img}
      </div>
      <button id="print" @click=${this.print}>${unsafeHTML(printerIcon)}</button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-app': DemoApp
  }
}
