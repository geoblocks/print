# Geoblocks print

This project provides low level functionalities for rendering OpenLayers layers to images of arbitrary resolution.

Supported layers:
- Mapbox Vector Tiles (MVT);

Supported styles:
- plain OpenLayers style functions;
- MapBox style processed by the `ol-mapbox-style` library.

Supported rendering methods:
- OpenLayers render API (feature complete, default);
- OpenLayers immediate API (basic, enable with `MVTEncoder.useImmediateAPI = true`).

## Demo

https://geoblocks.github.io/print


![image](https://user-images.githubusercontent.com/7294662/124280423-f6d1b980-db48-11eb-9848-beb24d3bf22c.png)


## Using

```bash
npm i @geoblocks/print
```

```js
import MVTEncoder from '@geoblocks/print';
const r = await new MVTEncoder().encodeMVTLayer({
  layer, // a plain OpenLayers MVT layer
  tileResolution, // the resolution to use for fetching features
  styleResolution, // the resolution to use for styling features
  printExtent, // the extent to print
  canvasSize, // the target size in dots of the rendered layer (depends of the dpi)
});
```

The result is tiled so that each image is reasonably big. Each tile result contains:
- a base64 encoded image: `r[i].baseURL`;
- the OL extent for this image: `r[i].extent`.


## Contributing

[contributing](./CONTRIBUTING.md)