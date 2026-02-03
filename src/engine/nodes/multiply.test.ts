import { describe, it, expect } from 'vitest';
import { evaluateMultiply } from './multiply.ts';

describe('evaluateMultiply', () => {
  it('computes (A * B) / 100 for typical values', () => {
    expect(evaluateMultiply(50, 50)).toBe(25);
  });

  it('returns 0 when either input is 0', () => {
    expect(evaluateMultiply(0, 100)).toBe(0);
    expect(evaluateMultiply(100, 0)).toBe(0);
    expect(evaluateMultiply(0, 0)).toBe(0);
  });

  it('handles max positive inputs', () => {
    // (100 * 100) / 100 = 100
    expect(evaluateMultiply(100, 100)).toBe(100);
  });

  it('handles max negative inputs', () => {
    // (-100 * -100) / 100 = 100
    expect(evaluateMultiply(-100, -100)).toBe(100);
  });

  it('handles mixed sign inputs', () => {
    // (100 * -100) / 100 = -100
    expect(evaluateMultiply(100, -100)).toBe(-100);
    // (-100 * 100) / 100 = -100
    expect(evaluateMultiply(-100, 100)).toBe(-100);
  });

  it('handles -100 edge case', () => {
    expect(evaluateMultiply(-100, 0)).toBe(0);
    expect(evaluateMultiply(0, -100)).toBe(0);
  });

  it('clamps overflow beyond +100', () => {
    // If inputs somehow exceed range: (200 * 200) / 100 = 400 → clamped to 100
    expect(evaluateMultiply(200, 200)).toBe(100);
  });

  it('clamps overflow beyond -100', () => {
    // (200 * -200) / 100 = -400 → clamped to -100
    expect(evaluateMultiply(200, -200)).toBe(-100);
  });

  it('produces fractional-precision results', () => {
    // (33 * 33) / 100 = 10.89
    expect(evaluateMultiply(33, 33)).toBeCloseTo(10.89);
  });
});
