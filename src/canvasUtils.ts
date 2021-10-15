let scratchOpacityCanvas: HTMLCanvasElement;

/**
 *
 * @param inCanvas input canvas
 * @param opacity input opacity
 * @return same or new canvas drawn with given opacity
 */
export function asOpacity(
  inCanvas: HTMLCanvasElement,
  opacity: number
): HTMLCanvasElement {
  if (opacity === 1) {
    return inCanvas;
  }
  if (!scratchOpacityCanvas) {
    scratchOpacityCanvas = document.createElement('canvas');
  }
  const outCanvas = scratchOpacityCanvas;
  outCanvas.width = inCanvas.width;
  outCanvas.height = inCanvas.height;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.globalAlpha = opacity;
  outCtx.drawImage(inCanvas, 0, 0);
  return outCanvas;
}

/**
 * When the printed area is defined in cms on paper, this function can be used
 * to compute the size of the pixel-perfect image, in dots/pixels.
 * @param dimensions the dimensions of the printed area, on the paper, in cm
 * @param dpi the resolution of the printer
 * @return the dimensions of the canvas, in pixels
 */
export function canvasSizeFromDimensionsInCm(
  dimensions: [number, number],
  dpi: number
): [number, number] {
  // cm -> inch: / 2.54 // this is a convention
  // inch -> dots: nbInches * dpi
  return dimensions.map((cm) => (cm * dpi) / 2.54) as [number, number];
}

/**
 * When the printed area is defined in pdf points, this function can be used
 * to compute the size of the pixel-perfect image, in dots/pixels.
 * @param dimensions the dimensions of the printed area, on the pdf, in pdf points
 * @param dpi the resolution of the printer
 * @return the dimensions of the canvas, in pixels
 */
export function canvasSizeFromDimensionsInPdfPoints(
  dimensions: [number, number],
  dpi: number
): [number, number] {
  // pdf-points -> inch: / 72 // this is a convention
  // inch -> dots: nbInches * dpi
  return dimensions.map((pdfPoints) => (pdfPoints * dpi) / 72) as [
    number,
    number
  ];
}
