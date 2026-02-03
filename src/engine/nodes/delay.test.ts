import { describe, it, expect } from 'vitest';
import { createDelayState, evaluateDelay } from './delay.ts';

describe('Delay node', () => {
  describe('createDelayState', () => {
    it('creates a buffer of size subdivisions + 1', () => {
      const state = createDelayState(4);
      expect(state.buffer).toHaveLength(5);
      expect(state.buffer.every((v) => v === 0)).toBe(true);
      expect(state.writeIndex).toBe(0);
    });

    it('creates a buffer of size 1 for 0 subdivisions (pass-through)', () => {
      const state = createDelayState(0);
      expect(state.buffer).toHaveLength(1);
    });

    it('creates a buffer of size 17 for max 16 subdivisions', () => {
      const state = createDelayState(16);
      expect(state.buffer).toHaveLength(17);
    });
  });

  describe('evaluateDelay', () => {
    it('passes through immediately with 0 subdivisions delay', () => {
      const state = createDelayState(0);
      // Buffer size 1: write and read same position
      expect(evaluateDelay(50, state)).toBe(50);
      expect(evaluateDelay(75, state)).toBe(75);
    });

    it('delays output by N subdivisions', () => {
      const state = createDelayState(3);
      // Buffer: [0, 0, 0, 0], initial output is 0 (buffer pre-filled)
      expect(evaluateDelay(10, state)).toBe(0); // reads old 0
      expect(evaluateDelay(20, state)).toBe(0); // reads old 0
      expect(evaluateDelay(30, state)).toBe(0); // reads old 0
      expect(evaluateDelay(40, state)).toBe(10); // reads first input after 3 ticks
      expect(evaluateDelay(50, state)).toBe(20);
      expect(evaluateDelay(60, state)).toBe(30);
    });

    it('delays by 1 subdivision', () => {
      const state = createDelayState(1);
      expect(evaluateDelay(42, state)).toBe(0); // reads initial 0
      expect(evaluateDelay(99, state)).toBe(42); // reads previous input
      expect(evaluateDelay(10, state)).toBe(99);
    });

    it('outputs 0 initially (buffer pre-filled with 0)', () => {
      const state = createDelayState(5);
      for (let i = 0; i < 5; i++) {
        expect(evaluateDelay(100, state)).toBe(0);
      }
      // After 5 ticks of delay, first input emerges
      expect(evaluateDelay(100, state)).toBe(100);
    });

    it('handles edge case input -100', () => {
      const state = createDelayState(1);
      expect(evaluateDelay(-100, state)).toBe(0);
      expect(evaluateDelay(0, state)).toBe(-100);
    });

    it('handles edge case input +100', () => {
      const state = createDelayState(1);
      expect(evaluateDelay(100, state)).toBe(0);
      expect(evaluateDelay(0, state)).toBe(100);
    });

    it('clamps overflow values', () => {
      const state = createDelayState(0);
      expect(evaluateDelay(200, state)).toBe(100);
      expect(evaluateDelay(-200, state)).toBe(-100);
    });

    it('handles max delay of 16 subdivisions', () => {
      const state = createDelayState(16);
      evaluateDelay(77, state);
      // Need 16 more ticks before it emerges
      for (let i = 0; i < 15; i++) {
        expect(evaluateDelay(0, state)).toBe(0);
      }
      expect(evaluateDelay(0, state)).toBe(77);
    });
  });
});
