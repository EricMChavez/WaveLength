import type { StateCreator } from 'zustand';
import type { CycleResults } from '../../engine/evaluation/index.ts';

export interface PlaypointSlice {
  /** Results from cycle-based evaluation, null if no graph */
  cycleResults: CycleResults | null;
  /** Current playpoint position (0-255) */
  playpoint: number;
  /** Playback mode */
  playMode: 'playing' | 'paused';

  /** Set cycle evaluation results */
  setCycleResults: (results: CycleResults | null) => void;
  /** Set playpoint to specific cycle */
  setPlaypoint: (cycle: number) => void;
  /** Step playpoint by delta, wrapping 0-255 */
  stepPlaypoint: (delta: number) => void;
  /** Toggle between playing and paused */
  togglePlayMode: () => void;
  /** Set play mode explicitly */
  setPlayMode: (mode: 'playing' | 'paused') => void;
}

export const createPlaypointSlice: StateCreator<PlaypointSlice> = (set) => ({
  cycleResults: null,
  playpoint: 0,
  playMode: 'playing',

  setCycleResults: (results) => set({ cycleResults: results }),

  setPlaypoint: (cycle) => set({ playpoint: Math.max(0, Math.min(255, cycle)) }),

  stepPlaypoint: (delta) =>
    set((state) => ({
      playpoint: ((state.playpoint + delta) % 256 + 256) % 256,
    })),

  togglePlayMode: () =>
    set((state) => ({
      playMode: state.playMode === 'playing' ? 'paused' : 'playing',
    })),

  setPlayMode: (mode) => set({ playMode: mode }),
});
