import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import { RECORD_BUTTON } from '../../shared/constants/index.ts';

// --- Module-level state singletons (same pattern as render-back-button.ts) ---

let _hovered = false;
let _disabled = false;

export function getHoveredRecordButton(): boolean {
  return _hovered;
}

export function setHoveredRecordButton(hovered: boolean): void {
  _hovered = hovered;
}

export function isRecordButtonDisabled(): boolean {
  return _disabled;
}

export function setRecordButtonDisabled(disabled: boolean): void {
  _disabled = disabled;
}

// --- Geometry helpers ---

function getButtonRect(cellSize: number) {
  const left = RECORD_BUTTON.COL_START * cellSize;
  const top = RECORD_BUTTON.ROW_START * cellSize;
  const width = (RECORD_BUTTON.COL_END - RECORD_BUTTON.COL_START + 1) * cellSize;
  const height = (RECORD_BUTTON.ROW_END - RECORD_BUTTON.ROW_START + 1) * cellSize;
  return { left, top, width, height };
}

// --- Hit testing ---

export function hitTestRecordButton(x: number, y: number, cellSize: number): boolean {
  const r = getButtonRect(cellSize);
  return x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;
}

// --- Drawing ---

export interface RecordButtonRenderState {
  hovered: boolean;
  disabled: boolean;
}

/** Inset padding ratio (fraction of cell size) */
const PAD_RATIO = 0.35;
/** Corner radius ratio (fraction of button height) */
const CORNER_RADIUS_RATIO = 0.15;

/**
 * Draw the record button: a subtle rounded-rect container with a
 * filled red circle icon (record symbol) inside.
 */
export function drawRecordButton(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  state: RecordButtonRenderState,
  cellSize: number,
): void {
  const r = getButtonRect(cellSize);
  const pad = cellSize * PAD_RATIO;

  // Inset container rect (smaller than hit area)
  const bx = r.left + pad;
  const by = r.top + pad;
  const bw = r.width - pad * 2;
  const bh = r.height - pad * 2;
  const cr = Math.round(bh * CORNER_RADIUS_RATIO);

  const borderColor = tokens.meterBorder;

  ctx.save();

  if (state.disabled) {
    ctx.globalAlpha = 0.3;
  }

  // Container background — very subtle fill, just enough to read as a surface
  const hoveredAndEnabled = state.hovered && !state.disabled;
  ctx.fillStyle = hoveredAndEnabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, cr);
  ctx.fill();

  // Container border — thin, matching meter border color
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = hoveredAndEnabled ? 1.5 : 1;
  ctx.globalAlpha = state.disabled ? 0.3 : (hoveredAndEnabled ? 0.9 : 0.5);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, cr);
  ctx.stroke();
  ctx.globalAlpha = state.disabled ? 0.3 : 1;

  // --- Icon: filled circle (record symbol) ---
  const iconCx = bx + bw / 2;
  const iconCy = by + bh / 2;
  const circleRadius = Math.min(bw, bh) * 0.25;

  // Color: amber (signalPositive) when enabled, meterBorder when disabled
  const iconColor = hoveredAndEnabled
    ? tokens.textPrimary
    : state.disabled
      ? tokens.meterBorder
      : tokens.signalPositive;

  ctx.fillStyle = iconColor;
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
