import type { ThemeTokens } from '../../shared/tokens/index.ts';
import { PLAYABLE_START, PLAYABLE_END, GRID_ROWS } from '../../shared/grid/index.ts';
import { BOARD_MESSAGE_CARD } from '../../shared/constants/index.ts';
import { CARD_TITLE_FONT, CARD_BODY_FONT, areCardFontsLoaded } from '../../shared/fonts/font-ready.ts';

// --- OffscreenCanvas card cache ---
let _cardCache: OffscreenCanvas | null = null;
let _cardCacheTitle = '';
let _cardCacheBody = '';
let _cardCacheCellSize = 0;
let _cardCacheFontsLoaded = false;
/** Card width from last render (for horizontal centering) */
let _cardCacheWidth = 0;

/** Invalidate the card cache (used in tests). */
export function invalidateCardCache(): void {
  _cardCache = null;
  _cardCacheTitle = '';
  _cardCacheBody = '';
  _cardCacheCellSize = 0;
  _cardCacheFontsLoaded = false;
  _cardCacheWidth = 0;
}

/**
 * Draw a white card with stencil/cutout text on the gameboard.
 * Text is punched through the card via globalCompositeOperation = 'destination-out',
 * revealing the dark gameboard surface underneath.
 *
 * Renders beneath noise grain and highlight streak layers so those textures
 * integrate into the card surface.
 */
export function drawBoardMessageCard(
  ctx: CanvasRenderingContext2D,
  _tokens: ThemeTokens,
  title: string | undefined,
  body: string | undefined,
  cellSize: number,
): void {
  if (!title && !body) return;

  const safeTitle = title ?? '';
  const safeBody = body ?? '';
  const fontsLoaded = areCardFontsLoaded();

  const playableX = PLAYABLE_START * cellSize;
  const playableCols = PLAYABLE_END - PLAYABLE_START + 1;
  const playableWidth = playableCols * cellSize;
  const totalHeight = GRID_ROWS * cellSize;

  // Get or rebuild the cached card OffscreenCanvas
  const card = getCardCache(safeTitle, safeBody, cellSize, fontsLoaded, playableWidth);
  if (!card) return;

  // Position: centered horizontally in playable area, near top
  const cardX = playableX + (playableWidth - _cardCacheWidth) / 2;
  const cardY = totalHeight * BOARD_MESSAGE_CARD.TOP_RATIO;

  ctx.save();

  // Clip to playable area so card doesn't bleed into meter zones
  ctx.beginPath();
  ctx.rect(playableX, 0, playableWidth, totalHeight);
  ctx.clip();

  ctx.globalAlpha = BOARD_MESSAGE_CARD.CARD_OPACITY;
  ctx.drawImage(card, cardX, cardY);

  ctx.restore();
}

/**
 * Get or regenerate the stencil card OffscreenCanvas.
 * Only redraws when title, body, cellSize, or fontsLoaded changes.
 */
function getCardCache(
  title: string,
  body: string,
  cellSize: number,
  fontsLoaded: boolean,
  playableWidth: number,
): OffscreenCanvas | null {
  if (
    _cardCache &&
    _cardCacheTitle === title &&
    _cardCacheBody === body &&
    _cardCacheCellSize === cellSize &&
    _cardCacheFontsLoaded === fontsLoaded
  ) {
    return _cardCache;
  }

  if (typeof OffscreenCanvas === 'undefined') return null;

  const cfg = BOARD_MESSAGE_CARD;
  const maxWidth = playableWidth * cfg.MAX_WIDTH_RATIO;
  const paddingH = cellSize * cfg.PADDING_H_RATIO;
  const paddingV = cellSize * cfg.PADDING_V_RATIO;
  const gap = cellSize * cfg.GAP_RATIO;
  const cornerRadius = cellSize * cfg.CORNER_RADIUS_RATIO;

  // Font sizes
  const titleFontSize = Math.round(cfg.TITLE_FONT_SIZE_RATIO * cellSize);
  const bodyFontSize = Math.round(cfg.BODY_FONT_SIZE_RATIO * cellSize);
  const bodyLineHeight = bodyFontSize * cfg.BODY_LINE_HEIGHT;

  // Create a temporary canvas for text measurement
  const measureCanvas = new OffscreenCanvas(1, 1);
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) return null;

  // Measure title
  const titleFont = `${titleFontSize}px ${CARD_TITLE_FONT}`;
  measureCtx.font = titleFont;
  measureCtx.letterSpacing = '1px';
  const maxTextWidth = maxWidth - paddingH * 2;
  const titleWidth = title ? Math.min(measureCtx.measureText(title).width, maxTextWidth) : 0;
  const titleHeight = title ? titleFontSize : 0;

  // Measure and word-wrap body
  const bodyFont = `bold ${bodyFontSize}px ${CARD_BODY_FONT}`;
  measureCtx.font = bodyFont;
  const wrappedLines = body ? wordWrap(measureCtx, body.split('\n'), maxTextWidth) : [];
  const bodyTotalHeight = wrappedLines.length * bodyLineHeight;
  let bodyMaxLineWidth = 0;
  for (const line of wrappedLines) {
    bodyMaxLineWidth = Math.max(bodyMaxLineWidth, measureCtx.measureText(line).width);
  }

  // Compute card dimensions
  const contentWidth = Math.max(titleWidth, bodyMaxLineWidth);
  const hasTitle = titleHeight > 0;
  const hasBody = wrappedLines.length > 0;
  const gapHeight = hasTitle && hasBody ? gap : 0;
  const contentHeight = titleHeight + gapHeight + bodyTotalHeight;

  const cardWidth = Math.ceil(contentWidth + paddingH * 2);
  const cardHeight = Math.ceil(contentHeight + paddingV * 2);

  // Create the stencil card
  const canvas = new OffscreenCanvas(cardWidth, cardHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Fill white rounded rect
  ctx.fillStyle = cfg.CARD_COLOR;
  ctx.beginPath();
  ctx.roundRect(0, 0, cardWidth, cardHeight, cornerRadius);
  ctx.fill();

  // 2. Punch out text with destination-out
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';

  // Draw title (centered)
  if (hasTitle) {
    ctx.font = titleFont;
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, cardWidth / 2, paddingV, maxTextWidth);
  }

  // Draw body lines (centered)
  if (hasBody) {
    ctx.font = bodyFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const bodyStartY = paddingV + titleHeight + gapHeight;
    for (let i = 0; i < wrappedLines.length; i++) {
      ctx.fillText(wrappedLines[i], cardWidth / 2, bodyStartY + i * bodyLineHeight, maxTextWidth);
    }
  }

  // Cache
  _cardCache = canvas;
  _cardCacheTitle = title;
  _cardCacheBody = body;
  _cardCacheCellSize = cellSize;
  _cardCacheFontsLoaded = fontsLoaded;
  _cardCacheWidth = cardWidth;

  return canvas;
}

/** Simple word-wrap: split text into lines that fit within maxWidth. */
function wordWrap(
  ctx: OffscreenCanvasRenderingContext2D,
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
