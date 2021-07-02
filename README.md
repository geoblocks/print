# Geoblocks print

This project provides low level functionnalities for rendering OpenLayers layers to images of arbitrary resolution.

Implemented:
- Mapbox Vector Tiles (MVT)

## Example

![image](https://user-images.githubusercontent.com/7294662/124280423-f6d1b980-db48-11eb-9848-beb24d3bf22c.png)

## Getting started

```
git clone https://github.com/geoblocks/print
cd print
npm install
npm start
open http://localhost:3000/
```

## Data

### Creating a test MVT dataset

- Draw a GPX
- Convert it to GeoJSON: ogr2ogr output.geojson input.gpx tracks
- Create vector tiles:
  - git clone https://github.com/mapbox/tippecanoe.git
  - cd tippecanoe ; make -j; cd -
  - tippecanoe/tippecanoe output.geojson -e public/tiles --no-tile-compression
