import { describe, it, expect } from 'vitest';
import { addNode } from './add';

describe('Add node', () => {
  const evaluate = (a: number, x: number) =>
    addNode.evaluate({
      inputs: [a, x],
      params: { amount: 0 },
      state: undefined,
      tickIndex: 0,
    });

  it('has correct metadata', () => {
    expect(addNode.type).toBe('add');
    expect(addNode.category).toBe('math');
    expect(addNode.inputs).toHaveLength(2);
    expect(addNode.outputs).toHaveLength(1);
    expect(addNode.size).toEqual({ width: 4, height: 3 });
  });

  it('has X input with bottom side override', () => {
    expect(addNode.inputs[1].name).toBe('X');
    expect(addNode.inputs[1].side).toBe('bottom');
  });

  it('adds A + X', () => {
    expect(evaluate(30, 20)).toEqual([50]);
    expect(evaluate(50, -25)).toEqual([25]);
    expect(evaluate(-40, 40)).toEqual([0]);
  });

  it('X=0 passes through', () => {
    expect(evaluate(50, 0)).toEqual([50]);
    expect(evaluate(-50, 0)).toEqual([-50]);
    expect(evaluate(0, 0)).toEqual([0]);
  });

  it('clamps positive overflow', () => {
    expect(evaluate(80, 50)).toEqual([100]);
    expect(evaluate(100, 100)).toEqual([100]);
    expect(evaluate(60, 60)).toEqual([100]);
  });

  it('clamps negative overflow', () => {
    expect(evaluate(-80, -50)).toEqual([-100]);
    expect(evaluate(-100, -100)).toEqual([-100]);
    expect(evaluate(-60, -60)).toEqual([-100]);
  });

  it('handles zero input', () => {
    expect(evaluate(0, 100)).toEqual([100]);
    expect(evaluate(0, -100)).toEqual([-100]);
    expect(evaluate(0, 50)).toEqual([50]);
  });

  it('handles all 9 knob positions', () => {
    const a = 40;
    expect(evaluate(a, -100)).toEqual([-60]);
    expect(evaluate(a, -75)).toEqual([-35]);
    expect(evaluate(a, -50)).toEqual([-10]);
    expect(evaluate(a, -25)).toEqual([15]);
    expect(evaluate(a, 0)).toEqual([40]);
    expect(evaluate(a, 25)).toEqual([65]);
    expect(evaluate(a, 50)).toEqual([90]);
    expect(evaluate(a, 75)).toEqual([100]); // clamped from 115
    expect(evaluate(a, 100)).toEqual([100]); // clamped from 140
  });

  it('has amount parameter with correct config', () => {
    expect(addNode.params).toHaveLength(1);
    const param = addNode.params![0];
    expect(param.key).toBe('amount');
    expect(param.default).toBe(0);
    expect(param.min).toBe(-100);
    expect(param.max).toBe(100);
    expect(param.step).toBe(25);
  });
});
