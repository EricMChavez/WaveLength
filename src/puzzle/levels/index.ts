import type { PuzzleDefinition } from '../types.ts';

/** All available puzzle levels in order (populated as players solve puzzles) */
export const PUZZLE_LEVELS: PuzzleDefinition[] = [];

/** Look up a puzzle by its ID. Returns undefined if not found. */
export function getPuzzleById(id: string): PuzzleDefinition | undefined {
  return PUZZLE_LEVELS.find((p) => p.id === id);
}
