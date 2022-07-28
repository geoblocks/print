/* global test, expect */

import VectorTileSource from 'ol/source/VectorTile.js';
import {Extent, getHeight, getWidth} from 'ol/extent.js';
import {
  createWorldToVectorContextTransform,
  listTilesCoveringExtentAtResolution,
} from './encodeutils';
import {fromLonLat} from 'ol/proj.js';
import {transform2D} from 'ol/geom/flat/transform.js';

const LV03_EXTENT: Extent = [420000, 30000, 900000, 350000];
const LV03_W = getWidth(LV03_EXTENT);
const LV03_H = getHeight(LV03_EXTENT);

test('WorldToVectorContextTransform', () => {
  // ratio 3 / 2 comes from the Swiss extent dimensions
  const tr = createWorldToVectorContextTransform(LV03_EXTENT, 3, 2);

  expect(transform2D(LV03_EXTENT, 0, 4, 2, tr)).toStrictEqual([0, 2, 3, 0]); //
  expect(
    transform2D(
      [5 * LV03_W + LV03_EXTENT[0], 5 * LV03_H + LV03_EXTENT[1]],
      0,
      2,
      2,
      tr
    )
  ).toStrictEqual([
    5 * 3, // the bottom left x is translated to the right of 5 canvas widths
    2 - 5 * 2, // the bottom left y (2 in CSS coordinates) is tranlated to the top of 5 canvas heights
  ]);

  const tr2 = createWorldToVectorContextTransform(LV03_EXTENT, 3000, 2000); // canvas is 1000x bigger
  expect(transform2D(LV03_EXTENT, 0, 4, 2, tr2)).toStrictEqual([
    0, 2000, 3000, 0,
  ]); // result is scaled 1000x
  expect(
    transform2D(
      [5 * LV03_W + LV03_EXTENT[0], 5 * LV03_H + LV03_EXTENT[1]],
      0,
      2,
      2,
      tr2
    )
  ).toStrictEqual([15000, -8000]);
});

test('listTiles', () => {
  const printExtent = [
    ...fromLonLat([6.536781518249511, 46.498738845229354]),
    ...fromLonLat([6.608278481750488, 46.527977222198444]),
  ] as Extent;
  const printResolution = 42;
  const tileGrid = new VectorTileSource({
    maxZoom: 15,
  }).getTileGrid()!;
  const tiles = listTilesCoveringExtentAtResolution(
    printExtent,
    printResolution,
    tileGrid
  );
  expect(tiles).toEqual([
    {
      'coord': [10, 530, 362],
      'extent': [
        704443.6526761837, 5831228.013819527, 743579.411158194,
        5870363.772301537,
      ],
    },
  ]);
});
