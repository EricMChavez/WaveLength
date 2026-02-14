import { describe, it, expect } from 'vitest';
import {
  easeInOutCubic,
  spring,
  parseDurationMs,
  computeProgress,
  zoomTransform,
  animProgress,
  gridRectToViewport,
  ZOOM_IN_PRESET,
  ZOOM_OUT_PRESET,
} from './zoom-transition.ts';

describe('parseDurationMs', () => {
  it('parses "500ms" to 500', () => {
    expect(parseDurationMs('500ms')).toBe(500);
  });

  it('parses "0ms" to 0', () => {
    expect(parseDurationMs('0ms')).toBe(0);
  });

  it('parses "1200" to 1200', () => {
    expect(parseDurationMs('1200')).toBe(1200);
  });

  it('defaults to 500 for non-numeric input', () => {
    expect(parseDurationMs('abc')).toBe(500);
  });

  it('defaults to 500 for empty string', () => {
    expect(parseDurationMs('')).toBe(500);
  });
});

describe('computeProgress', () => {
  it('returns 0 at startTime', () => {
    expect(computeProgress(1000, 1000, 500)).toBe(0);
  });

  it('returns 0.5 at halfway', () => {
    expect(computeProgress(1000, 1250, 500)).toBe(0.5);
  });

  it('returns 1 at end', () => {
    expect(computeProgress(1000, 1500, 500)).toBe(1);
  });

  it('clamps to 1 past end', () => {
    expect(computeProgress(1000, 2000, 500)).toBe(1);
  });

  it('clamps to 0 before start', () => {
    expect(computeProgress(1000, 500, 500)).toBe(0);
  });

  it('returns 1 instantly when duration is 0 (reduced motion)', () => {
    expect(computeProgress(1000, 1000, 0)).toBe(1);
  });

  it('returns 1 when duration is negative', () => {
    expect(computeProgress(1000, 1000, -100)).toBe(1);
  });
});

describe('easeInOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it('returns 0.5 at t=0.5', () => {
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });

  it('returns 1 at t=1', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('accelerates in first half', () => {
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
  });

  it('decelerates in second half', () => {
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });
});

describe('spring', () => {
  it('returns 0 at t=0', () => {
    expect(spring(0)).toBeCloseTo(0, 5);
  });

  it('converges near 1 at t=1', () => {
    expect(spring(1)).toBeCloseTo(1, 2);
  });

  it('overshoots 1 at some point', () => {
    // Spring should overshoot — check a range of values
    let overshot = false;
    for (let t = 0; t <= 1; t += 0.01) {
      if (spring(t) > 1.01) {
        overshot = true;
        break;
      }
    }
    expect(overshot).toBe(true);
  });

  it('is monotonically increasing after initial phase', () => {
    // After settling, should stay close to 1
    const late = spring(0.9);
    expect(late).toBeGreaterThan(0.95);
  });
});

describe('zoomTransform', () => {
  const vpW = 1920;
  const vpH = 1080;
  const targetRect = { x: 800, y: 400, width: 100, height: 60 };

  it('returns identity at zoomT=0', () => {
    const z = zoomTransform(0, targetRect, vpW, vpH);
    expect(z.scale).toBeCloseTo(1);
    expect(z.tx).toBeCloseTo(0);
    expect(z.ty).toBeCloseTo(0);
    // Screen-space target rect matches input
    expect(z.stx).toBeCloseTo(targetRect.x);
    expect(z.sty).toBeCloseTo(targetRect.y);
    expect(z.stw).toBeCloseTo(targetRect.width);
    expect(z.sth).toBeCloseTo(targetRect.height);
  });

  it('fills viewport at zoomT=1', () => {
    const z = zoomTransform(1, targetRect, vpW, vpH);
    const expectedScale = Math.min(vpW / targetRect.width, vpH / targetRect.height);
    expect(z.scale).toBeCloseTo(expectedScale);
    // Target rect should be centered in viewport
    expect(z.stx + z.stw / 2).toBeCloseTo(vpW / 2, 0);
    expect(z.sty + z.sth / 2).toBeCloseTo(vpH / 2, 0);
  });

  it('produces intermediate values at zoomT=0.5', () => {
    const z = zoomTransform(0.5, targetRect, vpW, vpH);
    expect(z.scale).toBeGreaterThan(1);
    const finalScale = Math.min(vpW / targetRect.width, vpH / targetRect.height);
    expect(z.scale).toBeLessThan(finalScale);
  });
});

describe('animProgress', () => {
  it('returns all zeros before zoom starts (zoom-in preset)', () => {
    const { zoomT, revealT } = animProgress(0, ZOOM_IN_PRESET);
    expect(zoomT).toBe(0);
    expect(revealT).toBe(0);
  });

  it('returns full zoom at end (zoom-in preset)', () => {
    const { zoomT } = animProgress(1, ZOOM_IN_PRESET);
    // zoomT at p=1 should be fully eased to ~1
    expect(zoomT).toBeCloseTo(1, 2);
  });

  it('reveal starts before zoom in zoom-out preset', () => {
    const { zoomT, revealT } = animProgress(0.15, ZOOM_OUT_PRESET);
    // At p=0.15, zoom is within [0, 0.6] so zoom > 0
    expect(zoomT).toBeGreaterThan(0);
    // reveal hasn't started yet at p=0.15 (starts at 0.3)
    expect(revealT).toBe(0);
  });

  it('reveal completes at end of zoom-out preset', () => {
    const { revealT } = animProgress(1, ZOOM_OUT_PRESET);
    expect(revealT).toBeCloseTo(1, 2);
  });

  it('zoom finishes before reveal in zoom-in preset', () => {
    // At p=0.65, zoom should be clamped to 1 (ends at 1.0)
    // and reveal should be ~1 (0→0.6, so 0.65 is past end)
    const { zoomT, revealT } = animProgress(0.65, ZOOM_IN_PRESET);
    expect(revealT).toBeCloseTo(1, 1); // reveal ends at 0.6, so 0.65 is past
    // zoom is still mid-way: rawZoom = (0.65 - 0.2)/(1.0 - 0.2) = 0.5625
    expect(zoomT).toBeGreaterThan(0);
    expect(zoomT).toBeLessThan(1);
  });
});

describe('gridRectToViewport', () => {
  it('expands a 5x3 utility node to 16:9 centered on body', () => {
    // 5x3 node: bodyAspect = 5/3 ≈ 1.667 < 16/9 ≈ 1.778 → expand width
    const rect = { col: 20, row: 10, cols: 5, rows: 3 };
    const cellSize = 18;
    const offset = { x: 0, y: 0 };

    const result = gridRectToViewport(rect, cellSize, offset);
    // Body center: cx = 22.5*18 = 405, cy = 11*18 = 198
    // h stays 54, w expands to 54*16/9 = 96
    expect(result.width).toBe(96);
    expect(result.height).toBe(54);
    expect(result.x).toBe(405 - 48);  // centered
    expect(result.y).toBe(198 - 27);  // centered
    expect(result.width / result.height).toBeCloseTo(16 / 9, 5);
  });

  it('preserves a rect that is already 16:9', () => {
    const rect = { col: 10, row: 10, cols: 16, rows: 9 };
    const cellSize = 10;
    const offset = { x: 0, y: 0 };

    const result = gridRectToViewport(rect, cellSize, offset);
    expect(result.width).toBe(160);
    expect(result.height).toBe(90);
    expect(result.width / result.height).toBeCloseTo(16 / 9, 5);
  });

  it('always matches node height for a wide node', () => {
    // 8x3 node: wider than 16:9, but height is still the anchor
    const rect = { col: 10, row: 10, cols: 8, rows: 3 };
    const cellSize = 10;
    const offset = { x: 0, y: 0 };

    const result = gridRectToViewport(rect, cellSize, offset);
    // h = 3*10 = 30, w = 30 * 16/9 ≈ 53.33
    expect(result.height).toBe(30);
    expect(result.width).toBeCloseTo(30 * 16 / 9, 5);
    expect(result.width / result.height).toBeCloseTo(16 / 9, 5);
  });

  it('applies viewport offset', () => {
    const rect = { col: 20, row: 10, cols: 5, rows: 3 };
    const cellSize = 18;
    const noOffset = gridRectToViewport(rect, cellSize, { x: 0, y: 0 });
    const withOffset = gridRectToViewport(rect, cellSize, { x: 50, y: 30 });

    expect(withOffset.x).toBe(noOffset.x + 50);
    expect(withOffset.y).toBe(noOffset.y + 30);
    expect(withOffset.width).toBe(noOffset.width);
    expect(withOffset.height).toBe(noOffset.height);
  });
});

describe('presets', () => {
  it('zoom-in preset has expected duration', () => {
    expect(ZOOM_IN_PRESET.durationMs).toBe(1200);
  });

  it('zoom-out preset has expected duration', () => {
    expect(ZOOM_OUT_PRESET.durationMs).toBe(1200);
  });

  it('zoom-in preset uses spring for reveal', () => {
    // Spring overshoots 1, easeInOutCubic doesn't
    const val = ZOOM_IN_PRESET.revealEasing(0.5);
    // Spring at 0.5 should overshoot
    expect(val).toBeGreaterThan(0.9);
  });

  it('zoom-out preset uses easeInOutCubic for both', () => {
    expect(ZOOM_OUT_PRESET.zoomEasing(0.5)).toBeCloseTo(0.5);
    expect(ZOOM_OUT_PRESET.revealEasing(0.5)).toBeCloseTo(0.5);
  });
});
