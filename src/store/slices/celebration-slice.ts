import type { StateCreator } from 'zustand';

// ---------------------------------------------------------------------------
// Celebration state machine
// ---------------------------------------------------------------------------

export interface CelebrationData {
  completedChipId: string;   // e.g. 'menu-level-tutorial-1'
  nextChipId: string | null; // e.g. 'menu-level-tutorial-2' or null
}

export type CelebrationState =
  | { type: 'idle' }
  | { type: 'pending'; data: CelebrationData }
  | { type: 'paths-flow'; data: CelebrationData; startTime: number }
  | { type: 'light-wait'; data: CelebrationData; startTime: number }
  | { type: 'light-on'; data: CelebrationData; startTime: number }
  | { type: 'next-paths'; data: CelebrationData; startTime: number }
  | { type: 'next-unlock'; data: CelebrationData; startTime: number };

export interface CelebrationSlice {
  celebrationState: CelebrationState;
  queueCelebration: (data: CelebrationData) => void;
  startCelebration: (now: number) => void;
  advanceCelebration: (phase: 'light-wait' | 'light-on' | 'next-paths' | 'next-unlock' | 'idle', now: number) => void;
  endCelebration: () => void;
}

export const createCelebrationSlice: StateCreator<CelebrationSlice> = (set) => ({
  celebrationState: { type: 'idle' },

  queueCelebration: (data) =>
    set((state) => {
      if (state.celebrationState.type !== 'idle') return state;
      return { celebrationState: { type: 'pending', data } };
    }),

  startCelebration: (now) =>
    set((state) => {
      if (state.celebrationState.type !== 'pending') return state;
      return {
        celebrationState: {
          type: 'paths-flow',
          data: state.celebrationState.data,
          startTime: now,
        },
      };
    }),

  advanceCelebration: (phase, now) =>
    set((state) => {
      const cs = state.celebrationState;
      // paths-flow → light-wait
      if (phase === 'light-wait' && cs.type === 'paths-flow') {
        return { celebrationState: { type: 'light-wait', data: cs.data, startTime: now } };
      }
      // light-wait → light-on
      if (phase === 'light-on' && cs.type === 'light-wait') {
        return { celebrationState: { type: 'light-on', data: cs.data, startTime: now } };
      }
      // light-on → next-paths (if nextChipId) or idle
      if (phase === 'next-paths' && cs.type === 'light-on') {
        return { celebrationState: { type: 'next-paths', data: cs.data, startTime: now } };
      }
      // next-paths → next-unlock
      if (phase === 'next-unlock' && cs.type === 'next-paths') {
        return { celebrationState: { type: 'next-unlock', data: cs.data, startTime: now } };
      }
      if (phase === 'idle') {
        return { celebrationState: { type: 'idle' } };
      }
      return state;
    }),

  endCelebration: () =>
    set(() => ({ celebrationState: { type: 'idle' } })),
});
