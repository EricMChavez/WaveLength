import { describe, it, expect } from 'vitest';
import { validatePort, validateAllPorts, getVictoryThreshold } from './validation.ts';
import type { PuzzleTestCase } from './types.ts';

describe('validatePort', () => {
  it('matches when actual equals target', () => {
    expect(validatePort(50, 50, 5)).toBe(true);
  });

  it('matches when difference is exactly at tolerance boundary', () => {
    expect(validatePort(55, 50, 5)).toBe(true);
    expect(validatePort(45, 50, 5)).toBe(true);
  });

  it('does not match when difference exceeds tolerance', () => {
    expect(validatePort(56, 50, 5)).toBe(false);
    expect(validatePort(44, 50, 5)).toBe(false);
  });

  it('handles negative values', () => {
    expect(validatePort(-50, -50, 5)).toBe(true);
    expect(validatePort(-45, -50, 5)).toBe(true);
    expect(validatePort(-44, -50, 5)).toBe(false);
  });

  it('handles zero tolerance', () => {
    expect(validatePort(50, 50, 0)).toBe(true);
    expect(validatePort(50.1, 50, 0)).toBe(false);
  });
});

describe('validateAllPorts', () => {
  it('returns allMatch true when all ports match', () => {
    const result = validateAllPorts([50, 60], [50, 60], 5);
    expect(result.allMatch).toBe(true);
    expect(result.perPort).toEqual([true, true]);
  });

  it('returns allMatch false when one port fails', () => {
    const result = validateAllPorts([50, 70], [50, 60], 5);
    expect(result.allMatch).toBe(false);
    expect(result.perPort).toEqual([true, false]);
  });

  it('returns allMatch false when all ports fail', () => {
    const result = validateAllPorts([0, 0], [50, 60], 5);
    expect(result.allMatch).toBe(false);
    expect(result.perPort).toEqual([false, false]);
  });

  it('returns allMatch false for empty arrays', () => {
    const result = validateAllPorts([], [], 5);
    expect(result.allMatch).toBe(false);
    expect(result.perPort).toEqual([]);
  });

  it('uses min length when arrays differ in length', () => {
    const result = validateAllPorts([50, 60, 70], [50, 60], 5);
    expect(result.perPort).toHaveLength(2);
    expect(result.allMatch).toBe(true);
  });

  it('handles single port', () => {
    const result = validateAllPorts([50], [55], 5);
    expect(result.allMatch).toBe(true);
    expect(result.perPort).toEqual([true]);
  });
});

describe('getVictoryThreshold', () => {
  function makeTestCase(periods: number[]): PuzzleTestCase {
    return {
      name: 'test',
      inputs: [],
      expectedOutputs: periods.map((period) => ({
        shape: 'sine' as const,
        amplitude: 100,
        period,
        phase: 0,
        offset: 0,
      })),
    };
  }

  it('returns 2 * period for single output', () => {
    const tc = makeTestCase([32]);
    expect(getVictoryThreshold(tc)).toBe(64);
  });

  it('uses max period across multiple outputs', () => {
    const tc = makeTestCase([16, 32, 8]);
    expect(getVictoryThreshold(tc)).toBe(64);
  });

  it('returns 0 for no expected outputs', () => {
    const tc = makeTestCase([]);
    expect(getVictoryThreshold(tc)).toBe(0);
  });

  it('handles equal periods', () => {
    const tc = makeTestCase([20, 20]);
    expect(getVictoryThreshold(tc)).toBe(40);
  });
});
