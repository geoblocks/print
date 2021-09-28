const scratchOpacityCanvas = document.createElement('canvas');

export function asOpacity(
  inCanvas: HTMLCanvasElement,
  opacity: number
): HTMLCanvasElement {
  const outCanvas = scratchOpacityCanvas;
  outCanvas.width = inCanvas.width;
  outCanvas.height = inCanvas.height;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.globalAlpha = opacity;
  outCtx.drawImage(inCanvas, 0, 0);
  return outCanvas;
}
