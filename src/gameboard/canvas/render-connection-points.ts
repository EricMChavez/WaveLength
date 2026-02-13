import { CONNECTION_POINT_CONFIG } from '../../shared/constants/index.ts';
import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { RenderConnectionPointsState } from './render-types.ts';
import { getConnectionPointPosition } from './port-positions.ts';
import { buildConnectionPointConfig, buildCustomNodeConnectionPointConfig } from '../../puzzle/types.ts';
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

  const cpConfig = state.editingUtilityId
    ? buildCustomNodeConnectionPointConfig()
    : state.activePuzzle?.connectionPoints
      ?? buildConnectionPointConfig(
        state.activePuzzle?.activeInputs ?? CONNECTION_POINT_CONFIG.INPUT_COUNT,
        state.activePuzzle?.activeOutputs ?? CONNECTION_POINT_CONFIG.OUTPUT_COUNT,
      );

  // Left-side connection points — input CPs provide signal, always filled circles
  for (let i = 0; i < cpConfig.left.length; i++) {
    const slot = cpConfig.left[i];
    if (!slot.active) continue;
    const pos = getConnectionPointPosition('left', i, cellSize);
    const signalKey = slot.cpIndex !== undefined ? `${slot.direction}:${slot.cpIndex}` : `${slot.direction}:${i}`;
    const signalValue = state.cpSignals.get(signalKey) ?? 0;
    drawConnectionPoint(ctx, tokens, pos.x, pos.y, RADIUS, signalValue, false, 'right');
  }

  // Right-side connection points — output CPs need connections, socket when unconnected
  for (let i = 0; i < cpConfig.right.length; i++) {
    const slot = cpConfig.right[i];
    if (!slot.active) continue;
    const pos = getConnectionPointPosition('right', i, cellSize);
    const signalKey = slot.cpIndex !== undefined ? `${slot.direction}:${slot.cpIndex}` : `${slot.direction}:${i}`;
    const signalValue = state.cpSignals.get(signalKey) ?? 0;

    // Output CPs: show socket if unconnected
    const isOutputCP = slot.direction === 'output';
    const cpIdx = slot.cpIndex !== undefined ? slot.cpIndex : i;
    const isConnected = isOutputCP && state.connectedOutputCPs.has(`output:${cpIdx}`);
    const isSocket = isOutputCP && !isConnected;
    drawConnectionPoint(ctx, tokens, pos.x, pos.y, RADIUS, signalValue, isSocket, 'left');
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
