import { CONNECTION_POINT_CONFIG, COLORS } from '../../shared/constants/index.ts';
import { getConnectionPointPosition } from './port-positions.ts';
import { useGameStore } from '../../store/index.ts';
import { isRunning } from '../../simulation/simulation-controller.ts';

/** Draw the gameboard's input and output connection points. */
export function renderConnectionPoints(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const { INPUT_COUNT, OUTPUT_COUNT, RADIUS } = CONNECTION_POINT_CONFIG;

  // Input connection points (left side)
  for (let i = 0; i < INPUT_COUNT; i++) {
    const pos = getConnectionPointPosition('input', i, canvasWidth, canvasHeight);
    drawConnectionPoint(ctx, pos.x, pos.y, RADIUS, `In ${i + 1}`);
  }

  // Get validation state for output glow indicators
  const store = useGameStore.getState();
  const showValidation = isRunning() && store.activePuzzle !== null;
  const { perPortMatch } = store;

  // Output connection points (right side)
  for (let i = 0; i < OUTPUT_COUNT; i++) {
    const pos = getConnectionPointPosition('output', i, canvasWidth, canvasHeight);
    const matchState = showValidation && i < perPortMatch.length
      ? perPortMatch[i]
      : undefined;
    drawConnectionPoint(ctx, pos.x, pos.y, RADIUS, `Out ${i + 1}`, matchState);
  }
}

function drawConnectionPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  label: string,
  matchState?: boolean,
): void {
  // Validation glow ring for output CPs
  if (matchState !== undefined) {
    const glowColor = matchState ? '#50c878' : '#e05050';
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Circle
  ctx.fillStyle = COLORS.CONNECTION_POINT_FILL;
  ctx.strokeStyle = COLORS.CONNECTION_POINT_STROKE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Label
  ctx.fillStyle = COLORS.CONNECTION_POINT_LABEL;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'middle';

  // Place label on the inner side
  const isLeft = label.startsWith('In');
  ctx.textAlign = isLeft ? 'left' : 'right';
  const labelX = isLeft ? x + radius + 6 : x - radius - 6;
  ctx.fillText(label, labelX, y);
}
