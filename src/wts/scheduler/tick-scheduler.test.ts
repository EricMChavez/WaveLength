import { describe, it, expect } from 'vitest';
import { advanceTick, createSchedulerState } from './tick-scheduler.ts';
import type { NodeState, Wire, NodeId } from '../../shared/types/index.ts';

function makeNode(
  id: string,
  type: string,
  params: Record<string, number | string> = {},
  inputCount = 2,
  outputCount = 1,
): NodeState {
  return { id, type, position: { x: 0, y: 0 }, params, inputCount, outputCount };
}

function makeWire(
  id: string,
  from: NodeId,
  fromPort: number,
  to: NodeId,
  toPort: number,
  wtsDelay = 16,
): Wire {
  return {
    id,
    from: { nodeId: from, portIndex: fromPort, side: 'output' },
    to: { nodeId: to, portIndex: toPort, side: 'input' },
    wtsDelay,
    signals: [],
  };
}

/** Inject a signal onto a wire (simulating an upstream emission). */
function injectSignal(wire: Wire, value: number, ticksRemaining?: number): void {
  wire.signals.push({ value, ticksRemaining: ticksRemaining ?? wire.wtsDelay });
}

describe('createSchedulerState', () => {
  it('initializes inputs and outputs to 0', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'multiply'));
    const state = createSchedulerState(nodes);
    const runtime = state.nodeStates.get('A')!;
    expect(runtime.inputs).toEqual([0, 0]);
    expect(runtime.outputs).toEqual([0]);
  });

  it('creates delay state for delay nodes', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('D', makeNode('D', 'delay', { subdivisions: 4 }, 1, 1));
    const state = createSchedulerState(nodes);
    const runtime = state.nodeStates.get('D')!;
    expect(runtime.delayState).toBeDefined();
    expect(runtime.delayState!.buffer).toHaveLength(5);
  });
});

describe('advanceTick — signal transport', () => {
  it('decrements ticksRemaining on in-flight signals each tick', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'A', 0, 16)];
    injectSignal(wires[0], 50, 10);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['A'], state);

    expect(wires[0].signals).toHaveLength(1);
    expect(wires[0].signals[0].ticksRemaining).toBe(9);
  });

  it('signal arrives after exactly wtsDelay ticks', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'A', 0, 3)];
    injectSignal(wires[0], 50, 3);

    const state = createSchedulerState(nodes);

    // Tick 1: ticksRemaining 3 → 2
    advanceTick(wires, nodes, ['A'], state);
    expect(wires[0].signals).toHaveLength(1);
    expect(state.nodeStates.get('A')!.inputs[0]).toBe(0);

    // Tick 2: ticksRemaining 2 → 1
    advanceTick(wires, nodes, ['A'], state);
    expect(wires[0].signals).toHaveLength(1);

    // Tick 3: ticksRemaining 1 → 0, signal delivered
    advanceTick(wires, nodes, ['A'], state);
    expect(wires[0].signals).toHaveLength(0);
    expect(state.nodeStates.get('A')!.inputs[0]).toBe(50);
  });

  it('16 ticks = 1 WTS for default wtsDelay', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'A', 0, 16)];
    injectSignal(wires[0], 75, 16);

    const state = createSchedulerState(nodes);

    // Tick 15 times — signal still in flight
    for (let i = 0; i < 15; i++) {
      advanceTick(wires, nodes, ['A'], state);
    }
    expect(wires[0].signals).toHaveLength(1);
    expect(wires[0].signals[0].ticksRemaining).toBe(1);

    // Tick 16 — arrives
    advanceTick(wires, nodes, ['A'], state);
    expect(wires[0].signals).toHaveLength(0);
    expect(state.nodeStates.get('A')!.inputs[0]).toBe(75);
  });

  it('wire state is the canonical signal animation source (signals array)', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'A', 0, 5)];
    injectSignal(wires[0], 42, 5);
    injectSignal(wires[0], 80, 3);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['A'], state);

    // Both signals are on the wire with decremented ticksRemaining
    expect(wires[0].signals).toHaveLength(2);
    expect(wires[0].signals[0]).toEqual({ value: 42, ticksRemaining: 4 });
    expect(wires[0].signals[1]).toEqual({ value: 80, ticksRemaining: 2 });
  });
});

describe('advanceTick — node evaluation', () => {
  it('Invert node fires when signal arrives', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'A', 0, 1)];
    injectSignal(wires[0], 60, 1);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['A'], state);

    // Invert(60) = -60
    expect(state.nodeStates.get('A')!.outputs[0]).toBe(-60);
  });

  it('Multiply node fires with two inputs', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('M', makeNode('M', 'multiply'));
    const wires: Wire[] = [
      makeWire('w1', 'X', 0, 'M', 0, 1),
      makeWire('w2', 'Y', 0, 'M', 1, 1),
    ];
    injectSignal(wires[0], 50, 1);
    injectSignal(wires[1], 50, 1);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['M'], state);

    // Multiply(50, 50) = 25
    expect(state.nodeStates.get('M')!.outputs[0]).toBe(25);
  });

  it('Mix node uses configured mode', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('M', makeNode('M', 'mix', { mode: 'Subtract' }));
    const wires: Wire[] = [
      makeWire('w1', 'X', 0, 'M', 0, 1),
      makeWire('w2', 'Y', 0, 'M', 1, 1),
    ];
    injectSignal(wires[0], 80, 1);
    injectSignal(wires[1], 30, 1);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['M'], state);

    // Subtract(80, 30) = 50
    expect(state.nodeStates.get('M')!.outputs[0]).toBe(50);
  });

  it('Threshold node fires correctly', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('T', makeNode('T', 'threshold', { threshold: 0 }, 1, 1));
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'T', 0, 1)];
    injectSignal(wires[0], 10, 1);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['T'], state);

    expect(state.nodeStates.get('T')!.outputs[0]).toBe(100);
  });

  it('node emits output signal onto outgoing wire', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    nodes.set('B', makeNode('B', 'invert', {}, 1, 1));
    const wires: Wire[] = [
      makeWire('w1', 'X', 0, 'A', 0, 1),
      makeWire('w2', 'A', 0, 'B', 0, 4),
    ];
    injectSignal(wires[0], 60, 1);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['A', 'B'], state);

    // A inverts 60 → -60, emits onto w2
    expect(wires[1].signals).toHaveLength(1);
    expect(wires[1].signals[0].value).toBe(-60);
    expect(wires[1].signals[0].ticksRemaining).toBe(4);
  });
});

describe('advanceTick — multi-node chain', () => {
  it('signal propagates through A → B across ticks', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'invert', {}, 1, 1));
    nodes.set('B', makeNode('B', 'invert', {}, 1, 1));
    const wires: Wire[] = [
      makeWire('w1', 'X', 0, 'A', 0, 1),   // X → A, 1 tick
      makeWire('w2', 'A', 0, 'B', 0, 2),    // A → B, 2 ticks
    ];
    injectSignal(wires[0], 40, 1);

    const state = createSchedulerState(nodes);
    const topoOrder: NodeId[] = ['A', 'B'];

    // Tick 1: signal arrives at A, A evaluates, emits -40 onto w2
    advanceTick(wires, nodes, topoOrder, state);
    expect(state.nodeStates.get('A')!.outputs[0]).toBe(-40);
    expect(wires[1].signals).toHaveLength(1);
    expect(wires[1].signals[0].ticksRemaining).toBe(2);

    // Tick 2: signal on w2 advances (2 → 1)
    advanceTick(wires, nodes, topoOrder, state);
    expect(wires[1].signals[0].ticksRemaining).toBe(1);

    // Tick 3: signal arrives at B, B evaluates invert(-40) = 40
    advanceTick(wires, nodes, topoOrder, state);
    expect(state.nodeStates.get('B')!.inputs[0]).toBe(-40);
    expect(state.nodeStates.get('B')!.outputs[0]).toBe(40);
  });
});

describe('advanceTick — Delay node', () => {
  it('Delay node adds subdivisions to signal timing', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('D', makeNode('D', 'delay', { subdivisions: 3 }, 1, 1));
    nodes.set('Out', makeNode('Out', 'invert', {}, 1, 1));
    const wires: Wire[] = [
      makeWire('w1', 'X', 0, 'D', 0, 1),
      makeWire('w2', 'D', 0, 'Out', 0, 1),
    ];

    const state = createSchedulerState(nodes);
    const topoOrder: NodeId[] = ['D', 'Out'];

    // Inject signal that arrives at D on tick 1
    injectSignal(wires[0], 80, 1);

    // Tick 1: signal arrives at D, D stores in buffer, outputs 0 (delayed)
    advanceTick(wires, nodes, topoOrder, state);
    expect(state.nodeStates.get('D')!.inputs[0]).toBe(80);
    // Delay of 3 means output is still 0 (buffer was pre-filled with 0)
    expect(state.nodeStates.get('D')!.outputs[0]).toBe(0);

    // Feed the same input for 3 more ticks so the delay buffer cycles
    for (let i = 0; i < 2; i++) {
      // Re-inject signal arriving at D each tick
      injectSignal(wires[0], 80, 1);
      advanceTick(wires, nodes, topoOrder, state);
    }

    // On the 3rd feed (4th tick total), the delayed value should emerge
    injectSignal(wires[0], 80, 1);
    advanceTick(wires, nodes, topoOrder, state);
    expect(state.nodeStates.get('D')!.outputs[0]).toBe(80);
  });
});

describe('advanceTick — unconnected inputs default to 0', () => {
  it('node with only one input connected uses 0 for the other', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('M', makeNode('M', 'multiply'));
    // Only connect port 0, port 1 is unconnected (defaults to 0)
    const wires: Wire[] = [makeWire('w1', 'X', 0, 'M', 0, 1)];
    injectSignal(wires[0], 50, 1);

    const state = createSchedulerState(nodes);
    advanceTick(wires, nodes, ['M'], state);

    // Multiply(50, 0) = 0
    expect(state.nodeStates.get('M')!.outputs[0]).toBe(0);
  });
});
