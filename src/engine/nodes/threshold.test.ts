import { describe, it, expect } from 'vitest';
import { evaluateThreshold } from './threshold.ts';

describe('evaluateThreshold', () => {
  it('outputs +100 when A is above threshold', () => {
    expect(evaluateThreshold(60, 50)).toBe(100);
  });

  it('outputs -100 when A is below threshold', () => {
    expect(evaluateThreshold(40, 50)).toBe(-100);
  });

  it('outputs -100 when A equals threshold (not strictly greater)', () => {
    expect(evaluateThreshold(50, 50)).toBe(-100);
  });

  it('handles threshold at 0', () => {
    expect(evaluateThreshold(1, 0)).toBe(100);
    expect(evaluateThreshold(0, 0)).toBe(-100);
    expect(evaluateThreshold(-1, 0)).toBe(-100);
  });

  it('handles edge case A = +100', () => {
    expect(evaluateThreshold(100, 0)).toBe(100);
    expect(evaluateThreshold(100, 100)).toBe(-100);
    expect(evaluateThreshold(100, 99)).toBe(100);
  });

  it('handles edge case A = -100', () => {
    expect(evaluateThreshold(-100, 0)).toBe(-100);
    expect(evaluateThreshold(-100, -100)).toBe(-100);
    expect(evaluateThreshold(-100, -101)).toBe(100);
  });

  it('handles negative threshold', () => {
    expect(evaluateThreshold(-50, -75)).toBe(100);
    expect(evaluateThreshold(-80, -75)).toBe(-100);
  });
});
