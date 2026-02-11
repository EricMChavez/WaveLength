import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../index.ts';

describe('authoring-slice', () => {
  beforeEach(() => {
    useGameStore.getState().cancelAuthoring();
  });

  it('starts in idle phase', () => {
    expect(useGameStore.getState().authoringPhase).toBe('idle');
  });

  it('beginSaveAsPuzzle transitions to saving phase', () => {
    useGameStore.getState().beginSaveAsPuzzle();
    expect(useGameStore.getState().authoringPhase).toBe('saving');
  });

  it('cancelAuthoring returns to idle phase', () => {
    useGameStore.getState().beginSaveAsPuzzle();
    expect(useGameStore.getState().authoringPhase).toBe('saving');

    useGameStore.getState().cancelAuthoring();
    expect(useGameStore.getState().authoringPhase).toBe('idle');
  });

  it('cancelAuthoring is idempotent from idle', () => {
    useGameStore.getState().cancelAuthoring();
    expect(useGameStore.getState().authoringPhase).toBe('idle');
  });
});
