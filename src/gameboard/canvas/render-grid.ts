import type { ThemeTokens } from '../../shared/tokens/index.ts';
import type { RenderGridState } from './render-types.ts';
import {
  GRID_COLS,
  GRID_ROWS,
  METER_LEFT_START,
  METER_LEFT_END,
  PLAYABLE_START,
  PLAYABLE_END,
  METER_RIGHT_START,
  METER_RIGHT_END,
} from '../../shared/grid/index.ts';
import { getDevOverrides } from '../../dev/index.ts';
import { GAMEBOARD_STYLE } from '../../shared/constants/index.ts';
import { drawHighlightStreak } from './render-highlight-streak.ts';
import { drawTutorialText } from './render-tutorial-text.ts';

/**
 * Draw the gameboard grid zones and grid lines.
 * Called first in the render loop (lowest z-order).
 *
 * Layer order within this function:
 * 1. Flat background fill
 * 2. Tutorial text (engraved appearance, under dots)
 * 3. Dot matrix at grid intersections
 * 4. Highlight streak (diagonal light band, on top of everything)
 * 5. Debug grid labels (dev only)
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  state: RenderGridState,
  cellSize: number,
): void {
  const devOverrides = getDevOverrides();
  const useOverrides = devOverrides.enabled;

  // Get style values (use dev overrides if enabled)
  const gridLineColor = useOverrides ? devOverrides.colors.gridLine : tokens.gridLine;
  const lineOpacity = useOverrides ? devOverrides.gridStyle.lineOpacity : 0.8;

  const prevAlpha = ctx.globalAlpha;
  if (state.gridOpacity !== undefined) {
    ctx.globalAlpha = state.gridOpacity;
  }

  const totalHeight = GRID_ROWS * cellSize;
  const cornerRadius = cellSize * GAMEBOARD_STYLE.CORNER_RADIUS_RATIO;

  // 1. Playable area flat background
  const playableX = PLAYABLE_START * cellSize;
  const playableCols = PLAYABLE_END - PLAYABLE_START + 1;
  const playableWidth = playableCols * cellSize;
  ctx.fillStyle = tokens.gridArea;
  ctx.beginPath();
  ctx.roundRect(playableX, 0, playableWidth, totalHeight, cornerRadius);
  ctx.fill();

  // Meter zones are transparent — each meter draws its own opaque backing

  // 2. Tutorial text (under dots and streak, over flat fill)
  if (state.tutorialMessage) {
    drawTutorialText(ctx, tokens, state.tutorialMessage, cellSize);
  }

  // 3. Dot matrix at grid intersections in the playable area
  ctx.save();
  // Clip to rounded rect so dots don't appear in corners
  ctx.beginPath();
  ctx.roundRect(playableX, 0, playableCols * cellSize, totalHeight, cornerRadius);
  ctx.clip();

  if (lineOpacity !== 1.0) {
    ctx.globalAlpha = ctx.globalAlpha * lineOpacity;
  }
  ctx.fillStyle = gridLineColor;

  const dotRadius = Math.max(1, cellSize * 0.06);

  ctx.beginPath();
  for (let col = PLAYABLE_START + 1; col <= PLAYABLE_END; col++) {
    const x = col * cellSize;
    for (let row = 1; row < GRID_ROWS; row++) {
      const y = row * cellSize;
      ctx.moveTo(x + dotRadius, y);
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();

  // 4. Highlight streak across playable area (on top of dots)
  drawHighlightStreak(ctx, {
    x: playableX,
    y: 0,
    width: playableWidth,
    height: totalHeight,
  });

  // 5. Debug grid labels (dev override only)
  const showLabels = devOverrides.enabled && devOverrides.gridStyle.showGridLabels;
  if (showLabels) {
    ctx.save();
    const fontSize = Math.max(8, Math.floor(cellSize * 0.35));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        // Show every 5th intersection, plus edges
        const isEdgeCol = col === 0 || col === GRID_COLS - 1 || col === PLAYABLE_START || col === PLAYABLE_END;
        const isEdgeRow = row === 0 || row === GRID_ROWS - 1;
        const isFifth = col % 5 === 0 && row % 5 === 0;

        if (!isFifth && !isEdgeCol && !isEdgeRow) continue;

        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        const label = `${col},${row}`;

        // Background pill for readability
        const metrics = ctx.measureText(label);
        const padX = 2;
        const padY = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          x - metrics.width / 2 - padX,
          y - fontSize / 2 - padY,
          metrics.width + padX * 2,
          fontSize + padY * 2,
        );

        // Zone coloring: playable = green, meter = cyan, other = white
        if (col >= PLAYABLE_START && col <= PLAYABLE_END) {
          ctx.fillStyle = '#88ff88';
        } else if (
          (col >= METER_LEFT_START && col <= METER_LEFT_END) ||
          (col >= METER_RIGHT_START && col <= METER_RIGHT_END)
        ) {
          ctx.fillStyle = '#88ffff';
        } else {
          ctx.fillStyle = '#ffffff';
        }

        ctx.fillText(label, x, y);
      }
    }
    ctx.restore();
  }

  // Restore alpha
  if (state.gridOpacity !== undefined) {
    ctx.globalAlpha = prevAlpha;
  }
}
