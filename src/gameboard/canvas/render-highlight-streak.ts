import { HIGHLIGHT_STREAK } from '../../shared/constants/index.ts';
import { getDevOverrides } from '../../dev/index.ts';
import type { PixelRect } from '../../shared/grid/types.ts';

/** Resolved streak parameters for both layers. */
interface StreakParams {
  angleDeg: number;
  hardBandWidth: number;
  softBandWidth: number;
  warmTint: { r: number; g: number; b: number };
  useBlendModes: boolean;
}

// ---------------------------------------------------------------------------
// Reusable OffscreenCanvas buffer (grow-only, same pattern as render-noise-grain.ts)
// ---------------------------------------------------------------------------

let _streakBuffer: OffscreenCanvas | null = null;
let _bufferW = 0;
let _bufferH = 0;

function ensureBuffer(w: number, h: number): OffscreenCanvas | null {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const needW = Math.ceil(w);
  const needH = Math.ceil(h);
  if (_streakBuffer && _bufferW >= needW && _bufferH >= needH) return _streakBuffer;
  // Grow-only: take the max of current and needed
  const newW = Math.max(_bufferW, needW);
  const newH = Math.max(_bufferH, needH);
  _streakBuffer = new OffscreenCanvas(newW, newH);
  _bufferW = newW;
  _bufferH = newH;
  return _streakBuffer;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Draw a two-layer diagonal highlight streak across a rectangular region.
 *
 * Layer 1 (soft wash): wide, smooth gaussian-like gradient.
 * Layer 2 (hard band): narrow, hard-edged specular highlight.
 *
 * @param hardOpacity — opacity for the hard specular band
 * @param softOpacity — opacity for the soft diffuse wash
 * @param verticalFadeRatio — fraction of height that fades to transparent at top/bottom (0 = no fade)
 */
export function drawHighlightStreak(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  hardOpacity: number,
  softOpacity: number,
  verticalFadeRatio: number = 0,
): void {
  if (hardOpacity <= 0 && softOpacity <= 0) return;

  const params = getStreakParams();

  if (verticalFadeRatio > 0) {
    drawStreakWithFade(ctx, rect, null, hardOpacity, softOpacity, params, verticalFadeRatio);
    return;
  }

  // Fast path: no fade, draw directly
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();

  fillSoftWash(ctx, rect, softOpacity, params);
  fillHardBand(ctx, rect, hardOpacity, params);

  ctx.restore();
}

/**
 * Draw a highlight streak clipped to a rounded rectangle.
 * Used for nodes and meter housings that have rounded corners.
 */
export function drawHighlightStreakRounded(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  borderRadius: number | [number, number, number, number],
  hardOpacity: number,
  softOpacity: number,
  verticalFadeRatio: number = 0,
): void {
  if (hardOpacity <= 0 && softOpacity <= 0) return;

  const params = getStreakParams();

  if (verticalFadeRatio > 0) {
    drawStreakWithFade(ctx, rect, borderRadius, hardOpacity, softOpacity, params, verticalFadeRatio);
    return;
  }

  // Fast path: no fade, draw directly
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, borderRadius);
  ctx.clip();

  fillSoftWash(ctx, rect, softOpacity, params);
  fillHardBand(ctx, rect, hardOpacity, params);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Faded streak (OffscreenCanvas buffer approach)
// ---------------------------------------------------------------------------

/**
 * Draw the streak to a buffer, apply a vertical alpha fade mask, then composite
 * onto the main canvas with the appropriate blend mode and clip.
 */
function drawStreakWithFade(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  borderRadius: number | [number, number, number, number] | null,
  hardOpacity: number,
  softOpacity: number,
  params: StreakParams,
  fadeRatio: number,
): void {
  const buf = ensureBuffer(rect.width, rect.height);
  if (!buf) {
    // Fallback: draw without fade
    ctx.save();
    ctx.beginPath();
    if (borderRadius !== null) {
      ctx.roundRect(rect.x, rect.y, rect.width, rect.height, borderRadius);
    } else {
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.clip();
    fillSoftWash(ctx, rect, softOpacity, params);
    fillHardBand(ctx, rect, hardOpacity, params);
    ctx.restore();
    return;
  }

  // Draw each blend layer separately through the buffer
  if (softOpacity > 0) {
    drawFadedLayer(ctx, rect, borderRadius, fillSoftWash, softOpacity, params,
      params.useBlendModes ? 'soft-light' : 'source-over', fadeRatio, buf);
  }
  if (hardOpacity > 0) {
    drawFadedLayer(ctx, rect, borderRadius, fillHardBand, hardOpacity, params,
      params.useBlendModes ? 'screen' : 'source-over', fadeRatio, buf);
  }
}

/**
 * Draw one streak layer to the buffer with vertical fade, then composite onto main canvas.
 *
 * Steps:
 * 1. Clear buffer region
 * 2. Draw raw gradient (no blend modes) in local coords
 * 3. Apply vertical alpha mask via `destination-in`
 * 4. Composite masked buffer onto main canvas with clip + blend mode
 */
function drawFadedLayer(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  borderRadius: number | [number, number, number, number] | null,
  fillFn: (ctx: CanvasRenderingContext2D, rect: PixelRect, opacity: number, params: StreakParams) => void,
  opacity: number,
  params: StreakParams,
  blendMode: GlobalCompositeOperation,
  fadeRatio: number,
  buf: OffscreenCanvas,
): void {
  const bctx = buf.getContext('2d');
  if (!bctx) return;

  const w = Math.ceil(rect.width);
  const h = Math.ceil(rect.height);

  // 1. Clear the region we'll use
  bctx.clearRect(0, 0, w, h);

  // 2. Draw the raw gradient in local (0,0)-based coords, no blend modes
  const localRect: PixelRect = { x: 0, y: 0, width: rect.width, height: rect.height };
  const noBlendParams: StreakParams = { ...params, useBlendModes: false };
  fillFn(bctx as unknown as CanvasRenderingContext2D, localRect, opacity, noBlendParams);

  // 3. Apply vertical alpha mask via `destination-in`
  bctx.save();
  bctx.globalCompositeOperation = 'destination-in';
  const fadeH = rect.height * fadeRatio;
  const grad = bctx.createLinearGradient(0, 0, 0, rect.height);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  if (fadeH > 0 && rect.height > 0) {
    const fadeStop = Math.min(fadeRatio, 0.5);
    grad.addColorStop(fadeStop, 'rgba(0,0,0,1)');
    grad.addColorStop(1 - fadeStop, 'rgba(0,0,0,1)');
  }
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  bctx.fillStyle = grad;
  bctx.fillRect(0, 0, w, h);
  bctx.restore();

  // Reset buffer compositing
  bctx.globalCompositeOperation = 'source-over';

  // 4. Composite the masked buffer onto the main canvas
  ctx.save();
  ctx.beginPath();
  if (borderRadius !== null) {
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, borderRadius);
  } else {
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
  }
  ctx.clip();
  ctx.globalCompositeOperation = blendMode;
  ctx.drawImage(buf, 0, 0, w, h, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

const _hexToRgbObjCache = new Map<string, { r: number; g: number; b: number }>();

/** Parse a hex color string to RGB components (cached). */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cached = _hexToRgbObjCache.get(hex);
  if (cached) return cached;
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  cached = {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
  _hexToRgbObjCache.set(hex, cached);
  return cached;
}

/** Read shared streak geometry from dev overrides or constants. */
function getStreakParams(): StreakParams {
  const dev = getDevOverrides();
  if (dev.enabled) {
    return {
      angleDeg: dev.highlightStyle.angle,
      hardBandWidth: dev.highlightStyle.hardBandWidth,
      softBandWidth: dev.highlightStyle.softBandWidth,
      warmTint: hexToRgb(dev.highlightStyle.warmTint),
      useBlendModes: dev.highlightStyle.useBlendModes,
    };
  }
  return {
    angleDeg: HIGHLIGHT_STREAK.ANGLE_DEG,
    hardBandWidth: HIGHLIGHT_STREAK.HARD_BAND_WIDTH_RATIO,
    softBandWidth: HIGHLIGHT_STREAK.SOFT_BAND_WIDTH_RATIO,
    warmTint: HIGHLIGHT_STREAK.WARM_TINT,
    useBlendModes: true,
  };
}

/**
 * Get the light direction vector from the streak angle.
 * Used by inset shadow and other lighting effects for consistency.
 */
export function getLightDirection(): { x: number; y: number } {
  const dev = getDevOverrides();
  const angleDeg = dev.enabled ? dev.highlightStyle.angle : HIGHLIGHT_STREAK.ANGLE_DEG;
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}

/**
 * Compute gradient endpoints for the streak at a given angle.
 * The gradient axis runs perpendicular to the streak band direction.
 *
 * Uses the rectangle's support function so the gradient always spans
 * the full extent regardless of angle — band width stays constant.
 */
function getGradientEndpoints(rect: PixelRect, angleDeg: number) {
  const gradAngleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(gradAngleRad);
  const sin = Math.sin(gradAngleRad);

  // Half-dimensions and center
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const cx = rect.x + hw;
  const cy = rect.y + hh;

  // Maximum projection of any corner from center onto the gradient axis
  const extent = Math.abs(hw * cos) + Math.abs(hh * sin);

  return {
    x0: cx - extent * cos,
    y0: cy - extent * sin,
    x1: cx + extent * cos,
    y1: cy + extent * sin,
  };
}

/**
 * Layer 1: Soft diffuse wash — smooth gaussian-like gradient.
 * Uses multiple stops to approximate a bell curve across the band.
 * Uses 'soft-light' blend mode when enabled for more integrated lighting.
 */
function fillSoftWash(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  opacity: number,
  params: StreakParams,
): void {
  if (opacity <= 0) return;

  ctx.save();
  if (params.useBlendModes) {
    ctx.globalCompositeOperation = 'soft-light';
  }

  const { r, g, b } = params.warmTint;
  const { x0, y0, x1, y1 } = getGradientEndpoints(rect, params.angleDeg);
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);

  const halfBand = params.softBandWidth / 2;
  const center = HIGHLIGHT_STREAK.CENTER_POSITION;
  const bandStart = Math.max(0, center - halfBand);
  const bandEnd = Math.min(1, center + halfBand);

  // Approximate gaussian with 5 stops: 0% → 25% → 100% → 25% → 0%
  const q1 = bandStart + (center - bandStart) * 0.5;
  const q3 = center + (bandEnd - center) * 0.5;
  const peak = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  const quarter = `rgba(${r}, ${g}, ${b}, ${opacity * 0.25})`;

  grad.addColorStop(0, 'transparent');
  if (bandStart > 0.001) {
    grad.addColorStop(bandStart, 'transparent');
  }
  grad.addColorStop(q1, quarter);
  grad.addColorStop(center, peak);
  grad.addColorStop(q3, quarter);
  if (bandEnd < 0.999) {
    grad.addColorStop(bandEnd, 'transparent');
  }
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  ctx.restore();
}

/**
 * Layer 2: Hard specular band — narrow, hard-edged for the bright highlight.
 * Uses 'screen' blend mode when enabled for additive lighting.
 */
function fillHardBand(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  opacity: number,
  params: StreakParams,
): void {
  if (opacity <= 0) return;

  ctx.save();
  if (params.useBlendModes) {
    ctx.globalCompositeOperation = 'screen';
  }

  const { r, g, b } = params.warmTint;
  const { x0, y0, x1, y1 } = getGradientEndpoints(rect, params.angleDeg);
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);

  const halfBand = params.hardBandWidth / 2;
  const bandStart = Math.max(0, HIGHLIGHT_STREAK.CENTER_POSITION - halfBand);
  const bandEnd = Math.min(1, HIGHLIGHT_STREAK.CENTER_POSITION + halfBand);

  const tint = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  // Soft edge ramp (3% of gradient span) for a smoother specular highlight
  const SOFT_EDGE = 0.03;
  grad.addColorStop(0, 'transparent');
  if (bandStart - SOFT_EDGE > 0.001) {
    grad.addColorStop(bandStart - SOFT_EDGE, 'transparent');
  }
  grad.addColorStop(bandStart, tint);
  grad.addColorStop(bandEnd, tint);
  if (bandEnd + SOFT_EDGE < 0.999) {
    grad.addColorStop(bandEnd + SOFT_EDGE, 'transparent');
  }
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  ctx.restore();
}
