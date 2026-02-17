import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { MotherboardEdgeCP } from '../../store/motherboard-types.ts';
import { signalToColor, signalToGlow } from './render-wires.ts';

/** Radius of edge CP dots in cells. */
const EDGE_CP_RADIUS_CELLS = 0.35;

/**
 * Draw animated edge connection points at section boundaries.
 * Each visible edge CP is a polarity-colored filled circle whose color
 * tracks the pre-computed waveform at the current playpoint.
 */
export function drawEdgeCPs(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  edgeCPs: readonly MotherboardEdgeCP[],
  playpoint: number,
  cellSize: number,
): void {
  const radius = EDGE_CP_RADIUS_CELLS * cellSize;

  for (const cp of edgeCPs) {
    if (!cp.visible) continue;

    const value = cp.samples[playpoint] ?? 0;
    const color = signalToColor(value, tokens);
    const glow = signalToGlow(value);

    const x = cp.gridPosition.col * cellSize;
    const y = cp.gridPosition.row * cellSize;

    // Glow for strong signals
    if (glow > 0) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = glow * 0.6; // Slightly subtler than wire glow
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    // Filled circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
