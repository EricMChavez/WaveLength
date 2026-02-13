import type { PixelRect } from '../../shared/grid/types.ts';

/**
 * Noise grain overlay for gameboard surface texture.
 *
 * Uses a cached OffscreenCanvas of random grayscale pixels, drawn at
 * reduced resolution (tileSize controls pixel scale) for performance.
 * The cache is regenerated only when gameboard pixel dimensions change.
 */

let _cachedCanvas: OffscreenCanvas | null = null;
let _cachedWidth = 0;
let _cachedHeight = 0;
let _cachedTileSize = 0;

/**
 * Get or regenerate the noise texture at the given dimensions.
 * The texture is a random grayscale pattern at reduced resolution.
 */
function getNoiseTexture(width: number, height: number, tileSize: number): OffscreenCanvas | null {
  const scaledW = Math.ceil(width / tileSize);
  const scaledH = Math.ceil(height / tileSize);

  if (_cachedCanvas && _cachedWidth === scaledW && _cachedHeight === scaledH && _cachedTileSize === tileSize) {
    return _cachedCanvas;
  }

  if (typeof OffscreenCanvas === 'undefined') return null;
  const canvas = new OffscreenCanvas(scaledW, scaledH);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Fallback — return an empty canvas
    _cachedCanvas = canvas;
    _cachedWidth = scaledW;
    _cachedHeight = scaledH;
    _cachedTileSize = tileSize;
    return canvas;
  }

  const imageData = ctx.createImageData(scaledW, scaledH);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;     // R
    data[i + 1] = v; // G
    data[i + 2] = v; // B
    data[i + 3] = 255; // A (opacity handled by globalAlpha)
  }

  ctx.putImageData(imageData, 0, 0);

  _cachedCanvas = canvas;
  _cachedWidth = scaledW;
  _cachedHeight = scaledH;
  _cachedTileSize = tileSize;
  return canvas;
}

/**
 * Draw noise grain over a rectangular area.
 * Clips to the rect, uses 'overlay' composite operation for subtle texture.
 *
 * @param ctx - Canvas rendering context
 * @param rect - Area to cover with noise
 * @param opacity - Noise opacity (typically 0.01-0.05)
 * @param tileSize - Pixel scale for noise (2 = half-res, 1 = full-res)
 */
export function drawNoiseGrain(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  opacity: number,
  tileSize: number = 2,
): void {
  if (opacity <= 0) return;

  const texture = getNoiseTexture(rect.width, rect.height, tileSize);
  if (!texture) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = opacity;
  ctx.drawImage(texture, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}
