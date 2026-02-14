import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { createCeremonySlice } from './ceremony-slice.ts';
import type { CeremonySlice } from './ceremony-slice.ts';
import type { BakeMetadata } from '../../engine/baking/index.ts';

function createTestStore() {
  return create<CeremonySlice>()((...a) => createCeremonySlice(...a));
}

const fakeMeta: BakeMetadata = {
  topoOrder: ['n1'],
  nodeConfigs: [{ id: 'n1', type: 'invert', params: {}, inputCount: 1, outputCount: 1 }],
  edges: [],
  inputCount: 1,
  outputCount: 1,
};

const puzzle = { id: 'p1', title: 'Test', description: 'A test puzzle' };

describe('ceremony-slice', () => {
  it('starts with ceremony inactive', () => {
    const store = createTestStore();
    const s = store.getState();
    expect(s.ceremonyState.type).toBe('inactive');
    expect(s.ceremonyActive).toBe(false);
    expect(s.ceremonyPuzzle).toBeNull();
    expect(s.ceremonyIsResolve).toBe(false);
    expect(s.ceremonyBakeMetadata).toBeNull();
  });

  describe('enterItWorks', () => {
    it('transitions to it-works phase', () => {
      const store = createTestStore();
      store.getState().enterItWorks(puzzle, false, fakeMeta);

      const s = store.getState();
      expect(s.ceremonyState.type).toBe('it-works');
      expect(s.ceremonyActive).toBe(true);
      expect(s.ceremonyPuzzle).toEqual(puzzle);
      expect(s.ceremonyIsResolve).toBe(false);
      expect(s.ceremonyBakeMetadata).toEqual(fakeMeta);
    });

    it('reflects re-solve flag', () => {
      const store = createTestStore();
      store.getState().enterItWorks(puzzle, true, fakeMeta);
      expect(store.getState().ceremonyIsResolve).toBe(true);
    });
  });

  describe('showVictoryScreen', () => {
    it('transitions from it-works to victory-screen', () => {
      const store = createTestStore();
      store.getState().enterItWorks(puzzle, false, fakeMeta);
      store.getState().showVictoryScreen();

      const s = store.getState();
      expect(s.ceremonyState.type).toBe('victory-screen');
      if (s.ceremonyState.type === 'victory-screen') {
        expect(s.ceremonyState.puzzle).toEqual(puzzle);
      }
      expect(s.ceremonyActive).toBe(true);
    });

    it('is a no-op when inactive', () => {
      const store = createTestStore();
      store.getState().showVictoryScreen();
      expect(store.getState().ceremonyState.type).toBe('inactive');
    });
  });

  describe('dismissCeremony', () => {
    it('resets from it-works to inactive', () => {
      const store = createTestStore();
      store.getState().enterItWorks(puzzle, false, fakeMeta);
      store.getState().dismissCeremony();

      const s = store.getState();
      expect(s.ceremonyState.type).toBe('inactive');
      expect(s.ceremonyActive).toBe(false);
      expect(s.ceremonyPuzzle).toBeNull();
    });

    it('resets from victory-screen to inactive', () => {
      const store = createTestStore();
      store.getState().enterItWorks(puzzle, false, fakeMeta);
      store.getState().showVictoryScreen();
      store.getState().dismissCeremony();
      expect(store.getState().ceremonyState.type).toBe('inactive');
    });

    it('is safe to call when already inactive', () => {
      const store = createTestStore();
      store.getState().dismissCeremony();
      expect(store.getState().ceremonyState.type).toBe('inactive');
    });
  });

  describe('startCeremony (legacy alias)', () => {
    it('maps to enterItWorks', () => {
      const store = createTestStore();
      store.getState().startCeremony(puzzle, false, fakeMeta);

      const s = store.getState();
      expect(s.ceremonyState.type).toBe('it-works');
      expect(s.ceremonyActive).toBe(true);
      expect(s.ceremonyPuzzle).toEqual(puzzle);
    });
  });

  describe('full ceremony flow', () => {
    it('progresses through all phases', () => {
      const store = createTestStore();

      // Phase 1: it-works
      store.getState().enterItWorks(puzzle, false, fakeMeta);
      expect(store.getState().ceremonyState.type).toBe('it-works');

      // Phase 2: victory-screen
      store.getState().showVictoryScreen();
      expect(store.getState().ceremonyState.type).toBe('victory-screen');

      // Phase 3: dismiss
      store.getState().dismissCeremony();
      expect(store.getState().ceremonyState.type).toBe('inactive');
      expect(store.getState().ceremonyActive).toBe(false);
    });
  });
});
