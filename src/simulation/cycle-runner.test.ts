import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/index.ts';

describe('cycle-runner', () => {
  beforeEach(() => {
    useGameStore.getState().exitCreativeMode();
    useGameStore.getState().clearSavedCreativeState();
    useGameStore.getState().setCycleResults(null);
  });

  describe('creative slot waveform changes trigger recomputation', () => {
    it('recomputes cycle results when creative slot waveform shape changes', () => {
      // Set up creative mode with an active board
      useGameStore.getState().enterCreativeMode();
      useGameStore.getState().setActiveBoard({ id: 'creative-mode', chips: new Map(), paths: [] });

      // Configure slot 0 as input so it generates waveform data
      useGameStore.getState().setCreativeSlotDirection(0, 'input');

      // Clear results to detect recomputation
      useGameStore.getState().setCycleResults(null);

      // Changing the waveform shape should trigger recomputation
      useGameStore.getState().setCreativeSlotWaveformShape(0, 'square-quarter');

      const results = useGameStore.getState().cycleResults;
      expect(results).not.toBeNull();
    });

    it('recomputes cycle results when creative slot waveform def changes', () => {
      useGameStore.getState().enterCreativeMode();
      useGameStore.getState().setActiveBoard({ id: 'creative-mode', chips: new Map(), paths: [] });
      useGameStore.getState().setCreativeSlotDirection(0, 'input');

      useGameStore.getState().setCycleResults(null);

      // Changing the full waveform def should trigger recomputation
      useGameStore.getState().setCreativeSlotWaveform(0, {
        shape: 'triangle-quarter',
        amplitude: 80,
        period: 128,
        phase: 0,
        offset: 0,
      });

      const results = useGameStore.getState().cycleResults;
      expect(results).not.toBeNull();
    });
  });
});
