import Map from 'ol/Map';
import RenderEvent from 'ol/render/Event';
import {Extent} from 'ol/extent';

export function computePrintPosition(
  dimensions: number[],
  viewportWidth: number,
  viewportHeight: number
): Extent {
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  const [paperSizePixelWidth, paperSizePixelHeight] = dimensions;
  const minX = centerX - paperSizePixelWidth / 2;
  const minY = centerY - paperSizePixelHeight / 2;
  return [minX, minY, minX + paperSizePixelWidth, minY + paperSizePixelHeight];
}

export function drawPaperDimensions(
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

  for (let i = canvases.length - 1; i >= 0; i--) {
    // layer creates new canvas on high resolution devices
    const canvas = canvases.item(i)!;
    const context = canvas.getContext('2d')!;

    if (canvas.width === viewportWidth && canvas.height === viewportHeight) {
      // checks for correct canvas
      const printPosition = computePrintPosition(
        dimensions,
        viewportWidth,
        viewportHeight
      );

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
