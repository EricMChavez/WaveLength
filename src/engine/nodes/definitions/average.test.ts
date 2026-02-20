import { describe, it, expect } from 'vitest';
import { averageChip } from './average';

describe('Average node', () => {
  const evaluate = (a: number, b: number) =>
    averageChip.evaluate({
      inputs: [a, b],
      params: {},
      state: undefined,
      tickIndex: 0,
    });

  it('has correct metadata', () => {
    expect(averageChip.type).toBe('average');
    expect(averageChip.category).toBe('math');
    expect(averageChip.sockets).toHaveLength(2);
    expect(averageChip.plugs).toHaveLength(1);
    expect(averageChip.size).toEqual({ width: 2, height: 2 });
  });

  it('averages two positive values', () => {
    expect(evaluate(30, 70)).toEqual([50]);
    expect(evaluate(0, 100)).toEqual([50]);
  });

  it('averages two negative values', () => {
    expect(evaluate(-60, -20)).toEqual([-40]);
    expect(evaluate(-100, -50)).toEqual([-75]);
  });

  it('averages mixed values', () => {
    expect(evaluate(-50, 50)).toEqual([0]);
    expect(evaluate(50, -50)).toEqual([0]);
  });

  it('handles zeros', () => {
    expect(evaluate(0, 0)).toEqual([0]);
    expect(evaluate(0, 50)).toEqual([25]);
    expect(evaluate(-50, 0)).toEqual([-25]);
  });

  it('handles equal values', () => {
    expect(evaluate(42, 42)).toEqual([42]);
    expect(evaluate(-100, -100)).toEqual([-100]);
  });

  it('handles boundary values', () => {
    expect(evaluate(-100, 100)).toEqual([0]);
    expect(evaluate(100, -100)).toEqual([0]);
    expect(evaluate(100, 100)).toEqual([100]);
    expect(evaluate(-100, -100)).toEqual([-100]);
  });

  it('handles odd sums producing fractional results', () => {
    expect(evaluate(1, 2)).toEqual([1.5]);
    expect(evaluate(-1, 0)).toEqual([-0.5]);
  });
});
