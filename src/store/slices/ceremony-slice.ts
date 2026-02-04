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
  /** Canvas snapshot data URL for the zoom-out animation */
  ceremonySnapshot: string | null;
  /** Puzzle info displayed during ceremony */
  ceremonyPuzzle: CeremonyPuzzleInfo | null;
  /** Whether this is a re-solve of an already-completed puzzle */
  ceremonyIsResolve: boolean;
  /** Bake metadata from the winning solution */
  ceremonyBakeMetadata: BakeMetadata | null;

  /** Start the completion ceremony overlay */
  startCeremony: (
    snapshot: string,
    puzzle: CeremonyPuzzleInfo,
    isResolve: boolean,
    bakeMetadata: BakeMetadata,
  ) => void;
  /** Dismiss the completion ceremony overlay */
  dismissCeremony: () => void;
}

export const createCeremonySlice: StateCreator<CeremonySlice> = (set) => ({
  ceremonyActive: false,
  ceremonySnapshot: null,
  ceremonyPuzzle: null,
  ceremonyIsResolve: false,
  ceremonyBakeMetadata: null,

  startCeremony: (snapshot, puzzle, isResolve, bakeMetadata) =>
    set({
      ceremonyActive: true,
      ceremonySnapshot: snapshot,
      ceremonyPuzzle: puzzle,
      ceremonyIsResolve: isResolve,
      ceremonyBakeMetadata: bakeMetadata,
    }),

  dismissCeremony: () =>
    set({
      ceremonyActive: false,
      ceremonySnapshot: null,
      ceremonyPuzzle: null,
      ceremonyIsResolve: false,
      ceremonyBakeMetadata: null,
    }),
});
