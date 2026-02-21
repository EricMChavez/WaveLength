import { describe, it, expect } from 'vitest';
import { captureParentSignals } from './capture-parent-signals.ts';
import type { GameboardState, ChipState, Path } from '../shared/types/index.ts';
import { createPath } from '../shared/types/index.ts';
import type { CycleResults } from '../engine/evaluation/index.ts';

function makeChip(id: string, type: string, overrides: Partial<ChipState> = {}): ChipState {
  return {
    id,
    type,
    position: { col: 15, row: 10 },
    params: {},
    socketCount: 0,
    plugCount: 0,
    ...overrides,
  };
}

function makeCycleResults(pathValues: Map<string, number[]>): CycleResults {
  return {
    outputValues: [],
    pathValues,
    chipOutputs: new Map(),
    crossCycleState: new Map(),
    liveChipIds: new Set(),
  };
}

describe('captureParentSignals', () => {
  it('returns null when chip is not on the board', () => {
    const board: GameboardState = { id: 'b', chips: new Map(), paths: [] };
    const result = captureParentSignals(
      board,
      makeCycleResults(new Map()),
      new Map(),
      'missing-chip',
      ['input', 'input', 'off', 'output', 'off', 'off'],
    );
    expect(result).toBeNull();
  });

  it('returns null when chip has no external connections', () => {
    const chip = makeChip('util-1', 'utility:test', { socketCount: 2, plugCount: 1 });
    const board: GameboardState = {
      id: 'b',
      chips: new Map([['util-1', chip]]),
      paths: [],
    };
    const result = captureParentSignals(
      board,
      makeCycleResults(new Map()),
      new Map(),
      'util-1',
      ['input', 'input', 'off', 'output', 'off', 'off'],
    );
    expect(result).toBeNull();
  });

  it('captures socket port signals from parent paths', () => {
    // Utility chip with cpLayout: [input, input, off, output, off, off]
    // socketCount=2 (inputs), plugCount=1 (output)
    const chip = makeChip('util-1', 'utility:test', { socketCount: 2, plugCount: 1 });

    // Path targeting socket port 0 → slot 0 (first input)
    const path0 = createPath('p0', { chipId: 'src-chip', portIndex: 0, side: 'plug' }, { chipId: 'util-1', portIndex: 0, side: 'socket' });
    // Path targeting socket port 1 → slot 1 (second input)
    const path1 = createPath('p1', { chipId: 'src-chip', portIndex: 1, side: 'plug' }, { chipId: 'util-1', portIndex: 1, side: 'socket' });

    const board: GameboardState = {
      id: 'b',
      chips: new Map([['util-1', chip], ['src-chip', makeChip('src-chip', 'offset', { plugCount: 2 })]]),
      paths: [path0, path1],
    };

    const samples0 = Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.1) * 50);
    const samples1 = Array.from({ length: 256 }, (_, i) => i * 0.5 - 64);
    const pathValues = new Map([['p0', samples0], ['p1', samples1]]);

    const result = captureParentSignals(
      board,
      makeCycleResults(pathValues),
      new Map(),
      'util-1',
      ['input', 'input', 'off', 'output', 'off', 'off'],
    );

    expect(result).not.toBeNull();
    // Slot 0 = first input → samples from path p0
    expect(result!.slotSignals[0]).toBe(samples0);
    // Slot 1 = second input → samples from path p1
    expect(result!.slotSignals[1]).toBe(samples1);
    // Other slots should be null
    expect(result!.slotSignals[2]).toBeNull();
    expect(result!.slotSignals[3]).toBeNull();
    expect(result!.slotSignals[4]).toBeNull();
    expect(result!.slotSignals[5]).toBeNull();
    // Connected slots should include 0 and 1
    expect(result!.connectedSlots.has(0)).toBe(true);
    expect(result!.connectedSlots.has(1)).toBe(true);
  });

  it('captures plug port connections for toggle-locking', () => {
    // cpLayout: [input, off, off, output, output, off]
    const chip = makeChip('util-1', 'utility:test', { socketCount: 1, plugCount: 2 });

    // Path from plug port 0 → slot 3 (first output)
    const pathOut = createPath('pout', { chipId: 'util-1', portIndex: 0, side: 'plug' }, { chipId: 'dst-chip', portIndex: 0, side: 'socket' });

    const board: GameboardState = {
      id: 'b',
      chips: new Map([['util-1', chip], ['dst-chip', makeChip('dst-chip', 'offset', { socketCount: 1 })]]),
      paths: [pathOut],
    };

    const result = captureParentSignals(
      board,
      makeCycleResults(new Map()),
      new Map(),
      'util-1',
      ['input', 'off', 'off', 'output', 'output', 'off'],
    );

    expect(result).not.toBeNull();
    // No signal captured for output ports, but slot 3 should be in connectedSlots
    expect(result!.slotSignals[3]).toBeNull();
    expect(result!.connectedSlots.has(3)).toBe(true);
    // Slot 4 (second output, unconnected) should NOT be in connectedSlots
    expect(result!.connectedSlots.has(4)).toBe(false);
  });

  it('captures port constants for unconnected knob sockets', () => {
    // cpLayout: [input, input, off, output, off, off]
    // Socket 0 is wired, socket 1 is unwired but has a port constant (knob value)
    const chip = makeChip('util-1', 'utility:test', { socketCount: 2, plugCount: 1 });

    const path0 = createPath('p0', { chipId: 'src', portIndex: 0, side: 'plug' }, { chipId: 'util-1', portIndex: 0, side: 'socket' });

    const board: GameboardState = {
      id: 'b',
      chips: new Map([['util-1', chip], ['src', makeChip('src', 'offset', { plugCount: 1 })]]),
      paths: [path0],
    };

    const samples0 = Array.from({ length: 256 }, () => 42);
    const portConstants = new Map([['util-1:1', 75]]); // knob set to 75

    const result = captureParentSignals(
      board,
      makeCycleResults(new Map([['p0', samples0]])),
      portConstants,
      'util-1',
      ['input', 'input', 'off', 'output', 'off', 'off'],
    );

    expect(result).not.toBeNull();
    // Slot 0: wired → gets path samples
    expect(result!.slotSignals[0]).toBe(samples0);
    expect(result!.connectedSlots.has(0)).toBe(true);
    // Slot 1: unwired but has constant → flat array of 75
    expect(result!.slotSignals[1]).toEqual(new Array(256).fill(75));
    // Unwired slots with constants are NOT in connectedSlots (can still toggle)
    expect(result!.connectedSlots.has(1)).toBe(false);
  });

  it('maps port indices correctly with non-contiguous cpLayout', () => {
    // cpLayout: [off, input, off, off, output, off]
    // Socket 0 maps to slot 1, plug 0 maps to slot 4
    const chip = makeChip('util-1', 'utility:test', { socketCount: 1, plugCount: 1 });

    const pathIn = createPath('pin', { chipId: 'src', portIndex: 0, side: 'plug' }, { chipId: 'util-1', portIndex: 0, side: 'socket' });
    const pathOut = createPath('pout', { chipId: 'util-1', portIndex: 0, side: 'plug' }, { chipId: 'dst', portIndex: 0, side: 'socket' });

    const board: GameboardState = {
      id: 'b',
      chips: new Map([
        ['util-1', chip],
        ['src', makeChip('src', 'offset', { plugCount: 1 })],
        ['dst', makeChip('dst', 'offset', { socketCount: 1 })],
      ]),
      paths: [pathIn, pathOut],
    };

    const inSamples = Array.from({ length: 256 }, () => 33);

    const result = captureParentSignals(
      board,
      makeCycleResults(new Map([['pin', inSamples]])),
      new Map(),
      'util-1',
      ['off', 'input', 'off', 'off', 'output', 'off'],
    );

    expect(result).not.toBeNull();
    // Socket port 0 → slot 1 (second left slot, the only active input)
    expect(result!.slotSignals[1]).toBe(inSamples);
    expect(result!.connectedSlots.has(1)).toBe(true);
    // Plug port 0 → slot 4 (second right slot, the only active output)
    expect(result!.connectedSlots.has(4)).toBe(true);
    // All other slots are null/disconnected
    expect(result!.slotSignals[0]).toBeNull();
    expect(result!.slotSignals[2]).toBeNull();
    expect(result!.slotSignals[3]).toBeNull();
    expect(result!.slotSignals[4]).toBeNull();
    expect(result!.slotSignals[5]).toBeNull();
  });

  it('ignores zero port constants (default behavior)', () => {
    const chip = makeChip('util-1', 'utility:test', { socketCount: 1, plugCount: 0 });

    const board: GameboardState = {
      id: 'b',
      chips: new Map([['util-1', chip]]),
      paths: [],
    };

    // Port constant of 0 should be treated as no signal (default)
    const portConstants = new Map([['util-1:0', 0]]);

    const result = captureParentSignals(
      board,
      makeCycleResults(new Map()),
      portConstants,
      'util-1',
      ['input', 'off', 'off', 'off', 'off', 'off'],
    );

    // No real signals → should return null
    expect(result).toBeNull();
  });
});
