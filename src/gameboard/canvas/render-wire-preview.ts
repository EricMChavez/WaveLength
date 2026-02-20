import type { Vec2 } from '../../shared/types/index.ts';
import type { GridPoint } from '../../shared/grid/types.ts';
import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import { NODE_STYLE } from '../../shared/constants/index.ts';

/**
 * Draw a preview wire along an A*-routed grid path.
 * Falls back to a simple dashed line if no path is available.
 * Draws a filled circle (plug indicator) at the path endpoint.
 */
export function renderWirePreview(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  sourcePos: Vec2,
  targetPos: Vec2,
  path: GridPoint[] | null,
  cellSize: number,
): void {
  const wireWidth = Number(tokens.wireWidthBase) || 6;
  ctx.strokeStyle = tokens.colorNeutral;
  ctx.lineWidth = wireWidth;
  ctx.setLineDash([6, 4]);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  let endX: number;
  let endY: number;

  if (path && path.length > 0) {
    // Draw along the A* grid path only — no trailing segment to cursor
    ctx.moveTo(sourcePos.x, sourcePos.y);
    for (const pt of path) {
      ctx.lineTo(pt.col * cellSize, pt.row * cellSize);
    }
    const lastPt = path[path.length - 1];
    endX = lastPt.col * cellSize;
    endY = lastPt.row * cellSize;
  } else {
    // Fallback: simple dashed line to cursor when no path exists
    ctx.moveTo(sourcePos.x, sourcePos.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    endX = targetPos.x;
    endY = targetPos.y;
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // Draw a plug circle at the endpoint
  const portRadius = NODE_STYLE.PORT_RADIUS_RATIO * cellSize;
  ctx.fillStyle = tokens.colorNeutral;
  ctx.strokeStyle = tokens.depthRaised;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(endX, endY, portRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
