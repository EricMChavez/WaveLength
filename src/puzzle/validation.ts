import type { PuzzleTestCase } from './types.ts';
import { VALIDATION_CONFIG } from '../shared/constants/index.ts';

/** Check if a single actual value matches a target within tolerance. */
export function validatePort(actual: number, target: number, tolerance: number): boolean {
  return Math.abs(actual - target) <= tolerance;
}

/** Validate all output ports against their targets. */
export function validateAllPorts(
  actuals: number[],
  targets: number[],
  tolerance: number,
): { allMatch: boolean; perPort: boolean[] } {
  const len = Math.min(actuals.length, targets.length);
  const perPort: boolean[] = [];
  let allMatch = len > 0;

  for (let i = 0; i < len; i++) {
    const match = validatePort(actuals[i], targets[i], tolerance);
    perPort.push(match);
    if (!match) allMatch = false;
  }

  if (len === 0) allMatch = false;

  return { allMatch, perPort };
}

/**
 * Calculate the victory threshold for a test case.
 * Returns VICTORY_CYCLES * max(period across expectedOutputs).
 */
export function getVictoryThreshold(testCase: PuzzleTestCase): number {
  if (testCase.expectedOutputs.length === 0) return 0;

  let maxPeriod = 0;
  for (const output of testCase.expectedOutputs) {
    if (output.period > maxPeriod) {
      maxPeriod = output.period;
    }
  }

  return VALIDATION_CONFIG.VICTORY_CYCLES * maxPeriod;
}
