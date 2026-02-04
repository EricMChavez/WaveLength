import type { StateCreator } from 'zustand';
import type { BakeMetadata } from '../../engine/baking/index.ts';

/** A completed puzzle node available in the palette */
export interface PuzzleNodeEntry {
  puzzleId: string;
  title: string;
  description: string;
  inputCount: number;
  outputCount: number;
  bakeMetadata: BakeMetadata;
}

export interface PaletteSlice {
  /** Completed puzzle nodes available for placement */
  puzzleNodes: Map<string, PuzzleNodeEntry>;

  /** Add a completed puzzle node to the palette */
  addPuzzleNode: (entry: PuzzleNodeEntry) => void;
  /** Update bake metadata for an existing puzzle node (re-solve) */
  updatePuzzleNode: (puzzleId: string, metadata: BakeMetadata) => void;
}

export const createPaletteSlice: StateCreator<PaletteSlice> = (set) => ({
  puzzleNodes: new Map(),

  addPuzzleNode: (entry) =>
    set((state) => {
      const next = new Map(state.puzzleNodes);
      next.set(entry.puzzleId, entry);
      return { puzzleNodes: next };
    }),

  updatePuzzleNode: (puzzleId, metadata) =>
    set((state) => {
      const existing = state.puzzleNodes.get(puzzleId);
      if (!existing) return {};
      const next = new Map(state.puzzleNodes);
      next.set(puzzleId, { ...existing, bakeMetadata: metadata });
      return { puzzleNodes: next };
    }),
});
