import { CONNECTION_POINT_CONFIG } from '../../shared/constants/index.ts';
import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { RenderConnectionPointsState } from './render-types.ts';
import { getConnectionPointPosition } from './port-positions.ts';
import { buildSlotConfig, buildSlotConfigFromDirections } from '../../puzzle/types.ts';
import type { SlotConfig } from '../../puzzle/types.ts';
import { TOTAL_SLOTS, slotSide, slotPerSideIndex } from '../../shared/grid/slot-helpers.ts';
import { deriveDirectionsFromMeterSlots } from '../../gameboard/meters/meter-types.ts';
import { signalToColor, signalToGlow } from './render-wires.ts';

/** Map a physical side direction to the angle (in radians) for the socket opening center. */
function directionToAngle(dir: 'left' | 'right' | 'top' | 'bottom'): number {
  switch (dir) {
    case 'right': return 0;
    case 'bottom': return Math.PI / 2;
    case 'left': return Math.PI;
    case 'top': return -Math.PI / 2;
  }
}

/** Draw the gameboard's input and output connection points. */
export function renderConnectionPoints(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  state: RenderConnectionPointsState,
  cellSize: number,
): void {
  const { RADIUS } = CONNECTION_POINT_CONFIG;

  // Derive SlotConfig: puzzle definition takes priority, otherwise derive from meter slots
  const config: SlotConfig = state.activePuzzle?.slotConfig
    ?? (state.activePuzzle
      ? buildSlotConfig(state.activePuzzle.activeInputs, state.activePuzzle.activeOutputs)
      : state.meterSlots
        ? buildSlotConfigFromDirections(deriveDirectionsFromMeterSlots(state.meterSlots))
        : buildSlotConfig(CONNECTION_POINT_CONFIG.INPUT_COUNT, CONNECTION_POINT_CONFIG.OUTPUT_COUNT));

  // Single loop over all 6 slots (0-2 left, 3-5 right)
  // Signal keys uniformly use slot index: `${direction}:${slotIndex}`
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const slot = config[i];
    if (!slot.active) continue;

    const side = slotSide(i);
    const perSideIdx = slotPerSideIndex(i);
    const pos = getConnectionPointPosition(side, perSideIdx, cellSize);
    const signalKey = `${slot.direction}:${i}`;
    const signalValue = state.cpSignals.get(signalKey) ?? 0;

    // Output CPs render as socket when unconnected, full circle when wired
    const isOutputCP = slot.direction === 'output';
    const isConnected = isOutputCP && state.connectedOutputCPs.has(signalKey);
    // Socket opening faces inward (left CPs face right, right CPs face left)
    const openingDirection = side === 'left' ? 'right' : 'left';
    drawConnectionPoint(ctx, tokens, pos.x, pos.y, RADIUS, signalValue, isOutputCP && !isConnected, openingDirection);
  }
}

function drawConnectionPoint(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  x: number,
  y: number,
  radius: number,
  signalValue: number,
  isSocket = false,
  openingDirection: 'left' | 'right' | 'top' | 'bottom' = 'right',
): void {
  const color = signalToColor(signalValue, tokens);
  const glow = signalToGlow(signalValue);

  // Glow ring for strong signals (mirrors wire glow behavior)
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

  if (isSocket) {
    // Half-circle divot — dark recessed socket awaiting a connection
    const gapCenter = directionToAngle(openingDirection);
    const startAngle = gapCenter + Math.PI / 2;
    const endAngle = gapCenter - Math.PI / 2;

    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = tokens.depthSunken;
    ctx.fill();

    ctx.strokeStyle = tokens.depthRaised;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Circle fill with polarity color
    ctx.fillStyle = color;
    ctx.strokeStyle = tokens.depthRaised;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
