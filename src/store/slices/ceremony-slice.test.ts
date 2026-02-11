import { describe, it, expect } from 'vitest';
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

describe('ceremony-slice', () => {
  it('starts with ceremony inactive', () => {
    const store = createTestStore();
    const s = store.getState();
    expect(s.ceremonyActive).toBe(false);
    expect(s.ceremonySnapshot).toBeNull();
    expect(s.ceremonyPuzzle).toBeNull();
    expect(s.ceremonyIsResolve).toBe(false);
    expect(s.ceremonyBakeMetadata).toBeNull();
  });

  it('startCeremony sets all ceremony fields', () => {
    const store = createTestStore();
    const puzzle = { id: 'p1', title: 'Test', description: 'A test puzzle' };
    store.getState().startCeremony('data:image/png;base64,abc', puzzle, false, fakeMeta);

    const s = store.getState();
    expect(s.ceremonyActive).toBe(true);
    expect(s.ceremonySnapshot).toBe('data:image/png;base64,abc');
    expect(s.ceremonyPuzzle).toEqual(puzzle);
    expect(s.ceremonyIsResolve).toBe(false);
    expect(s.ceremonyBakeMetadata).toEqual(fakeMeta);
  });

  it('startCeremony reflects re-solve flag', () => {
    const store = createTestStore();
    const puzzle = { id: 'p1', title: 'Test', description: 'A test puzzle' };
    store.getState().startCeremony('snap', puzzle, true, fakeMeta);
    expect(store.getState().ceremonyIsResolve).toBe(true);
  });

  it('dismissCeremony resets all fields', () => {
    const store = createTestStore();
    const puzzle = { id: 'p1', title: 'Test', description: 'A test puzzle' };
    store.getState().startCeremony('snap', puzzle, false, fakeMeta);
    store.getState().dismissCeremony();

    const s = store.getState();
    expect(s.ceremonyActive).toBe(false);
    expect(s.ceremonySnapshot).toBeNull();
    expect(s.ceremonyPuzzle).toBeNull();
    expect(s.ceremonyIsResolve).toBe(false);
    expect(s.ceremonyBakeMetadata).toBeNull();
  });
});
