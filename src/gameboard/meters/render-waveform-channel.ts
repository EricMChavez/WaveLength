import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { PixelRect } from '../../shared/grid/types.ts';
import { VERTICAL_HEIGHT_RATIO } from './meter-types.ts';
import { getDevOverrides } from '../../dev/index.ts';

/** Inset in pixels so waveform content doesn't overlap the meter border */
const CONTENT_INSET = 2;

/** Fill opacity for the polarity-colored area between waveform and center */
const FILL_ALPHA = 0.2;

function clampSignal(v: number): number {
  return Math.max(-100, Math.min(100, v));
}

function sampleY(value: number, centerY: number, halfHeight: number): number {
  return centerY - (clampSignal(value) / 100) * halfHeight;
}

/**
 * Create a vertical gradient that maps Y position to polarity colour.
 * Top (+100) = positive, center (0) = signalZero (soft white), bottom (-100) = negative.
 */
function createPolarityGradient(
  ctx: CanvasRenderingContext2D,
  centerY: number,
  halfHeight: number,
  positiveColor: string,
  negativeColor: string,
  zeroColor: string,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, centerY - halfHeight, 0, centerY + halfHeight);
  gradient.addColorStop(0, positiveColor);
  gradient.addColorStop(0.5, zeroColor);
  gradient.addColorStop(1, negativeColor);
  return gradient;
}

/**
 * Draw the waveform channel with playpoint-split rendering.
 *
 * Left of playpoint: gradient-colored line + filled area between value and 0.
 * Right of playpoint: white line.
 *
 * X axis: sample 0 at left, sample N-1 at right.
 * Y axis: -100 at bottom, +100 at top, center at 0.
 *
 * Colour follows a vertical gradient: positive → soft white → negative,
 * so the line/fill colour naturally matches the signal magnitude.
 */
export function drawWaveformChannel(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  samples: readonly number[],
  rect: PixelRect,
  playpoint: number,
): void {
  const sampleCount = samples.length;
  if (sampleCount === 0) return;

  const devOverrides = getDevOverrides();
  const useOverrides = devOverrides.enabled;
  const positiveColor = useOverrides ? devOverrides.colors.signalPositive : tokens.signalPositive;
  const negativeColor = useOverrides ? devOverrides.colors.signalNegative : tokens.signalNegative;
  const zeroColor = useOverrides ? devOverrides.colors.meterZero : tokens.signalZero;

  const centerY = rect.y + rect.height / 2;
  const halfHeight = (rect.height * VERTICAL_HEIGHT_RATIO) / 2 - CONTENT_INSET;

  const stepX = sampleCount > 1 ? rect.width / (sampleCount - 1) : 0;
  const playIdx = Math.max(0, Math.min(playpoint, sampleCount - 1));

  // Vertical gradient mapping Y position → polarity colour
  const gradient = createPolarityGradient(ctx, centerY, halfHeight, positiveColor, negativeColor, zeroColor);

  // --- LEFT PORTION (0..playpoint): filled area + polarity line ---
  if (playIdx > 0) {
    drawFilledArea(ctx, samples, rect, centerY, halfHeight, stepX, playIdx, gradient);
    drawPolarityLine(ctx, samples, rect, centerY, halfHeight, stepX, 0, playIdx, gradient);
  }

  // --- RIGHT PORTION (playpoint..end): white line ---
  if (playIdx < sampleCount - 1) {
    drawWhiteLine(ctx, tokens, samples, rect, centerY, halfHeight, stepX, playIdx, sampleCount);
  }
}

/**
 * Draw the gradient-colored filled area between waveform and center line.
 * Two passes: one for positive regions (above center), one for negative (below center).
 * Both use the same vertical polarity gradient so colour matches signal magnitude.
 */
function drawFilledArea(
  ctx: CanvasRenderingContext2D,
  samples: readonly number[],
  rect: PixelRect,
  centerY: number,
  halfHeight: number,
  stepX: number,
  playIdx: number,
  gradient: CanvasGradient,
): void {
  const lastX = rect.x + playIdx * stepX;

  ctx.save();
  ctx.globalAlpha = FILL_ALPHA;
  ctx.fillStyle = gradient;

  // Positive fill (above center → clamped so negative values sit at center)
  ctx.beginPath();
  ctx.moveTo(rect.x, centerY);
  for (let i = 0; i <= playIdx && i < samples.length; i++) {
    const x = rect.x + i * stepX;
    const y = sampleY(samples[i], centerY, halfHeight);
    ctx.lineTo(x, Math.min(y, centerY));
  }
  ctx.lineTo(lastX, centerY);
  ctx.closePath();
  ctx.fill();

  // Negative fill (below center → clamped so positive values sit at center)
  ctx.beginPath();
  ctx.moveTo(rect.x, centerY);
  for (let i = 0; i <= playIdx && i < samples.length; i++) {
    const x = rect.x + i * stepX;
    const y = sampleY(samples[i], centerY, halfHeight);
    ctx.lineTo(x, Math.max(y, centerY));
  }
  ctx.lineTo(lastX, centerY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw gradient-colored polyline for samples in [startIdx..endIdx].
 * Uses a single vertical polarity gradient as stroke style.
 */
function drawPolarityLine(
  ctx: CanvasRenderingContext2D,
  samples: readonly number[],
  rect: PixelRect,
  centerY: number,
  halfHeight: number,
  stepX: number,
  startIdx: number,
  endIdx: number,
  gradient: CanvasGradient,
): void {
  const sampleCount = samples.length;

  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.9;

  ctx.beginPath();
  ctx.moveTo(rect.x + startIdx * stepX, sampleY(samples[startIdx], centerY, halfHeight));

  for (let i = startIdx + 1; i <= endIdx && i < sampleCount; i++) {
    ctx.lineTo(rect.x + i * stepX, sampleY(samples[i], centerY, halfHeight));
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a white polyline for samples in [startIdx..end].
 */
function drawWhiteLine(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  samples: readonly number[],
  rect: PixelRect,
  centerY: number,
  halfHeight: number,
  stepX: number,
  startIdx: number,
  sampleCount: number,
): void {
  ctx.save();
  ctx.strokeStyle = tokens.textPrimary;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  const startX = rect.x + startIdx * stepX;
  const startY = sampleY(samples[startIdx], centerY, halfHeight);
  ctx.moveTo(startX, startY);

  for (let i = startIdx + 1; i < sampleCount; i++) {
    ctx.lineTo(rect.x + i * stepX, sampleY(samples[i], centerY, halfHeight));
  }

  ctx.stroke();
  ctx.restore();
}
