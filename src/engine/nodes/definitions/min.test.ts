import { describe, it, expect } from 'vitest';
import { minNode } from './min';

describe('Min node', () => {
  const evaluate = (a: number, b: number) =>
    minNode.evaluate({
      inputs: [a, b],
      params: {},
      state: undefined,
      tickIndex: 0,
    });

  it('has correct metadata', () => {
    expect(minNode.type).toBe('min');
    expect(minNode.category).toBe('math');
    expect(minNode.inputs).toHaveLength(2);
    expect(minNode.outputs).toHaveLength(1);
    expect(minNode.size).toEqual({ width: 2, height: 2 });
  });

  it('returns smaller of two positive values', () => {
    expect(evaluate(30, 70)).toEqual([30]);
    expect(evaluate(100, 50)).toEqual([50]);
  });

  it('returns smaller of two negative values', () => {
    expect(evaluate(-30, -70)).toEqual([-70]);
    expect(evaluate(-100, -50)).toEqual([-100]);
  });

  it('returns smaller of mixed values', () => {
    expect(evaluate(-50, 50)).toEqual([-50]);
    expect(evaluate(50, -50)).toEqual([-50]);
  });

  it('handles zeros', () => {
    expect(evaluate(0, 0)).toEqual([0]);
    expect(evaluate(0, 50)).toEqual([0]);
    expect(evaluate(-50, 0)).toEqual([-50]);
  });

  it('handles equal values', () => {
    expect(evaluate(42, 42)).toEqual([42]);
    expect(evaluate(-100, -100)).toEqual([-100]);
  });

  it('handles boundary values', () => {
    expect(evaluate(-100, 100)).toEqual([-100]);
    expect(evaluate(100, -100)).toEqual([-100]);
    expect(evaluate(100, 100)).toEqual([100]);
    expect(evaluate(-100, -100)).toEqual([-100]);
  });
});
