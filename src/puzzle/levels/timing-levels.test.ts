import { describe, it, expect } from 'vitest';
import {
  TIMING_DIFFERENCE,
  TIMING_CROSSFADER,
  TIMING_RING_MODULATOR,
} from './timing-levels.ts';
import { generateWaveformValue } from '../waveform-generators.ts';

// ---------------------------------------------------------------------------
// Mathematical correctness — Difference Amplifier: output = A - B
// ---------------------------------------------------------------------------

describe('TIMING_DIFFERENCE mathematical correctness', () => {
  for (const tc of TIMING_DIFFERENCE.testCases) {
    it(`${tc.name}: A - B matches expected output over 64 ticks`, () => {
      const inputA = tc.inputs[0];
      const inputB = tc.inputs[1];
      const expectedDef = tc.expectedOutputs[0];

      for (let t = 0; t < 64; t++) {
        const valA = generateWaveformValue(t, inputA);
        const valB = generateWaveformValue(t, inputB);
        const diff = Math.max(-100, Math.min(100, valA - valB));
        const expected = generateWaveformValue(t, expectedDef);
        expect(expected).toBeCloseTo(diff, 5);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Mathematical correctness — Crossfader: output = (A + B) / 2
// ---------------------------------------------------------------------------

describe('TIMING_CROSSFADER mathematical correctness', () => {
  for (const tc of TIMING_CROSSFADER.testCases) {
    it(`${tc.name}: (A + B) / 2 matches expected output over 64 ticks`, () => {
      const inputA = tc.inputs[0];
      const inputB = tc.inputs[1];
      const expectedDef = tc.expectedOutputs[0];

      for (let t = 0; t < 64; t++) {
        const valA = generateWaveformValue(t, inputA);
        const valB = generateWaveformValue(t, inputB);
        const avg = Math.max(-100, Math.min(100, (valA + valB) / 2));
        const expected = generateWaveformValue(t, expectedDef);
        expect(expected).toBeCloseTo(avg, 5);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Mathematical correctness — Ring Modulator: output = (A × B) / 100
// ---------------------------------------------------------------------------

describe('TIMING_RING_MODULATOR mathematical correctness', () => {
  for (const tc of TIMING_RING_MODULATOR.testCases) {
    it(`${tc.name}: (A × B) / 100 matches expected output over 64 ticks`, () => {
      const inputA = tc.inputs[0];
      const inputB = tc.inputs[1];
      const expectedDef = tc.expectedOutputs[0];

      for (let t = 0; t < 64; t++) {
        const valA = generateWaveformValue(t, inputA);
        const valB = generateWaveformValue(t, inputB);
        const product = Math.max(-100, Math.min(100, (valA * valB) / 100));
        const expected = generateWaveformValue(t, expectedDef);
        expect(expected).toBeCloseTo(product, 5);
      }
    });
  }
});
