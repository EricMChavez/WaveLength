import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { PixelRect } from '../../shared/grid/types.ts';
import type { MeterSlotState } from './meter-types.ts';
import { CHANNEL_RATIOS, VERTICAL_HEIGHT_RATIO, METER_BUFFER_CAPACITY } from './meter-types.ts';
import { drawWaveformChannel } from './render-waveform-channel.ts';
import { drawLevelBar, type LevelBarCutout } from './render-level-bar.ts';
import { drawNeedle, type NeedleTip } from './render-needle.ts';
import { drawTargetOverlay } from './render-target-overlay.ts';

import { getDevOverrides } from '../../dev/index.ts';
import { HIGHLIGHT_STREAK, CONNECTION_POINT_CONFIG } from '../../shared/constants/index.ts';
import { drawHighlightStreakRounded } from '../canvas/render-highlight-streak.ts';
import { signalToColor, signalToGlow } from '../canvas/render-wires.ts';

/** Ratio of border radius to drawn meter height for outside corners */
const OUTSIDE_CORNER_RADIUS_RATIO = 0.06;

/** Data needed to render a single meter, assembled by the render loop */
export interface RenderMeterState {
  slot: MeterSlotState;
  /** 256 signal samples (one per cycle), or null if no data */
  signalValues: readonly number[] | null;
  /** 256 target samples for output meters, or null */
  targetValues: readonly number[] | null;
  /** Per-sample match status for output meters (green coloring) */
  matchStatus?: readonly boolean[] | null;
  /** Current playpoint cycle index (0-255) for indicator line and current value */
  playpoint: number;
  /** Whether this meter's connection point has a wire attached */
  isConnected: boolean;
}

/**
 * Draw a single analog meter in the given pixel rect.
 *
 * Composites: interior background, center-line, 3 channels (waveform, level bar, needle),
 * and optional target overlay for output meters.
 *
 * Visual states:
 * - hidden: early return, no drawing
 * - dimmed: interior + faded overlay only
 * - active: all channels
 * - confirming: all channels (no special visual currently)
 */
export function drawMeter(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  state: RenderMeterState,
  rect: PixelRect,
): void {
  const { slot, signalValues, targetValues } = state;

  if (slot.visualState === 'hidden') return;

  // Compute channel sub-rects within the meter (mirrored for right-side meters)
  const { waveformRect, levelBarRect, needleRect } = computeChannelRects(rect, slot.side);

  // Compute cutout for level bar (circular arc near connection point)
  const cutout = computeLevelBarCutout(rect, needleRect, slot.side);

  const devOverrides = getDevOverrides();

  // Drop shadow (meters are top depth level — stronger shadow than nodes)
  const shadowBlurRatio = devOverrides.enabled ? devOverrides.meterStyle.shadowBlurRatio : 0.075;
  const shadowOffsetRatio = devOverrides.enabled ? devOverrides.meterStyle.shadowOffsetRatio : 0.015;
  if (shadowBlurRatio > 0) {
    drawMeterShadow(ctx, waveformRect, levelBarRect, slot.side, rect.height, shadowBlurRatio, shadowOffsetRatio);
  }

  // Opaque backing behind the meter (matches border bounds exactly)
  // Needed because canvas is transparent — without this, meter content is invisible
  const housingColor = devOverrides.enabled
    ? devOverrides.colors.meterInterior
    : tokens.meterHousing;
  drawMeterHousing(ctx, housingColor, waveformRect, levelBarRect, slot.side);

  // Draw meter interior background (behind waveform + levelBar, respecting cutout)
  const meterInteriorColor = devOverrides.enabled
    ? devOverrides.colors.meterInterior
    : tokens.meterInterior;
  drawMeterInterior(ctx, meterInteriorColor, waveformRect, levelBarRect, cutout, slot.side);

  // Pre-compute streak params (used after both dimmed and active paths)
  const meterHard = devOverrides.enabled ? devOverrides.highlightStyle.meterHard : 0.05;
  const meterSoft = devOverrides.enabled ? devOverrides.highlightStyle.meterSoft : 0.03;

  if (slot.visualState === 'dimmed') {
    // Dimmed: draw a semi-transparent overlay, then streak on top
    ctx.fillStyle = tokens.depthSunken;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.globalAlpha = 1.0;
    drawMeterStreak(ctx, waveformRect, levelBarRect, slot.side, meterHard, meterSoft);
    return;
  }

  // Center-line (dashed, neutral color) - only across waveform + levelBar
  const interiorLeft = Math.min(waveformRect.x, levelBarRect.x);
  const interiorRight = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const centerY = rect.y + rect.height / 2;
  ctx.save();
  ctx.strokeStyle = tokens.colorNeutral;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(interiorLeft, centerY);
  ctx.lineTo(interiorRight, centerY);
  ctx.stroke();
  ctx.restore();

  // Current value at playpoint for level bar and needle
  const playpoint = state.playpoint;
  const currentValue = signalValues && playpoint < signalValues.length
    ? signalValues[playpoint]
    : 0;

  // Clip all channel drawing to meter bounds
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();

  // Draw waveform polyline (playpoint-split: polarity fill left, white line right)
  if (signalValues && signalValues.length > 0) {
    drawWaveformChannel(ctx, tokens, signalValues, waveformRect, playpoint);
  }

  drawLevelBar(ctx, tokens, currentValue, levelBarRect, cutout, slot.side);

  // Target overlay for output meters
  if (targetValues && slot.direction === 'output') {
    drawTargetOverlay(ctx, tokens, targetValues, waveformRect);
  }

  // Playpoint indicator line (vertical line at current cycle position)
  if (signalValues && signalValues.length > 0) {
    const wfCenterY = rect.y + rect.height / 2;
    const halfHeight = (waveformRect.height * VERTICAL_HEIGHT_RATIO) / 2;
    const indicatorX = waveformRect.x + (playpoint / METER_BUFFER_CAPACITY) * waveformRect.width;
    ctx.save();
    ctx.strokeStyle = tokens.meterNeedle;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(indicatorX, wfCenterY - halfHeight);
    ctx.lineTo(indicatorX, wfCenterY + halfHeight);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // Draw meter border - uses same constrained height as interior
  drawMeterBorder(ctx, tokens, waveformRect, levelBarRect, VERTICAL_HEIGHT_RATIO, slot.side);

  // Needle and connector drawn after border so they render on top.
  // Input meters (providing signal) always show needle.
  // Output meters (recording signal) only show needle when connected.
  const showNeedle = slot.direction === 'input' || state.isConnected;
  if (showNeedle) {
    const needleTip = drawNeedle(ctx, tokens, currentValue, needleRect, slot.side);
    if (signalValues && signalValues.length > 0) {
      const indicatorX = waveformRect.x + (playpoint / METER_BUFFER_CAPACITY) * waveformRect.width;
      drawNeedleConnector(ctx, needleTip, indicatorX, slot.side);
    }
  }

  // Light edge (warm highlight along outer top edge)
  const meterLightEdgeOpacity = devOverrides.enabled ? devOverrides.meterStyle.lightEdgeOpacity : 0.3;
  if (meterLightEdgeOpacity > 0) {
    drawMeterLightEdge(ctx, waveformRect, levelBarRect, slot.side, meterLightEdgeOpacity);
  }

  // Highlight streak on top of everything
  drawMeterStreak(ctx, waveformRect, levelBarRect, slot.side, meterHard, meterSoft);

  // Draw a filled port circle at the connection point for recording (output) meters
  // Drawn last so it renders on top of the meter housing, streak, and needle
  if (slot.direction === 'output' && state.isConnected) {
    const eyeX = slot.side === 'left'
      ? needleRect.x + needleRect.width
      : needleRect.x;
    const eyeY = needleRect.y + needleRect.height / 2;
    drawConnectionDot(ctx, tokens, eyeX, eyeY, currentValue);
  }
}

/** Draw highlight streak on top of meter (uses housing bounds). */
function drawMeterStreak(
  ctx: CanvasRenderingContext2D,
  waveformRect: PixelRect,
  levelBarRect: PixelRect,
  side: 'left' | 'right',
  hardOpacity: number,
  softOpacity: number,
): void {
  const left = Math.min(waveformRect.x, levelBarRect.x);
  const right = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const width = right - left;
  const centerY = waveformRect.y + waveformRect.height / 2;
  const halfH = (waveformRect.height * VERTICAL_HEIGHT_RATIO) / 2;
  const top = centerY - halfH;
  const height = halfH * 2;
  const r = Math.round(height * OUTSIDE_CORNER_RADIUS_RATIO);
  const devOverrides = getDevOverrides();
  const fadeRatio = devOverrides.enabled ? devOverrides.highlightStyle.verticalFadeRatio : HIGHLIGHT_STREAK.VERTICAL_FADE_RATIO;
  drawHighlightStreakRounded(ctx, { x: left, y: top, width, height }, [r, r, r, r], hardOpacity, softOpacity, fadeRatio);
}

/**
 * Draw a border on three sides of the meter (not the gameboard-facing side).
 * Uses the same constrained vertical height as the meter interior.
 */
function drawMeterBorder(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  waveformRect: PixelRect,
  levelBarRect: PixelRect,
  verticalHeightRatio: number,
  side: 'left' | 'right',
): void {
  const devOverrides = getDevOverrides();
  const borderColor = devOverrides.enabled
    ? devOverrides.colors.meterBorder
    : tokens.meterBorder;

  // Compute the same constrained bounds as drawMeterInterior
  const left = Math.min(waveformRect.x, levelBarRect.x);
  const right = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const width = right - left;
  const centerY = waveformRect.y + waveformRect.height / 2;
  const halfHeight = (waveformRect.height * verticalHeightRatio) / 2;
  const top = centerY - halfHeight;
  const height = halfHeight * 2;

  const r = Math.round(height * OUTSIDE_CORNER_RADIUS_RATIO);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, [r, r, r, r]);
  ctx.stroke();
}

/**
 * Compute pixel sub-rects for each channel within the meter housing.
 *
 * Left meters:  waveform | gap | levelBar | gap | needle  (needle toward gameboard)
 * Right meters: needle | gap | levelBar | gap | waveform  (needle toward gameboard)
 *
 * The needle channel is always closest to the gameboard (center of screen).
 */
function computeChannelRects(rect: PixelRect, side: 'left' | 'right'): {
  waveformRect: PixelRect;
  levelBarRect: PixelRect;
  needleRect: PixelRect;
} {
  const waveformRatio = CHANNEL_RATIOS.waveform;
  const levelBarRatio = CHANNEL_RATIOS.levelBar;
  const needleRatio = CHANNEL_RATIOS.needle;

  // Normalize ratios to ensure they sum to ~1.0 (with small gaps)
  const totalRatio = waveformRatio + levelBarRatio + needleRatio + CHANNEL_RATIOS.gapA + CHANNEL_RATIOS.gapB;
  const scale = 1.0 / totalRatio;

  const w = rect.width;
  const waveformW = w * waveformRatio * scale;
  const gapAW = w * CHANNEL_RATIOS.gapA * scale;
  const levelBarW = w * levelBarRatio * scale;
  const gapBW = w * CHANNEL_RATIOS.gapB * scale;
  const needleW = w * needleRatio * scale;

  if (side === 'right') {
    // Right side: needle | gap | levelBar | gap | waveform (needle toward gameboard on left)
    return {
      needleRect: { x: rect.x, y: rect.y, width: needleW, height: rect.height },
      levelBarRect: { x: rect.x + needleW + gapBW, y: rect.y, width: levelBarW, height: rect.height },
      waveformRect: { x: rect.x + needleW + gapBW + levelBarW + gapAW, y: rect.y, width: waveformW, height: rect.height },
    };
  }

  // Left side: waveform | gap | levelBar | gap | needle (needle toward gameboard on right)
  return {
    waveformRect: { x: rect.x, y: rect.y, width: waveformW, height: rect.height },
    levelBarRect: { x: rect.x + waveformW + gapAW, y: rect.y, width: levelBarW, height: rect.height },
    needleRect: { x: rect.x + waveformW + gapAW + levelBarW + gapBW, y: rect.y, width: needleW, height: rect.height },
  };
}

/**
 * Compute the circular cutout for the level bar.
 *
 * The cutout is centered at the connection point (eye of the needle)
 * with a radius that covers the entire level bar area near the connection point.
 * The radius must reach the corners of the level bar's vertical extent.
 */
function computeLevelBarCutout(
  meterRect: PixelRect,
  needleRect: PixelRect,
  side: 'left' | 'right',
): LevelBarCutout {
  const verticalHeightRatio = VERTICAL_HEIGHT_RATIO;

  // Eye (connection point) is at the gameboard-side edge of the needle rect
  const eyeX = side === 'left'
    ? needleRect.x + needleRect.width
    : needleRect.x;
  const eyeY = meterRect.y + meterRect.height / 2;

  // The cutout must cover the corner of the level bar's drawn area.
  // Corner is at: (needleRect.x, centerY ± halfDrawnHeight)
  // Distance from eye to corner determines minimum radius.
  const dx = needleRect.width; // horizontal distance from level bar edge to eye
  const halfDrawnHeight = (meterRect.height * verticalHeightRatio) / 2;
  const cornerDistance = Math.sqrt(dx * dx + halfDrawnHeight * halfDrawnHeight);

  // Add buffer to ensure clean coverage
  const radius = cornerDistance + 2;

  return { centerX: eyeX, centerY: eyeY, radius };
}

/**
 * Draw the meter interior background behind waveform + levelBar channels.
 * Respects the cutout near the connection point and vertical height ratio.
 */
function drawMeterInterior(
  ctx: CanvasRenderingContext2D,
  color: string,
  waveformRect: PixelRect,
  levelBarRect: PixelRect,
  cutout: LevelBarCutout,
  side: 'left' | 'right',
): void {
  const verticalHeightRatio = VERTICAL_HEIGHT_RATIO;

  // Compute combined rect spanning waveform and levelBar
  const left = Math.min(waveformRect.x, levelBarRect.x);
  const right = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const width = right - left;

  // Constrain to vertical drawable area (same as level bar)
  const centerY = waveformRect.y + waveformRect.height / 2;
  const halfHeight = (waveformRect.height * verticalHeightRatio) / 2;
  const top = centerY - halfHeight;
  const height = halfHeight * 2;

  ctx.save();

  // Create clipping path that excludes the cutout circle
  ctx.beginPath();

  // Determine if we need to extend the clip rect to include the cutout
  const rectCenterX = left + width / 2;
  let clipX = left;
  let clipWidth = width;

  if (cutout.centerX > rectCenterX) {
    // Cutout is on the right (left meter) - extend clip rightward
    clipWidth = (cutout.centerX + cutout.radius) - left + 5;
  } else {
    // Cutout is on the left (right meter) - extend clip leftward
    clipX = cutout.centerX - cutout.radius - 5;
    clipWidth = right - clipX;
  }

  // Outer rectangle boundary
  ctx.rect(clipX, top, clipWidth, height);
  // Circle as a "hole" - drawn counter-clockwise for evenodd clipping
  ctx.arc(cutout.centerX, cutout.centerY, cutout.radius, 0, Math.PI * 2, true);
  ctx.clip('evenodd');

  // Fill the interior with rounded corners on all sides
  const r = Math.round(height * OUTSIDE_CORNER_RADIUS_RATIO);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, [r, r, r, r]);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw opaque housing behind the meter, matching the border bounds exactly.
 * Provides an opaque backing so meter content is visible on the transparent canvas.
 */
function drawMeterHousing(
  ctx: CanvasRenderingContext2D,
  color: string,
  waveformRect: PixelRect,
  levelBarRect: PixelRect,
  side: 'left' | 'right',
): void {
  const left = Math.min(waveformRect.x, levelBarRect.x);
  const right = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const width = right - left;
  const centerY = waveformRect.y + waveformRect.height / 2;
  const halfHeight = (waveformRect.height * VERTICAL_HEIGHT_RATIO) / 2;
  const top = centerY - halfHeight;
  const height = halfHeight * 2;

  const r = Math.round(height * OUTSIDE_CORNER_RADIUS_RATIO);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, [r, r, r, r]);
  ctx.fill();

}

/**
 * Draw a drop shadow behind the meter housing.
 * Uses the housing shape with shadowBlur/shadowOffsetY.
 * Ratios are relative to rect.height so we don't need a cellSize param.
 */
function drawMeterShadow(
  ctx: CanvasRenderingContext2D,
  waveformRect: PixelRect,
  levelBarRect: PixelRect,
  _side: 'left' | 'right',
  meterHeight: number,
  blurRatio: number,
  offsetRatio: number,
): void {
  const left = Math.min(waveformRect.x, levelBarRect.x);
  const right = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const width = right - left;
  const centerY = waveformRect.y + waveformRect.height / 2;
  const halfHeight = (waveformRect.height * VERTICAL_HEIGHT_RATIO) / 2;
  const top = centerY - halfHeight;
  const height = halfHeight * 2;
  const r = Math.round(height * OUTSIDE_CORNER_RADIUS_RATIO);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = meterHeight * blurRatio;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = meterHeight * offsetRatio;
  ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent fill — only the shadow draws
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, [r, r, r, r]);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a warm light-edge highlight along the outer top edge of the meter.
 */
function drawMeterLightEdge(
  ctx: CanvasRenderingContext2D,
  waveformRect: PixelRect,
  levelBarRect: PixelRect,
  _side: 'left' | 'right',
  opacity: number,
): void {
  const left = Math.min(waveformRect.x, levelBarRect.x);
  const right = Math.max(waveformRect.x + waveformRect.width, levelBarRect.x + levelBarRect.width);
  const width = right - left;
  const centerY = waveformRect.y + waveformRect.height / 2;
  const halfH = (waveformRect.height * VERTICAL_HEIGHT_RATIO) / 2;
  const top = centerY - halfH;
  const height = halfH * 2;
  const r = Math.round(height * OUTSIDE_CORNER_RADIUS_RATIO);

  const warmTint = HIGHLIGHT_STREAK.WARM_TINT;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, [r, r, r, r]);
  ctx.clip();
  ctx.strokeStyle = `rgba(${warmTint.r},${warmTint.g},${warmTint.b},${opacity})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left + r, top + 0.5);
  ctx.lineTo(left + width - r, top + 0.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a filled circle at the meter's connection point (needle eye position).
 * Matches the style of port circles on nodes — polarity-colored with optional glow.
 */
function drawConnectionDot(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  x: number,
  y: number,
  signalValue: number,
): void {
  const radius = CONNECTION_POINT_CONFIG.RADIUS;
  const color = signalToColor(signalValue, tokens);
  const glow = signalToGlow(signalValue);

  // Glow ring for strong signals
  if (glow > 0) {
    const glowAlpha = Math.abs(signalValue) >= 100 ? 1 : (Math.abs(signalValue) - 75) / 25;
    ctx.save();
    ctx.globalAlpha = glowAlpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Filled circle with polarity color
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.strokeStyle = tokens.depthRaised;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a faint white horizontal line from the needle tip to the playpoint indicator.
 * Provides a visual link between the current value (needle) and the waveform position.
 */
function drawNeedleConnector(
  ctx: CanvasRenderingContext2D,
  needleTip: NeedleTip,
  indicatorX: number,
  side: 'left' | 'right',
): void {
  // For left meters the indicator is to the left of the needle tip;
  // for right meters it's to the right.
  const fromX = side === 'left' ? indicatorX : needleTip.tipX;
  const toX = side === 'left' ? needleTip.tipX : indicatorX;

  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.moveTo(fromX, needleTip.tipY);
  ctx.lineTo(toX, needleTip.tipY);
  ctx.stroke();
  ctx.restore();
}
