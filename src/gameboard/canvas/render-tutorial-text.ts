import type { ThemeTokens } from '../../shared/tokens/index.ts';
import { PLAYABLE_START, PLAYABLE_END, GRID_ROWS } from '../../shared/grid/index.ts';
import { NODE_STYLE, TUTORIAL_TEXT } from '../../shared/constants/index.ts';

/**
 * Draw tutorial message text on the gameboard surface.
 * Rendered beneath dots and highlight streak for an "engraved" appearance.
 * Nodes and wires render on top, so the player never feels constrained.
 */
export function drawTutorialText(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  message: string,
  cellSize: number,
): void {
  if (!message) return;

  const playableX = PLAYABLE_START * cellSize;
  const playableCols = PLAYABLE_END - PLAYABLE_START + 1;
  const playableWidth = playableCols * cellSize;
  const totalHeight = GRID_ROWS * cellSize;

  const fontSize = Math.round(TUTORIAL_TEXT.FONT_SIZE_RATIO * cellSize);
  const maxWidth = playableWidth * TUTORIAL_TEXT.MAX_WIDTH_RATIO;
  const centerX = playableX + playableWidth / 2;
  const centerY = totalHeight * TUTORIAL_TEXT.VERTICAL_CENTER;

  ctx.save();

  // Clip to playable area so text doesn't bleed into meter zones
  ctx.beginPath();
  ctx.rect(playableX, 0, playableWidth, totalHeight);
  ctx.clip();

  ctx.globalAlpha = TUTORIAL_TEXT.OPACITY;
  ctx.fillStyle = tokens.textPrimary;
  ctx.font = `${fontSize}px ${NODE_STYLE.LABEL_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Split message into lines and word-wrap each
  const rawLines = message.split('\n');
  const wrappedLines = wordWrap(ctx, rawLines, maxWidth);

  const lineHeight = fontSize * TUTORIAL_TEXT.LINE_HEIGHT;
  const totalTextHeight = wrappedLines.length * lineHeight;
  const startY = centerY - totalTextHeight / 2 + lineHeight / 2;

  for (let i = 0; i < wrappedLines.length; i++) {
    ctx.fillText(wrappedLines[i], centerX, startY + i * lineHeight, maxWidth);
  }

  ctx.restore();
}

/** Simple word-wrap: split text into lines that fit within maxWidth. */
function wordWrap(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxWidth: number,
): string[] {
  const result: string[] = [];
  for (const line of lines) {
    const words = line.split(' ');
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !current) {
        current = test;
      } else {
        result.push(current);
        current = word;
      }
    }
    if (current) result.push(current);
  }
  return result;
}
