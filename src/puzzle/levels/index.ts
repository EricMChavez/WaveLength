import type { PuzzleDefinition } from '../types.ts';
import { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6 } from './tutorial-levels.ts';
/** All available puzzle levels in order (populated as players solve puzzles) */
export const PUZZLE_LEVELS: PuzzleDefinition[] = [LEVEL_1,  LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6  ];

/** Look up a puzzle by its ID. Returns undefined if not found. */
export function getPuzzleById(id: string): PuzzleDefinition | undefined {
  return PUZZLE_LEVELS.find((p) => p.id === id);
}
