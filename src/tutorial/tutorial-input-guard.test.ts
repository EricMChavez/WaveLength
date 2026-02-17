import { describe, it, expect } from 'vitest';
import { isTutorialPaletteBlocked } from './tutorial-input-guard';
import type { TutorialStep } from '../store/slices/tutorial-slice';

function makeStep(overrides: Partial<TutorialStep> = {}): TutorialStep {
  return {
    id: 'test',
    text: 'Test',
    highlight: { type: 'none' },
    tooltipPosition: 'center',
    advanceOn: { type: 'click-anywhere' },
    ...overrides,
  };
}

describe('isTutorialPaletteBlocked', () => {
  it('blocks palette when allowOverlays is not set', () => {
    const step = makeStep();
    expect(isTutorialPaletteBlocked(step)).toBe(true);
  });

  it('blocks palette when allowOverlays is false', () => {
    const step = makeStep({ allowOverlays: false });
    expect(isTutorialPaletteBlocked(step)).toBe(true);
  });

  it('allows palette when allowOverlays is true', () => {
    const step = makeStep({ allowOverlays: true });
    expect(isTutorialPaletteBlocked(step)).toBe(false);
  });
});
