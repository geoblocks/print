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
      display: inline-block;
      background-color: lightgray;
    }
    #print {
      position: absolute;
      top: 9em;
      left: 2.5em;
      width: 30px;
      height: 30px;
    }
    #map {
      display: inline-block;
      width: 45%;
      height: calc(100vh - 32px - 20px);
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


  createMap() {
    this.mvtLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: '/tiles/{z}/{x}/{y}.pbf',
        maxZoom: 14,
        // extent: trackExtent,
      })
    });
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
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          source: new TileDebug({
            tileGrid: this.mvtLayer.getSource().getTileGrid()
          })
        }),
        this.printExtentLayer,
        this.mvtLayer
      ],
      view: new View({
        center: fromLonLat([6.57253, 46.51336]),
        zoom: 14
      })
    })
    this.map.on('postcompose', evt => {
      const res = evt.frameState.viewState.resolution;
      //const printResolution = 1 / PIXELS_PER_METER / this.printScale;
      drawPaperDimensions(evt, this.getPrintDimensions(res));
    })
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
      ${extent}
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
