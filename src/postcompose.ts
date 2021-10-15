import Map from 'ol/Map';
import RenderEvent from 'ol/render/Event';
import {Extent} from 'ol/extent';

/**
 * Center the print extent (in pixels) inside the viewport
 * @param dimensions size in pixels of the print extent
 * @param viewportWidth the width in pixels of the map displayed in the browser
 * @param viewportHeight the height in pixels of the map displayed in the browser
 * @return position of the centered print rectangle
 */
export function centerPrintExtent(
  dimensions: number[],
  viewportWidth: number,
  viewportHeight: number
): Extent {
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  const [printWidthInPixels, printHeightInPixels] = dimensions;
  const minX = centerX - printWidthInPixels / 2;
  const minY = centerY - printHeightInPixels / 2;
  return [minX, minY, minX + printWidthInPixels, minY + printHeightInPixels];
}

export function drawPrintExtent(
  event: RenderEvent,
  dimensions: number[]
): void {
  const viewport = (event.target as Map).getViewport();
  const canvases = viewport.getElementsByTagName('canvas');

  const frameState = event.frameState!;
  const viewportWidth = Number(
    (frameState.size[0] * frameState.pixelRatio).toFixed()
  );
  const viewportHeight = Number(
    (frameState.size[1] * frameState.pixelRatio).toFixed()
  );

  const printPosition = centerPrintExtent(
    dimensions,
    viewportWidth,
    viewportHeight
  );

  for (let i = canvases.length - 1; i >= 0; i--) {
    // layer creates new canvas on high resolution devices
    const canvas = canvases.item(i)!;
    const context = canvas.getContext('2d')!;

    if (canvas.width === viewportWidth && canvas.height === viewportHeight) {
      // checks for correct canvas
      context.beginPath();

      // outer rectangle
      context.rect(0, 0, viewportWidth, viewportHeight);

      // inner rectangle
      context.rect(
        printPosition[0],
        printPosition[1],
        dimensions[0],
        dimensions[1]
      );

      context.fillStyle = 'rgba(0, 5, 25, 0.15)';
      context.fill('evenodd');
      break; // extent should be added only for a newest canvas
    }
  }
}
