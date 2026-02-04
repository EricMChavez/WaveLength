import type { PuzzleDefinition } from '../types.ts';
import {
  TUTORIAL_RECTIFIER,
  TUTORIAL_AMPLIFIER,
  TUTORIAL_DC_OFFSET,
  TUTORIAL_CLIPPER,
  TUTORIAL_SQUARE_GEN,
} from './tutorial-levels.ts';

/** All available puzzle levels in order */
export const PUZZLE_LEVELS: PuzzleDefinition[] = [
  TUTORIAL_RECTIFIER,
  TUTORIAL_AMPLIFIER,
  TUTORIAL_DC_OFFSET,
  TUTORIAL_CLIPPER,
  TUTORIAL_SQUARE_GEN,
];

/** Look up a puzzle by its ID. Returns undefined if not found. */
export function getPuzzleById(id: string): PuzzleDefinition | undefined {
  return PUZZLE_LEVELS.find((p) => p.id === id);
}
