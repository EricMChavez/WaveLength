import { describe, it, expect } from 'vitest';
import { evaluateInvert } from './invert.ts';

describe('evaluateInvert', () => {
  it('negates a positive value', () => {
    expect(evaluateInvert(50)).toBe(-50);
  });

  it('negates a negative value', () => {
    expect(evaluateInvert(-50)).toBe(50);
  });

  it('returns 0 for 0', () => {
    expect(evaluateInvert(0)).toBe(0);
  });

  it('handles +100 edge case', () => {
    expect(evaluateInvert(100)).toBe(-100);
  });

  it('handles -100 edge case', () => {
    expect(evaluateInvert(-100)).toBe(100);
  });

  it('clamps overflow beyond +100', () => {
    // -(-200) = 200 → clamped to 100
    expect(evaluateInvert(-200)).toBe(100);
  });

  it('clamps overflow beyond -100', () => {
    // -(200) = -200 → clamped to -100
    expect(evaluateInvert(200)).toBe(-100);
  });
});
