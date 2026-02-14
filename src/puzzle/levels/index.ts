import type { PuzzleDefinition } from '../types.ts';

import {
  TUTORIAL_01,
  TUTORIAL_02,
  TUTORIAL_03,
  TUTORIAL_04,
  TUTORIAL_05,
  TUTORIAL_06,
  DEVORCE,
  JOLT,
} from './tutorial-levels.ts';

/** All available puzzle levels in order */
export const PUZZLE_LEVELS: PuzzleDefinition[] = [
  TUTORIAL_01,
  TUTORIAL_02,
  TUTORIAL_03,
  TUTORIAL_04,
  TUTORIAL_05,
  TUTORIAL_06,
  DEVORCE,
  JOLT,
];

/** Look up a puzzle by its ID. Returns undefined if not found. */
export function getPuzzleById(id: string): PuzzleDefinition | undefined {
  return PUZZLE_LEVELS.find((p) => p.id === id);
}
