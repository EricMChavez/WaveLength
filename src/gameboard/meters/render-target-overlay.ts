import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { PixelRect } from '../../shared/grid/types.ts';
import type { MeterCircularBuffer } from './circular-buffer.ts';
import { METER_BUFFER_CAPACITY, VERTICAL_HEIGHT_RATIO } from './meter-types.ts';

/**
 * Draw the target waveform overlay as static solid filled bars.
 * Used on output meters to show the expected waveform as a fixed reference.
 *
 * The target buffer is pre-filled once and never pushed to, so it renders
 * as a static waveform while the signal scrolls behind it.
 *
 * Uses the same vertical extent and horizontal positioning as the
 * waveform channel for visual alignment. Both polarities use the target
 * color to visually distinguish from the live signal.
 */
export function drawTargetOverlay(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  targetBuffer: MeterCircularBuffer,
  rect: PixelRect,
  matchStatus?: boolean[] | null,
  signalCount?: number,
): void {
  const sampleCount = targetBuffer.count;
  if (sampleCount === 0) return;

  const centerY = rect.y + rect.height / 2;
  const halfHeight = (rect.height * VERTICAL_HEIGHT_RATIO) / 2;
  const colWidth = rect.width / METER_BUFFER_CAPACITY;

  // matchStatus is indexed by signal buffer position; offset aligns to target indices
  const offset = signalCount != null ? sampleCount - signalCount : 0;

  ctx.save();
  ctx.fillStyle = tokens.colorTarget;
  ctx.globalAlpha = 0.45;

  for (let i = 0; i < sampleCount; i++) {
    // Skip bars that overlap with the green match overlay
    const matchIdx = i - offset;
    if (matchStatus && matchIdx >= 0 && matchIdx < matchStatus.length && matchStatus[matchIdx]) continue;

    const value = targetBuffer.at(i);
    if (Math.abs(value) < 0.5) continue; // skip near-zero

    const clamped = Math.max(-100, Math.min(100, value));
    const barHeight = (Math.abs(clamped) / 100) * halfHeight;
    const distanceFromNewest = sampleCount - 1 - i;
    const x = rect.x + distanceFromNewest * colWidth;

    if (clamped >= 0) {
      ctx.fillRect(x, centerY - barHeight, colWidth, barHeight);
    } else {
      ctx.fillRect(x, centerY, colWidth, barHeight);
    }
  }

  ctx.restore();
}
