import TileGrid from 'ol/tilegrid/TileGrid.js';
import {Extent, getBottomLeft, getHeight, getWidth} from 'ol/extent.js';
import {Transform, create, scale, translate} from 'ol/transform.js';

/**
 * Transform coordinates from world projection to canvas pixels.
 * The print extent is in world projection:
 *   - the bottom left is the point where the coordinates are the smaller;
 *   - when going right, x increases;
 *   - when going up, y increases.
 * The canvas is in pixel coordinates:
 *   - the top left is the point where the coorinates are the smaller;
 *   - whg going right, x increases;
 *   - when going down, y increases.
 * @param renderExtent The extent to render
 * @param width
 * @param height
 * @return the transform
 */
export function createWorldToVectorContextTransform(
  renderExtent: Extent,
  width: number,
  height: number
): Transform {
  const tr = create();
  const originRT = getBottomLeft(renderExtent);
  const eWidth = getWidth(renderExtent);
  const eHeight = getHeight(renderExtent);
  const r1 = eWidth / eHeight;
  const r2 = width / height;
  console.assert(
    Math.abs(r1 / r2 - 1) < 0.02,
    `extent and canvas don't have same ratio: ${r1}, ${r2}`
  );
  // mind that transforms are created in reverse order

  // we start with the action to do last: flipping the origin of y (due to CSS coordinate system)
  translate(tr, 0, height);
  // have it scaled so that the rendered extent fit in the target canvas
  scale(
    tr,
    width / eWidth,
    -height / eHeight // we multiply by -1 due to CSS coordinate system
  );
  // have bottom-left be [0,0]
  translate(tr, -originRT[0], -originRT[1]);
  return tr;
}

export interface CoordExtent {
  coord: import('ol/tilecoord.js').TileCoord;
  extent: import('ol/extent.js').Extent;
}

export function listTilesCoveringExtentAtResolution(
  printExtent: Extent,
  printResolution: number,
  tileGrid: TileGrid
): CoordExtent[] {
  const z = tileGrid.getZForResolution(printResolution, 0.01);
  // const tileResolution = tileGrid.getResolutions()[z];
  const tiles: CoordExtent[] = [];
  tileGrid.forEachTileCoord(printExtent, z, (coord) => {
    const tileExtent = tileGrid.getTileCoordExtent(coord);
    tiles.push({
      coord,
      extent: tileExtent,
    });
  });
  return tiles;
}
