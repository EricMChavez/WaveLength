import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createGameboardSlice } from './gameboard-slice.ts';
import { createInteractionSlice } from './interaction-slice.ts';
import { createSimulationSlice } from './simulation-slice.ts';
import { createPuzzleSlice } from './puzzle-slice.ts';
import { createPaletteSlice } from './palette-slice.ts';
import { createCeremonySlice } from './ceremony-slice.ts';
import { createNavigationSlice } from './navigation-slice.ts';
import type { GameStore } from '../index.ts';
import type { PuzzleNodeEntry } from './palette-slice.ts';
import type { BakeMetadata } from '../../engine/baking/index.ts';

function createTestStore() {
  return create<GameStore>()((...a) => ({
    ...createGameboardSlice(...a),
    ...createInteractionSlice(...a),
    ...createSimulationSlice(...a),
    ...createPuzzleSlice(...a),
    ...createPaletteSlice(...a),
    ...createCeremonySlice(...a),
    ...createNavigationSlice(...a),
  }));
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
  versionHash: 'caller-hash',
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
    const stored = nodes.get('pass-through')!;
    expect(stored.title).toBe('Pass-Through');
    expect(stored.puzzleId).toBe('pass-through');
  });

  it('addPuzzleNode does not clobber existing entries', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    const second: PuzzleNodeEntry = { ...fakeEntry, puzzleId: 'invert', title: 'Invert' };
    store.getState().addPuzzleNode(second);
    expect(store.getState().puzzleNodes.size).toBe(2);
    expect(store.getState().puzzleNodes.get('pass-through')!.title).toBe('Pass-Through');
    expect(store.getState().puzzleNodes.get('invert')!.title).toBe('Invert');
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

  it('addPuzzleNode generates a fresh versionHash', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    const stored = store.getState().puzzleNodes.get('pass-through')!;
    // Should be a valid UUID, not the caller's value
    expect(stored.versionHash).toBeDefined();
    expect(stored.versionHash).not.toBe('caller-hash');
  });

  it('updatePuzzleNode regenerates versionHash', () => {
    const store = createTestStore();
    store.getState().addPuzzleNode(fakeEntry);
    const hashAfterAdd = store.getState().puzzleNodes.get('pass-through')!.versionHash;

    store.getState().updatePuzzleNode('pass-through', { ...fakeMeta, topoOrder: ['n2'] });
    const hashAfterUpdate = store.getState().puzzleNodes.get('pass-through')!.versionHash;

    expect(hashAfterUpdate).not.toBe(hashAfterAdd);
  });
});
