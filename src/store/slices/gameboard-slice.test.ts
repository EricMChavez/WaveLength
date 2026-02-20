import { describe, it, expect } from 'vitest';
import type { ChipState, GameboardState, Path } from '../../shared/types/index.ts';
import { createPath } from '../../shared/types/index.ts';
import { createGameboardSlice, reconstructKnobConstants } from './gameboard-slice.ts';

function makeNode(id: string, type: string, col: number, row: number, overrides: Partial<ChipState> = {}): ChipState {
  return { id, type, position: { col, row }, params: {}, socketCount: 1, plugCount: 1, ...overrides };
}

describe('gameboard-slice removeNode', () => {
  it('rejects removal of locked node', () => {
    const lockedNode = makeNode('n1', 'invert', 15, 10, { locked: true });
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['n1', lockedNode]]),
      paths: [],
    };

    // Create a minimal store for testing the slice
    let state: any = {
      activeBoard: board,
      graphVersion: 0,
      occupancy: Array.from({ length: 66 }, () => new Array(36).fill(false)),
    };
    const get = () => state;
    const set = (fn: any) => {
      const result = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...result };
    };
    const slice = createGameboardSlice(set as any, get as any, {} as any);

    slice.removeChip('n1');
    // Node should still be present
    expect(state.activeBoard.chips.has('n1')).toBe(true);
    expect(state.graphVersion).toBe(0);
  });

  it('allows removal of non-locked node', () => {
    const normalNode = makeNode('n2', 'invert', 15, 10);
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['n2', normalNode]]),
      paths: [],
    };

    let state: any = {
      activeBoard: board,
      graphVersion: 0,
      occupancy: Array.from({ length: 66 }, () => new Array(36).fill(false)),
    };
    const get = () => state;
    const set = (fn: any) => {
      const result = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...result };
    };
    const slice = createGameboardSlice(set as any, get as any, {} as any);

    slice.removeChip('n2');
    // Node should be removed
    expect(state.activeBoard.chips.has('n2')).toBe(false);
    expect(state.graphVersion).toBe(1);
  });
});

describe('reconstructKnobConstants', () => {
  it('reconstructs knob portConstants from node params', () => {
    // amp node has knob on input port index 1, paramKey 'gain'
    const ampChip = makeNode('a1', 'amp', 20, 10, {
      params: { gain: 75 },
      socketCount: 2,
    });
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['a1', ampChip]]),
      paths: [],
    };

    const result = reconstructKnobConstants(board);
    expect(result.get('a1:1')).toBe(75);
  });

  it('returns empty map for nodes without knobs', () => {
    const maxChip = makeNode('m1', 'max', 20, 10, { socketCount: 2 });
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['m1', maxChip]]),
      paths: [],
    };

    const result = reconstructKnobConstants(board);
    expect(result.size).toBe(0);
  });

  it('handles multiple knob nodes', () => {
    const amp1 = makeNode('a1', 'amp', 20, 10, { params: { gain: 50 }, socketCount: 2 });
    const amp2 = makeNode('a2', 'amp', 30, 10, { params: { gain: -25 }, socketCount: 2 });
    const max1 = makeNode('m1', 'max', 40, 10, { socketCount: 2 });
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['a1', amp1], ['a2', amp2], ['m1', max1]]),
      paths: [],
    };

    const result = reconstructKnobConstants(board);
    expect(result.size).toBe(2);
    expect(result.get('a1:1')).toBe(50);
    expect(result.get('a2:1')).toBe(-25);
  });
});

describe('gameboard-slice setActiveBoard', () => {
  it('populates portConstants from knob node params', () => {
    const ampChip = makeNode('a1', 'amp', 20, 10, {
      params: { gain: 100 },
      socketCount: 2,
    });
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['a1', ampChip]]),
      paths: [],
    };

    let state: any = {
      activeBoard: null,
      activeBoardId: null,
      portConstants: new Map(),
      graphVersion: 0,
      routingVersion: 0,
      occupancy: Array.from({ length: 66 }, () => new Array(36).fill(false)),
    };
    const get = () => state;
    const set = (fn: any) => {
      const result = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...result };
    };
    const slice = createGameboardSlice(set as any, get as any, {} as any);

    slice.setActiveBoard(board);
    expect(state.portConstants.get('a1:1')).toBe(100);
  });
});

describe('gameboard-slice reconnectPath', () => {
  function makeSlice() {
    const n1 = makeNode('n1', 'max', 15, 10, { socketCount: 2 });
    const n2 = makeNode('n2', 'max', 25, 10, { socketCount: 2 });
    const n3 = makeNode('n3', 'max', 35, 10, { socketCount: 2 });
    const oldPath: Path = createPath('p1',
      { chipId: 'n1', portIndex: 0, side: 'plug' },
      { chipId: 'n2', portIndex: 0, side: 'socket' },
    );
    const board: GameboardState = {
      id: 'test-board',
      chips: new Map([['n1', n1], ['n2', n2], ['n3', n3]]),
      paths: [oldPath],
    };
    let state: any = {
      activeBoard: board,
      graphVersion: 5,
      routingVersion: 3,
    };
    const get = () => state;
    const set = (fn: any) => {
      const result = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...result };
    };
    const slice = createGameboardSlice(set as any, get as any, {} as any);
    return { slice, getState: () => state };
  }

  it('atomically replaces old path with new path', () => {
    const { slice, getState } = makeSlice();
    const newPath: Path = createPath('p2',
      { chipId: 'n1', portIndex: 0, side: 'plug' },
      { chipId: 'n3', portIndex: 0, side: 'socket' },
    );
    slice.reconnectPath('p1', newPath);
    const s = getState();
    expect(s.activeBoard.paths).toHaveLength(1);
    expect(s.activeBoard.paths[0].id).toBe('p2');
    expect(s.activeBoard.paths[0].target.chipId).toBe('n3');
  });

  it('bumps graphVersion and routingVersion exactly once', () => {
    const { slice, getState } = makeSlice();
    const newPath: Path = createPath('p2',
      { chipId: 'n1', portIndex: 0, side: 'plug' },
      { chipId: 'n3', portIndex: 0, side: 'socket' },
    );
    slice.reconnectPath('p1', newPath);
    const s = getState();
    expect(s.graphVersion).toBe(6);
    expect(s.routingVersion).toBe(4);
  });

  it('is a no-op when activeBoard is null', () => {
    let state: any = { activeBoard: null, graphVersion: 0, routingVersion: 0 };
    const set = (fn: any) => {
      const result = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...result };
    };
    const slice = createGameboardSlice(set as any, () => state, {} as any);
    const newPath: Path = createPath('p2',
      { chipId: 'n1', portIndex: 0, side: 'plug' },
      { chipId: 'n3', portIndex: 0, side: 'socket' },
    );
    slice.reconnectPath('nonexistent', newPath);
    expect(state.activeBoard).toBeNull();
    expect(state.graphVersion).toBe(0);
  });

  it('adds new path even when old pathId does not exist', () => {
    const { slice, getState } = makeSlice();
    const newPath: Path = createPath('p2',
      { chipId: 'n1', portIndex: 0, side: 'plug' },
      { chipId: 'n3', portIndex: 0, side: 'socket' },
    );
    slice.reconnectPath('nonexistent', newPath);
    const s = getState();
    // Old path (p1) still there + new path (p2) added
    expect(s.activeBoard.paths).toHaveLength(2);
    expect(s.activeBoard.paths.map((p: Path) => p.id).sort()).toEqual(['p1', 'p2']);
  });
});

