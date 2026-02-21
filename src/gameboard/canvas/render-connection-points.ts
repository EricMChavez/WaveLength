import { NODE_STYLE } from '../../shared/constants/index.ts';
import { CONNECTION_POINT_CONFIG } from '../../shared/constants/index.ts';
import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { RenderConnectionPointsState } from './render-types.ts';
import { getConnectionPointPosition } from './port-positions.ts';
import { buildSlotConfig, buildSlotConfigFromDirections } from '../../puzzle/types.ts';
import type { SlotConfig } from '../../puzzle/types.ts';
import { TOTAL_SLOTS, slotSide, slotPerSideIndex } from '../../shared/grid/slot-helpers.ts';
import { deriveDirectionsFromMeterSlots } from '../../gameboard/meters/meter-types.ts';
import { drawPort } from './render-nodes.ts';
import type { PortShape } from './render-nodes.ts';

/** Draw the gameboard's input and output connection points. */
export function renderConnectionPoints(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  state: RenderConnectionPointsState,
  cellSize: number,
): void {
  const portRadius = NODE_STYLE.PORT_RADIUS_RATIO * cellSize;

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

    // Socket opening faces inward (left CPs face right, right CPs face left)
    const openingDirection = side === 'left' ? 'right' : 'left';

    const isReconnecting = state.reconnectingCpKeys?.has(signalKey) ?? false;

    let shape: PortShape;
    if (slot.direction === 'input') {
      // Input CPs emit signal into the gameboard (source end of wires)
      const isConnected = state.connectedInputCPs.has(signalKey);
      shape = isConnected
        ? { type: 'socket', openingDirection, connected: true }  // plug "left" along wire
        : isReconnecting
          ? { type: 'socket', openingDirection, connected: true }  // socket with neutral nub during drag
          : { type: 'plug' };                                      // plug sitting, ready to connect
    } else {
      // Output CPs receive signal from the gameboard (destination end of wires)
      const isConnected = state.connectedOutputCPs.has(signalKey);
      shape = isConnected
        ? { type: 'seated', openingDirection }   // plug "arrived" from wire
        : isReconnecting
          ? { type: 'socket', openingDirection }   // empty socket during drag
          : { type: 'socket', openingDirection };  // empty socket, awaiting connection
    }

    // Reconnecting CPs: neutral color to match preview wire.
    // Blip mode: neutral unless a blip is holding at this CP.
    const colorOverride = isReconnecting
      ? tokens.colorNeutral
      : state.blipHoldingCpKeys
        ? (state.blipHoldingCpKeys.has(signalKey) ? undefined : tokens.colorNeutral)
        : undefined;
    drawPort(ctx, tokens, pos.x, pos.y, portRadius, signalValue, shape, colorOverride);

    // Lock indicator for parent-connected slots (live X-ray)
    if (state.connectedSlots?.has(i)) {
      drawLockIcon(ctx, tokens, pos.x, pos.y, portRadius);
    }
  }
}

/** Draw a small padlock icon below a connection point to indicate parent-board lock. */
function drawLockIcon(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  cx: number,
  cy: number,
  portRadius: number,
): void {
  const size = portRadius * 0.6;
  const lockX = cx - size * 0.5;
  const lockY = cy + portRadius * 1.3;

  ctx.save();
  ctx.globalAlpha = 0.7;

  // Lock body (rounded rect)
  const bodyW = size;
  const bodyH = size * 0.7;
  const r = size * 0.15;
  ctx.fillStyle = tokens.colorNeutral;
  ctx.beginPath();
  ctx.moveTo(lockX + r, lockY);
  ctx.lineTo(lockX + bodyW - r, lockY);
  ctx.arcTo(lockX + bodyW, lockY, lockX + bodyW, lockY + r, r);
  ctx.lineTo(lockX + bodyW, lockY + bodyH - r);
  ctx.arcTo(lockX + bodyW, lockY + bodyH, lockX + bodyW - r, lockY + bodyH, r);
  ctx.lineTo(lockX + r, lockY + bodyH);
  ctx.arcTo(lockX, lockY + bodyH, lockX, lockY + bodyH - r, r);
  ctx.lineTo(lockX, lockY + r);
  ctx.arcTo(lockX, lockY, lockX + r, lockY, r);
  ctx.closePath();
  ctx.fill();

  // Lock shackle (arc)
  const shackleW = size * 0.5;
  const shackleCx = lockX + bodyW * 0.5;
  ctx.strokeStyle = tokens.colorNeutral;
  ctx.lineWidth = size * 0.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(shackleCx, lockY, shackleW * 0.5, Math.PI, 0);
  ctx.stroke();

  ctx.restore();
}
