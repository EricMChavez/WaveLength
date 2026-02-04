import type { PuzzleDefinition } from '../types.ts';
import {
  TUTORIAL_RECTIFIER,
  TUTORIAL_AMPLIFIER,
  TUTORIAL_DC_OFFSET,
  TUTORIAL_CLIPPER,
  TUTORIAL_SQUARE_GEN,
} from './tutorial-levels.ts';
import {
  SIGNAL_INVERTER,
  SIGNAL_ATTENUATOR,
  SIGNAL_FULLWAVE_RECTIFIER,
  SIGNAL_DELAY,
} from './signal-shaping-levels.ts';
import {
  TIMING_DIFFERENCE,
  TIMING_CROSSFADER,
  TIMING_RING_MODULATOR,
} from './timing-levels.ts';
import {
  ADVANCED_SPLITTER,
  ADVANCED_GAIN_STAGE,
  ADVANCED_QUADRUPLER,
} from './advanced-levels.ts';

/** All available puzzle levels in order */
export const PUZZLE_LEVELS: PuzzleDefinition[] = [
  TUTORIAL_RECTIFIER,
  TUTORIAL_AMPLIFIER,
  TUTORIAL_DC_OFFSET,
  TUTORIAL_CLIPPER,
  TUTORIAL_SQUARE_GEN,
  SIGNAL_INVERTER,
  SIGNAL_ATTENUATOR,
  SIGNAL_FULLWAVE_RECTIFIER,
  SIGNAL_DELAY,
  TIMING_DIFFERENCE,
  TIMING_CROSSFADER,
  TIMING_RING_MODULATOR,
  ADVANCED_SPLITTER,
  ADVANCED_GAIN_STAGE,
  ADVANCED_QUADRUPLER,
];

/** Look up a puzzle by its ID. Returns undefined if not found. */
export function getPuzzleById(id: string): PuzzleDefinition | undefined {
  return PUZZLE_LEVELS.find((p) => p.id === id);
}
