import { HIGHLIGHT_STREAK } from '../../shared/constants/index.ts';
import type { PixelRect } from '../../shared/grid/types.ts';

/**
 * Draw a diagonal highlight streak (thin band of low-opacity white) across a rectangular region.
 * Creates the illusion of a shared light source reflecting off the surface.
 *
 * The streak is a hard-edged band: transparent → white → transparent (no soft fade).
 * The gradient runs perpendicular to the streak direction so the band appears as a
 * diagonal line of light at ANGLE_DEG degrees from vertical.
 */
export function drawHighlightStreak(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  opacityOverride?: number,
): void {
  const opacity = opacityOverride ?? HIGHLIGHT_STREAK.OPACITY;
  if (opacity <= 0) return;

  ctx.save();

  // Clip to the rect
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();

  fillStreak(ctx, rect, opacity);

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
  opacityOverride?: number,
): void {
  const opacity = opacityOverride ?? HIGHLIGHT_STREAK.OPACITY;
  if (opacity <= 0) return;

  ctx.save();

  // Clip to rounded rect
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, borderRadius);
  ctx.clip();

  fillStreak(ctx, rect, opacity);

  ctx.restore();
}

/**
 * Core streak fill logic. Caller must have already set up the clip region.
 *
 * The gradient runs perpendicular to the streak band direction.
 * At ANGLE_DEG=10, the streak is nearly vertical but tilted slightly right.
 * The gradient axis is perpendicular to the streak (nearly horizontal, tilted slightly).
 */
function fillStreak(
  ctx: CanvasRenderingContext2D,
  rect: PixelRect,
  opacity: number,
): void {
  // The streak band runs at ANGLE_DEG from vertical (nearly vertical, tilted right).
  // The gradient must run perpendicular to the band direction so the color stops
  // create a band of white across the surface.
  //
  // Streak direction: ANGLE_DEG from vertical = (90 - ANGLE_DEG) from horizontal
  // Gradient direction (perpendicular to streak): ANGLE_DEG from horizontal
  const gradAngleRad = (HIGHLIGHT_STREAK.ANGLE_DEG * Math.PI) / 180;
  const cos = Math.cos(gradAngleRad);
  const sin = Math.sin(gradAngleRad);

  // Project the rect's diagonal onto the gradient axis to find the gradient span
  const span = rect.width * cos + rect.height * sin;

  // Gradient endpoints
  const gx0 = rect.x;
  const gy0 = rect.y;
  const gx1 = rect.x + span * cos;
  const gy1 = rect.y + span * sin;

  const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);

  // Compute band edges (hard cuts)
  const halfBand = HIGHLIGHT_STREAK.BAND_WIDTH_RATIO / 2;
  const bandStart = Math.max(0, HIGHLIGHT_STREAK.CENTER_POSITION - halfBand);
  const bandEnd = Math.min(1, HIGHLIGHT_STREAK.CENTER_POSITION + halfBand);

  const white = `rgba(255, 255, 255, ${opacity})`;

  grad.addColorStop(0, 'transparent');
  if (bandStart > 0.001) {
    grad.addColorStop(bandStart - 0.001, 'transparent');
  }
  grad.addColorStop(bandStart, white);
  grad.addColorStop(bandEnd, white);
  if (bandEnd < 0.999) {
    grad.addColorStop(bandEnd + 0.001, 'transparent');
  }
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}
