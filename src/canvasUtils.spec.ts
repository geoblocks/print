/* global test, expect */

import {
  asOpacity,
  canvasSizeFromDimensionsInCm,
  canvasSizeFromDimensionsInPdfPoints,
} from './canvasUtils';

const originalData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAkCAYAAAD/yagrAAAABmJLR0QA/wD/AP+gvaeTAAAARklEQVRYhe3OUQnAMBBAsa5i69/BzcI+HoxCoiDPzJl1gf134CvRmmhNtCZaE62J1kRrojXRmmhNtCZaE62J1kRrojXR2gvo0gOrl15u0wAAAABJRU5ErkJggg==';
test('asOpacity', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 42;
  canvas.height = 36;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.fillStyle = '#ff6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  expect(canvas.toDataURL('image/png')).toBe(originalData);
  expect(asOpacity(canvas, 1).toDataURL('image/png')).toBe(originalData);
  expect(asOpacity(canvas, 0.6).toDataURL('image/png')).toBe(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAkCAYAAAD/yagrAAAABmJLR0QA/wD/AP+gvaeTAAAARklEQVRYhe3OwQnAIAAAMeuw7tRp7Qo+AlK4TJBn7/WOH5i3A6eKakW1olpRrahWVCuqFdWKakW1olpRrahWVCuqFdWKah9xywNFvbIc4AAAAABJRU5ErkJggg=='
  );
});

test('canvasSizeFromDimensions', () => {
  expect(canvasSizeFromDimensionsInCm([10, 20], 254)).toStrictEqual([
    1000, 2000,
  ]);
  expect(canvasSizeFromDimensionsInPdfPoints([72, 216], 254)).toStrictEqual([
    254, 762,
  ]);
});
