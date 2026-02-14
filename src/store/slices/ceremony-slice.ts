import type { StateCreator } from 'zustand';
import type { BakeMetadata } from '../../engine/baking/index.ts';

export interface CeremonyPuzzleInfo {
  id: string;
  title: string;
  description: string;
}

export interface CeremonySlice {
  /** Whether the completion ceremony overlay is active */
  ceremonyActive: boolean;
  /** Puzzle info displayed during ceremony */
  ceremonyPuzzle: CeremonyPuzzleInfo | null;
  /** Whether this is a re-solve of an already-completed puzzle */
  ceremonyIsResolve: boolean;
  /** Bake metadata from the winning solution */
  ceremonyBakeMetadata: BakeMetadata | null;

  /** Start the completion ceremony overlay */
  startCeremony: (
    puzzle: CeremonyPuzzleInfo,
    isResolve: boolean,
    bakeMetadata: BakeMetadata,
  ) => void;
  /** Dismiss the completion ceremony overlay */
  dismissCeremony: () => void;
}

export const createCeremonySlice: StateCreator<CeremonySlice> = (set) => ({
  ceremonyActive: false,
  ceremonyPuzzle: null,
  ceremonyIsResolve: false,
  ceremonyBakeMetadata: null,

  startCeremony: (puzzle, isResolve, bakeMetadata) =>
    set({
      ceremonyActive: true,
      ceremonyPuzzle: puzzle,
      ceremonyIsResolve: isResolve,
      ceremonyBakeMetadata: bakeMetadata,
    }),

  dismissCeremony: () =>
    set({
      ceremonyActive: false,
      ceremonyPuzzle: null,
      ceremonyIsResolve: false,
      ceremonyBakeMetadata: null,
    }),
});
