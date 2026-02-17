import { describe, it, expect, vi } from 'vitest';
import { createTutorialSlice } from './tutorial-slice';
import type { TutorialSlice, TutorialStep } from './tutorial-slice';

// Minimal step factory
function makeStep(overrides: Partial<TutorialStep> = {}): TutorialStep {
  return {
    id: overrides.id ?? 'test-step',
    text: overrides.text ?? 'Test step',
    highlight: overrides.highlight ?? { type: 'none' },
    tooltipPosition: overrides.tooltipPosition ?? 'center',
    advanceOn: overrides.advanceOn ?? { type: 'click-anywhere' },
    ...overrides,
  };
}

function createSlice(): TutorialSlice {
  const set = vi.fn((fn: unknown) => {
    if (typeof fn === 'function') {
      Object.assign(state, fn(state));
    } else {
      Object.assign(state, fn);
    }
  });
  const get = vi.fn(() => state);
  const state: TutorialSlice = createTutorialSlice(
    set as unknown as Parameters<typeof createTutorialSlice>[0],
    get as unknown as Parameters<typeof createTutorialSlice>[1],
    {} as Parameters<typeof createTutorialSlice>[2],
  );
  return state;
}

vi.stubGlobal('performance', { now: () => 1000 });

describe('TutorialSlice', () => {
  it('starts inactive', () => {
    const state = createSlice();
    expect(state.tutorialState.type).toBe('inactive');
    expect(state.tutorialSteps).toEqual([]);
  });

  it('startTutorial sets state to active at step 0', () => {
    const state = createSlice();
    const steps = [makeStep({ id: 'step-0' }), makeStep({ id: 'step-1' })];
    state.startTutorial(steps);

    expect(state.tutorialState.type).toBe('active');
    if (state.tutorialState.type === 'active') {
      expect(state.tutorialState.stepIndex).toBe(0);
      expect(state.tutorialState.overlayHidden).toBe(false);
    }
    expect(state.tutorialSteps).toHaveLength(2);
  });

  it('advanceTutorial increments step index', () => {
    const state = createSlice();
    const steps = [makeStep({ id: 'a' }), makeStep({ id: 'b' }), makeStep({ id: 'c' })];
    state.startTutorial(steps);
    state.advanceTutorial();

    if (state.tutorialState.type === 'active') {
      expect(state.tutorialState.stepIndex).toBe(1);
    }
  });

  it('advanceTutorial past last step sets state to completed', () => {
    const state = createSlice();
    state.startTutorial([makeStep()]);
    state.advanceTutorial();

    expect(state.tutorialState.type).toBe('completed');
  });

  it('advanceTutorial does nothing when inactive', () => {
    const state = createSlice();
    state.advanceTutorial();
    expect(state.tutorialState.type).toBe('inactive');
  });

  it('setTutorialOverlayHidden toggles overlayHidden', () => {
    const state = createSlice();
    state.startTutorial([makeStep()]);
    state.setTutorialOverlayHidden(true);

    if (state.tutorialState.type === 'active') {
      expect(state.tutorialState.overlayHidden).toBe(true);
    }

    state.setTutorialOverlayHidden(false);
    if (state.tutorialState.type === 'active') {
      expect(state.tutorialState.overlayHidden).toBe(false);
    }
  });

  it('endTutorial resets to inactive', () => {
    const state = createSlice();
    state.startTutorial([makeStep()]);
    state.endTutorial();

    expect(state.tutorialState.type).toBe('inactive');
    expect(state.tutorialSteps).toEqual([]);
  });

  it('isTutorialActive returns true when active', () => {
    const state = createSlice();
    expect(state.isTutorialActive()).toBe(false);
    state.startTutorial([makeStep()]);
    expect(state.isTutorialActive()).toBe(true);
    state.endTutorial();
    expect(state.isTutorialActive()).toBe(false);
  });

  it('getCurrentTutorialStep returns the current step', () => {
    const state = createSlice();
    expect(state.getCurrentTutorialStep()).toBeNull();

    const steps = [makeStep({ id: 'first' }), makeStep({ id: 'second' })];
    state.startTutorial(steps);
    expect(state.getCurrentTutorialStep()?.id).toBe('first');

    state.advanceTutorial();
    expect(state.getCurrentTutorialStep()?.id).toBe('second');
  });

  it('getCurrentTutorialStep returns null when completed', () => {
    const state = createSlice();
    state.startTutorial([makeStep()]);
    state.advanceTutorial();
    expect(state.tutorialState.type).toBe('completed');
    expect(state.getCurrentTutorialStep()).toBeNull();
  });
});
