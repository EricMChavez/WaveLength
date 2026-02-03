import { describe, it, expect } from 'vitest';
import { clamp } from './index.ts';

describe('clamp', () => {
  it('returns value when within default range', () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(50)).toBe(50);
    expect(clamp(-50)).toBe(-50);
  });

  it('clamps to -100 at lower bound', () => {
    expect(clamp(-100)).toBe(-100);
    expect(clamp(-101)).toBe(-100);
    expect(clamp(-999)).toBe(-100);
  });

  it('clamps to +100 at upper bound', () => {
    expect(clamp(100)).toBe(100);
    expect(clamp(101)).toBe(100);
    expect(clamp(999)).toBe(100);
  });

  it('handles edge case values', () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(-100)).toBe(-100);
    expect(clamp(100)).toBe(100);
  });

  it('supports custom range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('normalizes negative zero to positive zero', () => {
    expect(Object.is(clamp(-0), 0)).toBe(true);
  });
});
