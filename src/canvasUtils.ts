const scratchOpacityCanvas = document.createElement('canvas');

/**
 * @param {HTMLCanvasElement} inCanvas
 * @param {number} opacity
 */
 export function asOpacity(inCanvas, opacity) {
  const outCanvas = scratchOpacityCanvas;
  outCanvas.width = inCanvas.width;
  outCanvas.height = inCanvas.height;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.globalAlpha = opacity;
  outCtx.drawImage(inCanvas, 0, 0);
  return outCanvas;
}
