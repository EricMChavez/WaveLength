import type { Vec2 } from '../../shared/types/index.ts';
import { COLORS } from '../../shared/constants/index.ts';

/** Draw a preview wire from the source port to the cursor position. */
export function renderWirePreview(
  ctx: CanvasRenderingContext2D,
  from: Vec2,
  to: Vec2,
): void {
  ctx.strokeStyle = COLORS.WIRE;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);

  const dx = Math.abs(to.x - from.x);
  const cpOffset = Math.max(dx * 0.4, 30);
  ctx.bezierCurveTo(
    from.x + cpOffset, from.y,
    to.x - cpOffset, to.y,
    to.x, to.y,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
