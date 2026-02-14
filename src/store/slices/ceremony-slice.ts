import type { StateCreator } from 'zustand';
import type { BakeMetadata } from '../../engine/baking/index.ts';

export interface CeremonyPuzzleInfo {
  id: string;
  title: string;
  description: string;
}

export type CeremonyState =
  | { type: 'inactive' }
  | { type: 'it-works'; puzzle: CeremonyPuzzleInfo; isResolve: boolean; bakeMetadata: BakeMetadata }
  | { type: 'victory-screen'; puzzle: CeremonyPuzzleInfo; isResolve: boolean; bakeMetadata: BakeMetadata };

export interface CeremonySlice {
  /** Discriminated union ceremony state machine */
  ceremonyState: CeremonyState;

  /** Whether any ceremony phase is active (convenience getter) */
  ceremonyActive: boolean;
  /** Puzzle info displayed during ceremony (convenience for CompletionCeremony) */
  ceremonyPuzzle: CeremonyPuzzleInfo | null;
  /** Whether this is a re-solve (convenience) */
  ceremonyIsResolve: boolean;
  /** Bake metadata (convenience) */
  ceremonyBakeMetadata: BakeMetadata | null;

  /** Enter the "it works" celebration phase */
  enterItWorks: (puzzle: CeremonyPuzzleInfo, isResolve: boolean, bakeMetadata: BakeMetadata) => void;
  /** Transition to the victory screen phase */
  showVictoryScreen: () => void;
  /** Dismiss ceremony entirely (reset to inactive) */
  dismissCeremony: () => void;

  // Legacy aliases kept for compatibility during transition
  startCeremony: (puzzle: CeremonyPuzzleInfo, isResolve: boolean, bakeMetadata: BakeMetadata) => void;
}

function deriveConvenience(state: CeremonyState) {
  if (state.type === 'inactive') {
    return {
      ceremonyActive: false,
      ceremonyPuzzle: null,
      ceremonyIsResolve: false,
      ceremonyBakeMetadata: null,
    };
  }
  return {
    ceremonyActive: true,
    ceremonyPuzzle: state.puzzle,
    ceremonyIsResolve: state.isResolve,
    ceremonyBakeMetadata: state.bakeMetadata,
  };
}

export const createCeremonySlice: StateCreator<CeremonySlice> = (set) => ({
  ceremonyState: { type: 'inactive' },
  ceremonyActive: false,
  ceremonyPuzzle: null,
  ceremonyIsResolve: false,
  ceremonyBakeMetadata: null,

  enterItWorks: (puzzle, isResolve, bakeMetadata) => {
    const state: CeremonyState = {
      type: 'it-works',
      puzzle,
      isResolve,
      bakeMetadata,
    };
    set({ ceremonyState: state, ...deriveConvenience(state) });
  },

  showVictoryScreen: () =>
    set((prev) => {
      if (prev.ceremonyState.type !== 'it-works') return prev;
      const state: CeremonyState = {
        type: 'victory-screen',
        puzzle: prev.ceremonyState.puzzle,
        isResolve: prev.ceremonyState.isResolve,
        bakeMetadata: prev.ceremonyState.bakeMetadata,
      };
      return { ceremonyState: state, ...deriveConvenience(state) };
    }),

  dismissCeremony: () => {
    const state: CeremonyState = { type: 'inactive' };
    set({ ceremonyState: state, ...deriveConvenience(state) });
  },

  // Legacy alias — maps to enterItWorks
  startCeremony: (puzzle, isResolve, bakeMetadata) => {
    const state: CeremonyState = {
      type: 'it-works',
      puzzle,
      isResolve,
      bakeMetadata,
    };
    set({ ceremonyState: state, ...deriveConvenience(state) });
  },
});
