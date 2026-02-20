import { describe, it, expect } from 'vitest';
import { createCelebrationSlice } from './celebration-slice.ts';
import type { CelebrationSlice, CelebrationData } from './celebration-slice.ts';

/** Minimal Zustand-like test harness for a single slice. */
function createTestStore() {
  let state: CelebrationSlice;
  const set = (updater: ((s: CelebrationSlice) => Partial<CelebrationSlice>) | Partial<CelebrationSlice>) => {
    const patch = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...patch } as CelebrationSlice;
  };
  const get = () => state;
  const api = { setState: set, getState: get, getInitialState: get, subscribe: () => () => {} } as never;
  state = createCelebrationSlice(set, get, api) as CelebrationSlice;
  return { get: () => state, set };
}

describe('CelebrationSlice', () => {
  const data: CelebrationData = {
    completedChipId: 'menu-level-tutorial-1',
    nextChipId: 'menu-level-tutorial-2',
  };

  const dataNoNext: CelebrationData = {
    completedChipId: 'menu-level-tutorial-4',
    nextChipId: null,
  };

  it('starts in idle state', () => {
    const store = createTestStore();
    expect(store.get().celebrationState.type).toBe('idle');
  });

  it('queueCelebration: idle → pending', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    const cs = store.get().celebrationState;
    expect(cs.type).toBe('pending');
    if (cs.type === 'pending') {
      expect(cs.data).toEqual(data);
    }
  });

  it('queueCelebration: no-op when not idle', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    // Now in paths-flow, queueing should be a no-op
    store.get().queueCelebration(dataNoNext);
    expect(store.get().celebrationState.type).toBe('paths-flow');
  });

  it('startCelebration: pending → paths-flow', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    const cs = store.get().celebrationState;
    expect(cs.type).toBe('paths-flow');
    if (cs.type === 'paths-flow') {
      expect(cs.startTime).toBe(1000);
      expect(cs.data).toEqual(data);
    }
  });

  it('startCelebration: no-op when not pending', () => {
    const store = createTestStore();
    store.get().startCelebration(1000);
    expect(store.get().celebrationState.type).toBe('idle');
  });

  it('advanceCelebration: paths-flow → light-wait', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('light-wait', 1450);
    const cs = store.get().celebrationState;
    expect(cs.type).toBe('light-wait');
    if (cs.type === 'light-wait') {
      expect(cs.startTime).toBe(1450);
    }
  });

  it('advanceCelebration: light-wait → light-on', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('light-wait', 1450);
    store.get().advanceCelebration('light-on', 1750);
    const cs = store.get().celebrationState;
    expect(cs.type).toBe('light-on');
    if (cs.type === 'light-on') {
      expect(cs.startTime).toBe(1750);
    }
  });

  it('advanceCelebration: light-on → next-paths', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('light-wait', 1450);
    store.get().advanceCelebration('light-on', 1750);
    store.get().advanceCelebration('next-paths', 2200);
    const cs = store.get().celebrationState;
    expect(cs.type).toBe('next-paths');
    if (cs.type === 'next-paths') {
      expect(cs.startTime).toBe(2200);
    }
  });

  it('advanceCelebration: next-paths → next-unlock', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('light-wait', 1450);
    store.get().advanceCelebration('light-on', 1750);
    store.get().advanceCelebration('next-paths', 2200);
    store.get().advanceCelebration('next-unlock', 2650);
    const cs = store.get().celebrationState;
    expect(cs.type).toBe('next-unlock');
    if (cs.type === 'next-unlock') {
      expect(cs.startTime).toBe(2650);
    }
  });

  it('advanceCelebration: any → idle', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('idle', 0);
    expect(store.get().celebrationState.type).toBe('idle');
  });

  it('full sequence with nextChipId', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    expect(store.get().celebrationState.type).toBe('paths-flow');
    store.get().advanceCelebration('light-wait', 1450);
    expect(store.get().celebrationState.type).toBe('light-wait');
    store.get().advanceCelebration('light-on', 1750);
    expect(store.get().celebrationState.type).toBe('light-on');
    store.get().advanceCelebration('next-paths', 2200);
    expect(store.get().celebrationState.type).toBe('next-paths');
    store.get().advanceCelebration('next-unlock', 2650);
    expect(store.get().celebrationState.type).toBe('next-unlock');
    store.get().advanceCelebration('idle', 3100);
    expect(store.get().celebrationState.type).toBe('idle');
  });

  it('full sequence without nextChipId (skip next-paths/next-unlock)', () => {
    const store = createTestStore();
    store.get().queueCelebration(dataNoNext);
    store.get().startCelebration(1000);
    expect(store.get().celebrationState.type).toBe('paths-flow');
    store.get().advanceCelebration('light-wait', 1450);
    expect(store.get().celebrationState.type).toBe('light-wait');
    store.get().advanceCelebration('light-on', 1750);
    expect(store.get().celebrationState.type).toBe('light-on');
    // Skip next-paths/next-unlock, go straight to idle
    store.get().advanceCelebration('idle', 2200);
    expect(store.get().celebrationState.type).toBe('idle');
  });

  it('endCelebration forces idle from any state', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('light-wait', 1450);
    store.get().advanceCelebration('light-on', 1750);
    store.get().endCelebration();
    expect(store.get().celebrationState.type).toBe('idle');
  });

  it('advanceCelebration: mismatched phase is no-op', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    // Try to advance to next-unlock from paths-flow (should be no-op — must go through light-wait/light-on first)
    store.get().advanceCelebration('next-unlock', 1450);
    expect(store.get().celebrationState.type).toBe('paths-flow');
  });

  it('advanceCelebration: light-on from paths-flow is no-op (must go through light-wait)', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    // Try to skip light-wait
    store.get().advanceCelebration('light-on', 1450);
    expect(store.get().celebrationState.type).toBe('paths-flow');
  });

  it('advanceCelebration: next-paths from light-wait is no-op', () => {
    const store = createTestStore();
    store.get().queueCelebration(data);
    store.get().startCelebration(1000);
    store.get().advanceCelebration('light-wait', 1450);
    // Try to skip light-on
    store.get().advanceCelebration('next-paths', 1750);
    expect(store.get().celebrationState.type).toBe('light-wait');
  });
});
