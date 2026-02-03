import { describe, it, expect } from 'vitest';
import { WtsClock, SUBDIVISIONS_PER_WTS } from './wts-clock.ts';

describe('WtsClock', () => {
  it('starts at tick 0', () => {
    const clock = new WtsClock();
    expect(clock.getTick()).toBe(0);
    expect(clock.getSubdivision()).toBe(0);
    expect(clock.getWtsCycle()).toBe(0);
  });

  it('advances by 1 each tick', () => {
    const clock = new WtsClock();
    clock.tick();
    expect(clock.getTick()).toBe(1);
    clock.tick();
    expect(clock.getTick()).toBe(2);
  });

  it('has 16 subdivisions per WTS', () => {
    expect(SUBDIVISIONS_PER_WTS).toBe(16);
  });

  it('completes 1 WTS cycle after 16 ticks', () => {
    const clock = new WtsClock();
    for (let i = 0; i < 16; i++) {
      clock.tick();
    }
    expect(clock.getWtsCycle()).toBe(1);
    expect(clock.getSubdivision()).toBe(0);
    expect(clock.getTick()).toBe(16);
  });

  it('tracks subdivision within a cycle (0–15)', () => {
    const clock = new WtsClock();
    for (let i = 0; i < 16; i++) {
      expect(clock.getSubdivision()).toBe(i);
      clock.tick();
    }
    // Wraps back to 0
    expect(clock.getSubdivision()).toBe(0);
  });

  it('counts multiple WTS cycles', () => {
    const clock = new WtsClock();
    for (let i = 0; i < 48; i++) {
      clock.tick();
    }
    expect(clock.getWtsCycle()).toBe(3);
    expect(clock.getSubdivision()).toBe(0);
  });

  it('resets to tick 0', () => {
    const clock = new WtsClock();
    for (let i = 0; i < 20; i++) {
      clock.tick();
    }
    clock.reset();
    expect(clock.getTick()).toBe(0);
    expect(clock.getSubdivision()).toBe(0);
    expect(clock.getWtsCycle()).toBe(0);
  });

  it('mid-cycle subdivision is correct', () => {
    const clock = new WtsClock();
    for (let i = 0; i < 21; i++) {
      clock.tick();
    }
    // 21 ticks = 1 full cycle (16) + 5
    expect(clock.getWtsCycle()).toBe(1);
    expect(clock.getSubdivision()).toBe(5);
  });
});
