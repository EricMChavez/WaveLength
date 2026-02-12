import { describe, it, expect } from 'vitest';
import { maxNode } from './max';

describe('Max node', () => {
  const evaluate = (a: number, b: number) =>
    maxNode.evaluate({
      inputs: [a, b],
      params: {},
      state: undefined,
      tickIndex: 0,
    });

  it('has correct metadata', () => {
    expect(maxNode.type).toBe('max');
    expect(maxNode.category).toBe('math');
    expect(maxNode.inputs).toHaveLength(2);
    expect(maxNode.outputs).toHaveLength(1);
    expect(maxNode.size).toEqual({ width: 2, height: 2 });
  });

  it('returns larger of two positive values', () => {
    expect(evaluate(30, 70)).toEqual([70]);
    expect(evaluate(100, 50)).toEqual([100]);
  });

  it('returns larger of two negative values', () => {
    expect(evaluate(-30, -70)).toEqual([-30]);
    expect(evaluate(-100, -50)).toEqual([-50]);
  });

  it('returns larger of mixed values', () => {
    expect(evaluate(-50, 50)).toEqual([50]);
    expect(evaluate(50, -50)).toEqual([50]);
  });

  it('handles zeros', () => {
    expect(evaluate(0, 0)).toEqual([0]);
    expect(evaluate(0, 50)).toEqual([50]);
    expect(evaluate(-50, 0)).toEqual([0]);
  });

  it('handles equal values', () => {
    expect(evaluate(42, 42)).toEqual([42]);
    expect(evaluate(-100, -100)).toEqual([-100]);
  });

  it('handles boundary values', () => {
    expect(evaluate(-100, 100)).toEqual([100]);
    expect(evaluate(100, -100)).toEqual([100]);
    expect(evaluate(100, 100)).toEqual([100]);
    expect(evaluate(-100, -100)).toEqual([-100]);
  });
});
