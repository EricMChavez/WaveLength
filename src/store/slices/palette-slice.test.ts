import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createPaletteSlice } from './palette-slice.ts';
import type { PaletteSlice, PuzzleNodeEntry } from './palette-slice.ts';
import type { BakeMetadata } from '../../engine/baking/index.ts';

function createTestStore() {
  return create<PaletteSlice>()((...a) => createPaletteSlice(...a));
}

const fakeMeta: BakeMetadata = {
  topoOrder: ['n1'],
  nodeConfigs: [{ id: 'n1', type: 'invert', params: {}, inputCount: 1, outputCount: 1 }],
  edges: [],
  inputDelays: [0],
  inputCount: 1,
  outputCount: 1,
};

const fakeEntry: PuzzleNodeEntry = {
  puzzleId: 'pass-through',
  title: 'Pass-Through',
  description: 'Wire input to output',
  inputCount: 1,
  outputCount: 1,
  bakeMetadata: fakeMeta,
};

describe('palette-slice', () => {
  it('starts with an empty puzzleNodes map', () => {
    const store = createTestStore();
    expect(store.getState().puzzleNodes.size).toBe(0);
  });

  it('addPuzzleNode inserts an entry', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    const nodes = store.getState().puzzleNodes;
    expect(nodes.size).toBe(1);
    expect(nodes.get('pass-through')).toEqual(fakeEntry);
  });

  it('addPuzzleNode does not clobber existing entries', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    const second: PuzzleNodeEntry = { ...fakeEntry, puzzleId: 'invert', title: 'Invert' };
    store.getState().addPuzzleNode(second);
    expect(store.getState().puzzleNodes.size).toBe(2);
    expect(store.getState().puzzleNodes.get('pass-through')).toEqual(fakeEntry);
    expect(store.getState().puzzleNodes.get('invert')).toEqual(second);
  });

  it('updatePuzzleNode updates bakeMetadata for existing entry', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    const newMeta: BakeMetadata = { ...fakeMeta, topoOrder: ['n2'] };
    store.getState().updatePuzzleNode('pass-through', newMeta);
    const updated = store.getState().puzzleNodes.get('pass-through')!;
    expect(updated.bakeMetadata.topoOrder).toEqual(['n2']);
    expect(updated.title).toBe('Pass-Through');
  });

  it('updatePuzzleNode is a no-op for unknown puzzleId', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    store.getState().updatePuzzleNode('nonexistent', fakeMeta);
    expect(store.getState().puzzleNodes.size).toBe(1);
  });
});
