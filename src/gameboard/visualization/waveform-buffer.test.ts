import { describe, it, expect } from 'vitest';
import { WaveformBuffer } from './waveform-buffer.ts';

describe('WaveformBuffer', () => {
  it('starts empty', () => {
    const buf = new WaveformBuffer(4);
    expect(buf.length()).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  it('pushes values and returns in order', () => {
    const buf = new WaveformBuffer(4);
    buf.push(10);
    buf.push(20);
    buf.push(30);
    expect(buf.length()).toBe(3);
    expect(buf.toArray()).toEqual([10, 20, 30]);
  });

  it('wraps around when capacity is reached', () => {
    const buf = new WaveformBuffer(4);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    expect(buf.length()).toBe(4);
    expect(buf.toArray()).toEqual([1, 2, 3, 4]);

    buf.push(5);
    expect(buf.length()).toBe(4);
    expect(buf.toArray()).toEqual([2, 3, 4, 5]);

    buf.push(6);
    expect(buf.toArray()).toEqual([3, 4, 5, 6]);
  });

  it('clear resets the buffer', () => {
    const buf = new WaveformBuffer(4);
    buf.push(10);
    buf.push(20);
    buf.clear();
    expect(buf.length()).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  it('handles capacity of 1', () => {
    const buf = new WaveformBuffer(1);
    buf.push(42);
    expect(buf.toArray()).toEqual([42]);
    buf.push(99);
    expect(buf.toArray()).toEqual([99]);
  });
});
