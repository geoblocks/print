import{c as q,g as J,a as O,b as _,t as M,s as K,M as E,C as j,d as G,e as Q,f as ee,R as te,r as oe,h as V,i as ie,j as b,k as re,l as $,V as se,m as ne,O as ae,n as ce,F as le,o as de,p as U,S as N,T as pe,I as ue,q as he,u as B,v as z,w as me,x as W,y as H,z as ge,A as fe,B as A,D as Z,E as xe,G as we}from"./vendor.dcf92ac3.js";const ye=function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function e(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerpolicy&&(s.referrerPolicy=t.referrerpolicy),t.crossorigin==="use-credentials"?s.credentials="include":t.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(t){if(t.ep)return;t.ep=!0;const s=e(t);fetch(t.href,s)}};ye();const be=document.createElement("canvas");function ve(o,r){const e=be;e.width=o.width,e.height=o.height;const i=e.getContext("2d");return i.globalAlpha=r,i.drawImage(o,0,0),e}function ke(o,r,e){const i=q(),t=J(o),s=O(o),n=_(o),a=s/n,c=r/e;return console.assert(Math.abs(a/c-1)<.01,`extent and canvas don't have same ratio: ${a}, ${c}`),M(i,0,e),K(i,r/s,-e/n),M(i,-t[0],-t[1]),i}function Pe(o,r,e){const i=e.getZForResolution(r,.01),t=[];return e.forEachTileCoord(o,i,s=>{const n=e.getTileCoordExtent(s);t.push({coord:s,extent:n})}),t}class De{fetch(r,e){return typeof fetch!="undefined"?fetch(r,e):Promise.reject("no Fetch")}}const Ie=new De,Le=new E,X=class{drawFeaturesToContextUsingRenderAPI_(o,r,e,i,t,s,n){const a=1,c=new j(0,o.extent,e,a);let d;n&&(d=new j(0,o.extent,e,a));function l(){console.log("FIXME: some resource is now available, we should regenerate the image")}const h=function(f){let x;const L=f.getStyleFunction()||r;L&&(x=L(f,e));let S=!1;if(x){Array.isArray(x)||(x=[x]);const p=0;for(const y of x)S=oe(c,f,y,p,l,void 0,d)||S}return S};let u=!1;o.features.forEach(f=>{u=h(f)||u}),u&&console.log("FIXME: some styles are still loading");const m=!0,T=c.finish(),R=new G(o.extent,e,a,m,T,s),k=1,P=i,D=0,I=!0;R.execute(t,k,P,D,I,void 0,null),d&&new G(o.extent,e,a,m,d.finish(),s).execute(t,k,P,D,I,void 0,n)}drawFeaturesToContextUsingImmediateAPI_(o,r,e,i,t){const s=[];let n=0;o.forEach(a=>{const c=r(a,e);c&&(Array.isArray(c)?c.forEach((d,l)=>{s.push({zIndex:d.getZIndex(),feature:a,naturalOrder:++n,styleIdx:l})}):s.push({zIndex:c.getZIndex(),feature:a,naturalOrder:++n,styleIdx:-1}))}),s.sort((a,c)=>(a.zIndex||0)-(c.zIndex||0)||a.naturalOrder-c.naturalOrder);for(const a of s){const c=r(a.feature,e),d=a.styleIdx===-1?c:c[a.styleIdx];t.setStyle(d);let l=d.getGeometry();typeof l=="function"&&(l=l()),l||(l=a.feature.getGeometry()),l=Object.assign(Object.create(Object.getPrototypeOf(l)),l);const h=l.flatCoordinates_,u=l.flatCoordinates_=new Array(h.length),m=l.getStride();Q(h,0,h.length,m,i,u),t.drawGeometry(l)}}createRenderContext(o,r,e){const i=O(r)/e,t=_(r)/e,s=[i,t],n=o.getContext("2d");if(!n)throw new Error(`Could not get the context ${o.width}x${o.height}, expected ${i}x${t})`);return ee(n,{size:s,pixelRatio:1})}snapTileResolution(o,r){const e=o.getResolutions();let i=e[e.length-2];for(let t=e.length-2;t>=0;t--){const s=e[t];if(s<=r)i=s;else break}return i}async encodeMVTLayer(o,r,e,i={}){const t=o.getRenderBuffer()??100,s=o.getSource(),n=s.getProjection(),a=s.getTileGrid(),c=i.monitorResolution||r,d=i.tileResolution||c,l=this.snapTileResolution(a,d),h=Pe(e,l,a),u=s.getTileUrlFunction(),m=h.map(p=>{const y=u(p.coord,1,n);return y?Ie.fetch(y).then(C=>C.arrayBuffer()).then(C=>({features:Le.readFeatures(C,{extent:p.extent,featureProjection:n}),extent:p.extent,url:y})):Promise.reject("Could not create URL")}),T=(await Promise.allSettled(m)).filter(p=>p.status==="fulfilled").map(p=>p.value),R=[{printExtent:e}],k=i.paperDPI||254,P=i.monitorDPI||96,D=i.canvasResolution||P/k*c,I=i.styleResolution||l,f=o.getStyleFunction(),x=o.get("opacity"),L=o.getDeclutter()?new te(9):void 0;return R.map(p=>this.renderTile(T,p.printExtent,D,I,f,x,t,L))}renderTile(o,r,e,i,t,s,n,a){const c=document.createElement("canvas"),d=this.createRenderContext(c,r,e),l=c.getContext("2d");o.forEach(u=>{const m=ke(r,c.width,c.height);X.useImmediateAPI?this.drawFeaturesToContextUsingImmediateAPI_(u.features,t,i,m,d):this.drawFeaturesToContextUsingRenderAPI_(u,t,i,m,l,n,a)});const h=(s===1?c:ve(c,s)).toDataURL("PNG");return{extent:r,baseURL:h}}};let F=X;F.useImmediateAPI=!1;const Se=72,Te=.0254,Re=Se/Te;function Y(o,r,e){const i=r/2,t=e/2,[s,n]=o,a=i-s/2,c=t-n/2;return[a,c,a+s,c+n]}function Ce(o,r){const i=o.target.getViewport().getElementsByTagName("canvas"),t=o.frameState,s=Number((t.size[0]*t.pixelRatio).toFixed()),n=Number((t.size[1]*t.pixelRatio).toFixed());for(let a=i.length-1;a>=0;a--){const c=i.item(a),d=c.getContext("2d");if(c.width===s&&c.height===n){const l=Y(r,s,n);d.beginPath(),d.rect(0,0,s,n),d.rect(l[0],l[1],r[0],r[1]),d.fillStyle="rgba(0, 5, 25, 0.15)",d.fill("evenodd");break}}}const Ee=V`
  .ol-control {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    padding: 2px;
  }
  .ol-control:hover {
    background-color: rgba(255, 255, 255, 0.6);
  }
  .ol-zoom {
    top: 0.5em;
    left: 0.5em;
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
    line-height: 0.4em;
    background-color: rgba(0, 60, 136, 0.5);
    border: none;
    border-radius: 2px;
  }
  .ol-control button::-moz-focus-inner {
    border: none;
    padding: 0;
  }
  .ol-rotate {
    top: 0.5em;
    right: 0.5em;
    transition: opacity 0.25s linear, visibility 0s linear;
  }
  .ol-rotate.ol-hidden {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s linear, visibility 0s linear 0.25s;
  }
  .ol-attribution li {
    display: inline;
    list-style: none;
  }
  .ol-attribution li:not(:last-child):after {
    content: ' ';
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
    background: rgba(255, 255, 255, 0.8);
  }
  .ol-attribution.ol-uncollapsible {
    bottom: 0;
    right: 0;
    border-radius: 4px 0 0;
  }
  .ol-attribution.ol-uncollapsible img {
    margin-top: -0.2em;
    max-height: 1.6em;
  }
  .ol-attribution.ol-uncollapsible button {
    display: none;
  }
  .ol-viewport,
  .ol-unselectable {
    user-select: none;
  }
  .ol-selectable {
    user-select: text;
  }
`,ze=`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg
    xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:cc="http://web.resource.org/cc/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:sodipodi="http://inkscape.sourceforge.net/DTD/sodipodi-0.dtd"
    xmlns:svg="http://www.w3.org/2000/svg"
    xmlns:ns1="http://sozi.baierouge.fr"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    id="svg1468"
    sodipodi:docname="printer1.svg"
    viewBox="0 0 187.5 187.5"
    sodipodi:version="0.32"
    version="1.0"
    y="0"
    x="0"
    inkscape:version="0.42"
  >
  <sodipodi:namedview
      id="base"
      bordercolor="#666666"
      inkscape:pageshadow="2"
      inkscape:window-width="704"
      pagecolor="#ffffff"
      inkscape:zoom="1.8346667"
      inkscape:window-x="66"
      borderopacity="1.0"
      inkscape:current-layer="svg1468"
      inkscape:cx="93.750000"
      inkscape:cy="93.750000"
      inkscape:window-y="66"
      inkscape:window-height="510"
      inkscape:pageopacity="0.0"
  />
  <g
      id="layer1"
    >
    <g
        id="g2388"
        transform="translate(-527.55 -379)"
      >
      <rect
          id="rect2352"
          style="stroke-linejoin:round;stroke:#000000;stroke-linecap:round;stroke-width:3.1212;fill:#ffffff"
          rx="10"
          ry="10"
          height="58.321"
          width="145.8"
          y="448.86"
          x="547.3"
      />
      <rect
          id="rect2356"
          style="stroke-linejoin:round;stroke:#000000;stroke-linecap:round;stroke-width:3.1212;fill:#ffffff"
          height="39.464"
          width="87.326"
          y="498.72"
          x="576.54"
      />
      <path
          id="path2358"
          style="stroke:#000000;stroke-linecap:round;stroke-width:4.0576;fill:none"
          d="m561.88 468.75h115.32"
      />
      <rect
          id="rect2360"
          style="stroke-linejoin:round;stroke:#000000;stroke-linecap:round;stroke-width:3.1212;fill:#ffffff"
          height="44.549"
          width="87.482"
          y="404.06"
          x="576.46"
      />
      <path
          id="path2362"
          style="stroke:#000000;stroke-width:2.0808;fill:none"
          d="m587.07 527.07h66.27"
      />
      <path
          id="path2364"
          style="stroke:#000000;stroke-width:2.0808;fill:none"
          d="m587.07 520.44h66.27"
      />
      <path
          id="path2366"
          style="stroke:#000000;stroke-width:2.0808;fill:none"
          d="m587.07 513.81h66.27"
      />
      <path
          id="path2368"
          style="stroke:#000000;stroke-width:2.0808;fill:none"
          d="m587.07 507.19h66.27"
      />
    </g
    >
  </g
  >
  <metadata
    >
    <rdf:RDF
      >
      <cc:Work
        >
        <dc:format
          >image/svg+xml</dc:format
        >
        <dc:type
            rdf:resource="http://purl.org/dc/dcmitype/StillImage"
        />
        <cc:license
            rdf:resource="http://creativecommons.org/licenses/publicdomain/"
        />
        <dc:publisher
          >
          <cc:Agent
              rdf:about="http://openclipart.org/"
            >
            <dc:title
              >Openclipart</dc:title
            >
          </cc:Agent
          >
        </dc:publisher
        >
        <dc:title
          >Printer icon</dc:title
        >
        <dc:date
          >2006-12-26T00:00:00</dc:date
        >
        <dc:description
        />
        <dc:source
          >https://openclipart.org/detail/24825/-by--24825</dc:source
        >
        <dc:creator
          >
          <cc:Agent
            >
            <dc:title
              >Anonymous</dc:title
            >
          </cc:Agent
          >
        </dc:creator
        >
      </cc:Work
      >
      <cc:License
          rdf:about="http://creativecommons.org/licenses/publicdomain/"
        >
        <cc:permits
            rdf:resource="http://creativecommons.org/ns#Reproduction"
        />
        <cc:permits
            rdf:resource="http://creativecommons.org/ns#Distribution"
        />
        <cc:permits
            rdf:resource="http://creativecommons.org/ns#DerivativeWorks"
        />
      </cc:License
      >
    </rdf:RDF
    >
  </metadata
  >
</svg
>
`;var Ae=Object.defineProperty,Fe=Object.getOwnPropertyDescriptor,w=(o,r,e,i)=>{for(var t=i>1?void 0:i?Fe(r,e):r,s=o.length-1,n;s>=0;s--)(n=o[s])&&(t=(i?n(r,e,t):n(t))||t);return i&&t&&Ae(r,e,t),t};const v={demo:"mapbox2",declutter:!0,immediateApi:!1};let g=class extends re{constructor(){super(...arguments);this.targetSizeInPdfPoints=[510,710],this.printScale=1/5e3,this.zoom=-1,this.currentDemo=v.demo,this.shouldDeclutter=v.declutter,this.useImmediateApi=v.immediateApi}configureVTStyle(o,r){fetch(r).then(e=>e.json()).then(e=>{let i,t,s,n;e.sprite?(i=e.sprite,i.includes("./")&&(i=new URL(i,r)),t=i.toString().concat(".json"),s=i.toString().concat(".png"),fetch(t).then(a=>a.json()).then(a=>a.data).then(a=>{$(o,e,Object.keys(e.sources)[0],void 0,a,s,n)})):$(o,e,Object.keys(e.sources)[0],void 0,void 0,void 0,n)})}createMap(){this.printExtentLayer=new se({name:"printExtent",source:new ne({features:[]})}),this.map=new ae({target:this.mapEl,layers:[],view:new ce({zoom:14})}),this.shouldDeclutter=v.declutter,this.updateDemo(v.demo),this.map.on("postcompose",o=>{const r=o.frameState.viewState.resolution;Ce(o,this.getPrintDimensions(r))}),this.map.getView().on("change:resolution",()=>{this.zoom=this.map?.getView().getZoom()||-1}),this.zoom=this.map?.getView().getZoom()||-1}getPrintDimensions(o){return this.targetSizeInPdfPoints.map(r=>r/Re/o/this.printScale*devicePixelRatio)}firstUpdated(){this.createMap()}async print(){F.useImmediateAPI=this.useImmediateApi;const o=new F,r=this.map.getView().getResolution(),e=this.map.getSize(),i=Y(this.getPrintDimensions(r),e[0],e[1]),t=[...this.map.getCoordinateFromPixel([i[0],i[3]]),...this.map.getCoordinateFromPixel([i[2],i[1]])];this.printExtentLayer?.getSource().clear(),this.printExtentLayer?.getSource().addFeature(new le({geometry:de(t)}));const s={canvasResolution:3},n=await o.encodeMVTLayer(this.mvtLayer,r,t,s);console.log(n),this.result0=n[0]}configureSimpleDemo(){this.mvtLayer=new U({declutter:this.shouldDeclutter,style(e){return e.getGeometry()?.getType()==="Point"?new N({text:new pe({font:"bold 28px beach",text:"beach",offsetY:40}),image:new ue({src:"/beach.svg",opacity:.5,scale:.05})}):new N({stroke:new he({color:"red"})})},source:new B({format:new E,url:"./tiles/{z}/{x}/{y}.pbf",maxZoom:14})});const o=this.map?.getLayers();o.clear();const r=[new z({source:new me}),this.mvtLayer,this.printExtentLayer,new z({zIndex:1e4,source:new W({tileGrid:this.mvtLayer.getSource().getTileGrid()})})];o.extend(r),this.map?.getView().setCenter(H([6.57253,46.51336]))}configureMapboxDemo1(){this.configureMapboxDemo("https://adv-smart.de/tiles/smarttiles_de_public/{z}/{x}/{y}.pbf","https://adv-smart.de/styles/public/de_style_hillshade.json")}configureMapboxDemo2(){this.configureMapboxDemo("https://adv-smart.de/tiles/smarttiles_de_public_v1/{z}/{x}/{y}.pbf","https://adv-smart.de/styles/public/de_style_hillshade.json")}configureMapboxDemo(o,r){const e=ge("EPSG:3857"),i=[e[0],e[3]];this.mvtLayer=new U({declutter:this.shouldDeclutter,source:new B({format:new E,tileGrid:new fe({tileSize:512,resolutions:[78271.51696401172,39135.75848200586,19567.87924100293,9783.939620501465,4891.969810250733,2445.9849051253664,1222.9924525626832,611.4962262813416,305.7481131406708,152.8740565703354,76.4370282851677,38.21851414258385,19.109257071291925,9.554628535645962,4.777314267822981,2.3886571339114906,1],extent:e,origin:i}),url:o,maxZoom:14})}),this.configureVTStyle(this.mvtLayer,r);const t=this.map?.getLayers();t.clear();const s=[this.mvtLayer,this.printExtentLayer,new z({zIndex:1e4,source:new W({tileGrid:this.mvtLayer.getSource().getTileGrid()})})];t.extend(s),this.map?.getView().setCenter(H([9.9909,53.54777]))}updateDemo(o){switch(this.currentDemo=o,o){case"simple":this.configureSimpleDemo();break;case"mapbox1":this.configureMapboxDemo1();break;case"mapbox2":this.configureMapboxDemo2();break}}render(){let o="",r="";if(this.result0){const e=this.result0.extent,i=[e[0],e[1]],t=[e[2],e[3]];o=A`<img id="side" src="${this.result0.baseURL}" />`,r=A`<div>
        ${JSON.stringify(Z(i,"EPSG:3857"))}
        ${JSON.stringify(Z(t,"EPSG:3857"))}
      </div>`}return A`
      <label for="demo-select">Choose a demo:</label>
      <select
        name="demos"
        id="demo-select"
        .value="${this.currentDemo}"
        @change=${e=>this.updateDemo(e.target.value)}
      >
        <option value="simple">Basic style function</option>
        <option value="mapbox1">OL-Mapbox-style1</option>
        <option value="mapbox2">OL-Mapbox-style2</option>
      </select>
      <label>
        <input
          type="checkbox"
          ?checked=${this.shouldDeclutter}
          @change=${e=>{this.shouldDeclutter=e.target.checked,this.updateDemo(this.currentDemo)}}
        />
        declutter
      </label>
      <label>
        <input
          type="checkbox"
          ?checked=${this.useImmediateApi}
          @change=${e=>{this.useImmediateApi=e.target.checked}}
        />immediate API
      </label>
      <div>${r||"Move around and click the print button..."}</div>
      <div>zoom: ${this.zoom.toFixed(1)}</div>
      <div>
        <div id="map"></div>
        ${o}
      </div>
      <button id="print" @click=${this.print}>
        ${xe(ze)}
      </button>
    `}};g.styles=[V`
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
    `,Ee];w([ie("#map")],g.prototype,"mapEl",2);w([b()],g.prototype,"result0",2);w([b()],g.prototype,"zoom",2);w([b()],g.prototype,"currentDemo",2);w([b()],g.prototype,"shouldDeclutter",2);w([b()],g.prototype,"useImmediateApi",2);g=w([we("demo-app")],g);
//# sourceMappingURL=demo.d15c46ce.js.map
