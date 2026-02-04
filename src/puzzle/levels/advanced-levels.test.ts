import { describe, it, expect } from 'vitest';
import {
  ADVANCED_SPLITTER,
  ADVANCED_GAIN_STAGE,
  ADVANCED_QUADRUPLER,
} from './advanced-levels.ts';
import { generateWaveformValue } from '../waveform-generators.ts';

// ---------------------------------------------------------------------------
// Mathematical correctness — Signal Splitter: out_A = max(input, 0), out_B = max(-input, 0)
// ---------------------------------------------------------------------------

describe('ADVANCED_SPLITTER mathematical correctness', () => {
  for (const tc of ADVANCED_SPLITTER.testCases) {
    it(`${tc.name}: max(input, 0) matches output A over 64 ticks`, () => {
      const inputDef = tc.inputs[0];
      const expectedA = tc.expectedOutputs[0];

      for (let t = 0; t < 64; t++) {
        const inputVal = generateWaveformValue(t, inputDef);
        const posHalf = Math.max(inputVal, 0);
        const expected = generateWaveformValue(t, expectedA);
        expect(expected).toBeCloseTo(posHalf, 5);
      }
    });

    it(`${tc.name}: max(-input, 0) matches output B over 64 ticks`, () => {
      const inputDef = tc.inputs[0];
      const expectedB = tc.expectedOutputs[1];

      for (let t = 0; t < 64; t++) {
        const inputVal = generateWaveformValue(t, inputDef);
        const negHalf = Math.max(-inputVal, 0);
        const expected = generateWaveformValue(t, expectedB);
        expect(expected).toBeCloseTo(negHalf, 5);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Mathematical correctness — Gain Stage: output = input/2 + 50
// ---------------------------------------------------------------------------

describe('ADVANCED_GAIN_STAGE mathematical correctness', () => {
  for (const tc of ADVANCED_GAIN_STAGE.testCases) {
    it(`${tc.name}: input/2 + 50 matches expected output over 64 ticks`, () => {
      const inputDef = tc.inputs[0];
      const expectedDef = tc.expectedOutputs[0];

      for (let t = 0; t < 64; t++) {
        const inputVal = generateWaveformValue(t, inputDef);
        const gained = Math.max(-100, Math.min(100, inputVal / 2 + 50));
        const expected = generateWaveformValue(t, expectedDef);
        expect(expected).toBeCloseTo(gained, 5);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Mathematical correctness — Quadrupler: output = 4 * input
// ---------------------------------------------------------------------------

describe('ADVANCED_QUADRUPLER mathematical correctness', () => {
  for (const tc of ADVANCED_QUADRUPLER.testCases) {
    it(`${tc.name}: 4 * input matches expected output over 64 ticks`, () => {
      const inputDef = tc.inputs[0];
      const expectedDef = tc.expectedOutputs[0];

      for (let t = 0; t < 64; t++) {
        const inputVal = generateWaveformValue(t, inputDef);
        const quadrupled = Math.max(-100, Math.min(100, 4 * inputVal));
        const expected = generateWaveformValue(t, expectedDef);
        expect(expected).toBeCloseTo(quadrupled, 5);
      }
    });
  }
});
