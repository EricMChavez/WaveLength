import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { MotherboardSection } from '../../store/motherboard-types.ts';
import { drawHighlightStreakRounded, getLightDirection } from './render-highlight-streak.ts';
import { HIGHLIGHT_STREAK, DEPTH } from '../../shared/constants/index.ts';
import { drawNoiseGrain } from './render-noise-grain.ts';


// ---------------------------------------------------------------------------
// Section container rendering
// ---------------------------------------------------------------------------

/** Section container corner radius in cells. */
const SECTION_CORNER_RADIUS_CELLS = 0.5;

/** Dot matrix parameters (matching gameboard grid style). */
const DOT_OPACITY = 0.3;

/**
 * Draw all motherboard section containers styled like gameboard surfaces.
 * Each section gets: green fill, inset shadow, dot matrix, noise grain,
 * highlight streak — matching the look of the regular gameboard background.
 *
 * Called in the render loop instead of drawGrid() on the motherboard.
 */
export function drawMotherboardSections(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  sections: readonly MotherboardSection[],
  cellSize: number,
): void {
  for (const section of sections) {
    const { col, row, cols, rows } = section.gridBounds;
    const x = col * cellSize;
    const y = row * cellSize;
    const w = cols * cellSize;
    const h = rows * cellSize;
    const r = SECTION_CORNER_RADIUS_CELLS * cellSize;
    const rect = { x, y, width: w, height: h };

    // 1. Green gameboard fill
    ctx.fillStyle = tokens.gridArea;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    // 2. Inset shadow (gameboard-matched depth)
    drawSectionInsetShadow(ctx, rect, r);

    // 3. Dot matrix at grid intersections (clipped to rounded rect)
    drawSectionDots(ctx, tokens, section.gridBounds, cellSize, r);

    // 4. Noise grain (surface texture)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
    drawNoiseGrain(ctx, rect, 0.045, 2);
    ctx.restore();

    // 5. Highlight streak (diagonal light band)
    drawHighlightStreakRounded(
      ctx, rect, r,
      HIGHLIGHT_STREAK.HARD_OPACITY,
      HIGHLIGHT_STREAK.SOFT_OPACITY,
      HIGHLIGHT_STREAK.VERTICAL_FADE_RATIO,
    );
  }
}

/**
 * Draw dot matrix at grid intersections inside a section, clipped to rounded corners.
 * Matches the gameboard dot style from render-grid.ts.
 */
function drawSectionDots(
  ctx: CanvasRenderingContext2D,
  tokens: ThemeTokens,
  bounds: { col: number; row: number; cols: number; rows: number },
  cellSize: number,
  cornerRadius: number,
): void {
  const x = bounds.col * cellSize;
  const y = bounds.row * cellSize;
  const w = bounds.cols * cellSize;
  const h = bounds.rows * cellSize;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, cornerRadius);
  ctx.clip();

  ctx.fillStyle = tokens.gridLine;
  ctx.globalAlpha = DOT_OPACITY;
  const dotRadius = Math.max(1, cellSize * 0.06);

  ctx.beginPath();
  // Draw dots at interior grid intersections within the section
  for (let c = bounds.col + 1; c < bounds.col + bounds.cols; c++) {
    const dx = c * cellSize;
    for (let r = bounds.row + 1; r < bounds.row + bounds.rows; r++) {
      const dy = r * cellSize;
      ctx.moveTo(dx + dotRadius, dy);
      ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Puzzle indicator lights
// ---------------------------------------------------------------------------

export interface PuzzleIndicatorLight {
  gridRow: number;
  chipId: string;
  state: 'locked' | 'unlocked' | 'completed';
  transitionProgress?: number;  // 0-1 animation progress
  transitionFrom?: 'locked' | 'unlocked' | 'completed';
}

/** RGB color triple for lerping. */
interface RGB { r: number; g: number; b: number }

/** Visual properties for a given indicator light state. */
interface LightVisuals {
  fill: RGB;
  glowColor: RGB;
  glowAlpha: number;
  glowBlur: number; // multiplier of cellSize
  specularColor: RGB;
  specularAlpha: number;
}

/** Compute light visuals for a given state (snapshot at current instant). */
function getLightVisuals(state: 'locked' | 'unlocked' | 'completed', now: number): LightVisuals {
  if (state === 'locked') {
    return {
      fill: { r: 74, g: 74, b: 58 },
      glowColor: { r: 0, g: 0, b: 0 },
      glowAlpha: 0,
      glowBlur: 0,
      specularColor: { r: 255, g: 255, b: 255 },
      specularAlpha: 0.15,
    };
  }
  if (state === 'unlocked') {
    const pulse = 0.5 + 0.5 * Math.sin((now / 1200) * Math.PI * 2);
    const brightness = 0.55 + 0.45 * pulse;
    return {
      fill: { r: Math.round(224 * brightness), g: Math.round(56 * brightness), b: Math.round(56 * brightness) },
      glowColor: { r: 224, g: 56, b: 56 },
      glowAlpha: 0.3 + 0.5 * pulse,
      glowBlur: 0.3 + 0.4 * pulse,
      specularColor: { r: 255, g: 200, b: 200 },
      specularAlpha: 0.4,
    };
  }
  // completed
  return {
    fill: { r: 39, g: 251, b: 107 },
    glowColor: { r: 39, g: 251, b: 107 },
    glowAlpha: 0.6,
    glowBlur: 0.5,
    specularColor: { r: 160, g: 253, b: 194 },
    specularAlpha: 0.45,
  };
}

/** Linearly interpolate between two RGB colors. */
function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/** Linearly interpolate between two numbers. */
function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate between two LightVisuals. */
function lerpVisuals(from: LightVisuals, to: LightVisuals, t: number): LightVisuals {
  return {
    fill: lerpRGB(from.fill, to.fill, t),
    glowColor: lerpRGB(from.glowColor, to.glowColor, t),
    glowAlpha: lerpNum(from.glowAlpha, to.glowAlpha, t),
    glowBlur: lerpNum(from.glowBlur, to.glowBlur, t),
    specularColor: lerpRGB(from.specularColor, to.specularColor, t),
    specularAlpha: lerpNum(from.specularAlpha, to.specularAlpha, t),
  };
}

/**
 * Draw LED indicator lights to the right of the puzzle section.
 * Each light is vertically centered with its corresponding puzzle chip.
 *
 * - locked: dark gray, no glow
 * - unlocked: pulsing red
 * - completed: steady green glow
 *
 * Supports animated transitions via transitionProgress/transitionFrom fields.
 */
export function drawPuzzleIndicatorLights(
  ctx: CanvasRenderingContext2D,
  _tokens: ThemeTokens,
  lights: readonly PuzzleIndicatorLight[],
  puzzleSectionRightCol: number,
  cellSize: number,
): void {
  const cx = (puzzleSectionRightCol + 1.5) * cellSize;
  const radius = 0.35 * cellSize;
  const now = Date.now();

  for (const light of lights) {
    const cy = light.gridRow * cellSize;

    // Resolve visuals — lerp if transitioning
    let visuals: LightVisuals;
    if (light.transitionProgress !== undefined && light.transitionFrom !== undefined) {
      const fromV = getLightVisuals(light.transitionFrom, now);
      const toV = getLightVisuals(light.state, now);
      visuals = lerpVisuals(fromV, toV, light.transitionProgress);
    } else {
      visuals = getLightVisuals(light.state, now);
    }

    // --- Housing bezel (dark ring) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + cellSize * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a16';
    ctx.fill();

    // Inset shadow on housing
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = cellSize * 0.15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = cellSize * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a22';
    ctx.fill();
    ctx.restore();

    // --- Glow pass ---
    if (visuals.glowAlpha > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(${visuals.glowColor.r}, ${visuals.glowColor.g}, ${visuals.glowColor.b}, ${visuals.glowAlpha})`;
      ctx.shadowBlur = cellSize * visuals.glowBlur;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${visuals.glowColor.r}, ${visuals.glowColor.g}, ${visuals.glowColor.b}, 0)`;
      ctx.fill();
      ctx.restore();
    }

    // --- LED fill ---
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${visuals.fill.r},${visuals.fill.g},${visuals.fill.b})`;
    ctx.fill();

    // --- Border ring ---
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = Math.max(1, cellSize * 0.06);
    ctx.stroke();

    // --- Specular highlight (small bright spot, upper-left) ---
    const hlX = cx - radius * 0.3;
    const hlY = cy - radius * 0.3;
    const hlRadius = radius * 0.35;
    const grad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlRadius);
    grad.addColorStop(0, `rgba(${visuals.specularColor.r},${visuals.specularColor.g},${visuals.specularColor.b},${visuals.specularAlpha})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(hlX, hlY, hlRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Inset shadow using gameboard-matched DEPTH constants.
 * Two passes: dark (lower-right) + light catch (upper-left).
 */
function drawSectionInsetShadow(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  cornerRadius: number,
): void {
  const light = getLightDirection();
  const darkBlur = DEPTH.INSET.DARK_BLUR;
  const darkOffset = DEPTH.INSET.DARK_OFFSET;
  const lightBlur = DEPTH.INSET.LIGHT_BLUR;
  const lightOffset = DEPTH.INSET.LIGHT_OFFSET;
  const margin = Math.max(darkBlur, lightBlur) + Math.max(darkOffset, lightOffset) + 20;

  // Dark pass
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, cornerRadius);
  ctx.clip();

  ctx.shadowColor = DEPTH.INSET.DARK_COLOR;
  ctx.shadowBlur = darkBlur;
  ctx.shadowOffsetX = -light.x * darkOffset;
  ctx.shadowOffsetY = -light.y * darkOffset;
  ctx.fillStyle = 'rgba(0,0,0,1)';

  ctx.beginPath();
  ctx.rect(rect.x - margin, rect.y - margin, rect.width + margin * 2, rect.height + margin * 2);
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, cornerRadius);
  ctx.fill('evenodd');
  ctx.restore();

  // Light pass
  const warmTint = HIGHLIGHT_STREAK.WARM_TINT;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, cornerRadius);
  ctx.clip();

  ctx.shadowColor = `rgba(${warmTint.r},${warmTint.g},${warmTint.b},${DEPTH.INSET.LIGHT_OPACITY})`;
  ctx.shadowBlur = lightBlur;
  ctx.shadowOffsetX = light.x * lightOffset;
  ctx.shadowOffsetY = light.y * lightOffset;
  ctx.fillStyle = 'rgba(0,0,0,1)';

  ctx.beginPath();
  ctx.rect(rect.x - margin, rect.y - margin, rect.width + margin * 2, rect.height + margin * 2);
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, cornerRadius);
  ctx.fill('evenodd');
  ctx.restore();
}
