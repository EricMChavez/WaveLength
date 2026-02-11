import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { PixelRect } from '../../shared/grid/types.ts';
import { VERTICAL_HEIGHT_RATIO } from './meter-types.ts';

/** Inset in pixels so target content doesn't overlap the meter border */
const CONTENT_INSET = 2;

/**
 * Draw the target waveform overlay as a dashed polyline.
 * Used on output meters to show the expected waveform as a fixed reference.
 *
 * Uses the same coordinate space as the waveform channel:
 * X axis: sample 0 at left, sample N-1 at right.
 * Y axis: -100 at bottom, +100 at top, center at 0.
 */
export function drawTargetOverlay(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  targetSamples: readonly number[],
  rect: PixelRect,
): void {
  const sampleCount = targetSamples.length;
  if (sampleCount === 0) return;

  const centerY = rect.y + rect.height / 2;
  const halfHeight = (rect.height * VERTICAL_HEIGHT_RATIO) / 2 - CONTENT_INSET;
  const stepX = sampleCount > 1 ? rect.width / (sampleCount - 1) : 0;

  ctx.save();
  ctx.strokeStyle = tokens.colorTarget;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.setLineDash([4, 3]);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  for (let i = 0; i < sampleCount; i++) {
    const value = targetSamples[i];
    const x = rect.x + i * stepX;
    const y = centerY - (Math.max(-100, Math.min(100, value)) / 100) * halfHeight;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.restore();
}
