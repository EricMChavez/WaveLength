import { describe, it, expect } from 'vitest';
import type { NodeId, NodeState, Wire } from '../../shared/types/index.ts';
import { createSchedulerState, advanceTick } from './tick-scheduler.ts';
import { bakeGraph, reconstructFromMetadata } from '../../engine/baking/index.ts';
import { topologicalSort } from '../../engine/graph/topological-sort.ts';
import {
  cpInputId,
  cpOutputId,
  createConnectionPointNode,
} from '../../puzzle/connection-point-nodes.ts';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeNode(
  id: NodeId,
  type: string,
  inputCount: number,
  outputCount: number,
  params: Record<string, number | string> = {},
): NodeState {
  return { id, type, position: { x: 0, y: 0 }, params, inputCount, outputCount };
}

function makeWire(
  from: NodeId,
  fromPort: number,
  to: NodeId,
  toPort: number,
  wtsDelay = 16,
): Wire {
  return {
    id: `${from}:${fromPort}->${to}:${toPort}`,
    from: { nodeId: from, portIndex: fromPort, side: 'output' },
    to: { nodeId: to, portIndex: toPort, side: 'input' },
    wtsDelay,
    signals: [],
  };
}

function buildGraph(
  inputCount: number,
  outputCount: number,
  processingNodes: NodeState[],
  wireSpecs: { from: NodeId; fromPort: number; to: NodeId; toPort: number; delay?: number }[],
) {
  const nodes = new Map<NodeId, NodeState>();
  for (let i = 0; i < inputCount; i++) {
    const cp = createConnectionPointNode('input', i);
    nodes.set(cp.id, cp);
  }
  for (let i = 0; i < outputCount; i++) {
    const cp = createConnectionPointNode('output', i);
    nodes.set(cp.id, cp);
  }
  for (const node of processingNodes) {
    nodes.set(node.id, node);
  }
  const wires = wireSpecs.map((spec) =>
    makeWire(spec.from, spec.fromPort, spec.to, spec.toPort, spec.delay ?? 16),
  );
  return { nodes, wires };
}

/** Bake a simple graph and return its metadata for use as a puzzle node. */
function bakePuzzleMetadata(
  inputCount: number,
  outputCount: number,
  processingNodes: NodeState[],
  wireSpecs: { from: NodeId; fromPort: number; to: NodeId; toPort: number; delay?: number }[],
) {
  const { nodes, wires } = buildGraph(inputCount, outputCount, processingNodes, wireSpecs);
  const result = bakeGraph(nodes, wires);
  if (!result.ok) throw new Error('Failed to bake graph for test');
  return result.value.metadata;
}

/**
 * Run a simulation with a puzzle node embedded in the graph.
 * Drives input CPs with given values for N ticks and returns output CP values.
 */
function runSimulationWithPuzzleNode(
  nodes: ReadonlyMap<NodeId, NodeState>,
  wires: Wire[],
  puzzleNodeClosures: Map<string, (inputs: number[]) => number[]>,
  inputValues: number[],
  ticks: number,
): number[] {
  const sortResult = topologicalSort(Array.from(nodes.keys()), wires);
  if (!sortResult.ok) throw new Error('Cycle in test graph');
  const topoOrder = sortResult.value;

  const simWires: Wire[] = wires.map((w) => ({ ...w, signals: [] }));
  const state = createSchedulerState(nodes);

  // Attach baked closures to puzzle node runtime states
  for (const [nodeId, node] of nodes) {
    if (node.type.startsWith('puzzle:')) {
      const runtime = state.nodeStates.get(nodeId);
      const closure = puzzleNodeClosures.get(nodeId);
      if (runtime && closure) {
        runtime.bakedEvaluate = closure;
      }
    }
  }

  const inputCpIds: string[] = [];
  for (let i = 0; i < inputValues.length; i++) {
    inputCpIds.push(cpInputId(i));
  }

  for (let t = 0; t < ticks; t++) {
    for (let i = 0; i < inputValues.length; i++) {
      const cpId = inputCpIds[i];
      const runtime = state.nodeStates.get(cpId);
      if (runtime) {
        runtime.outputs[0] = inputValues[i];
        for (const wire of simWires) {
          if (wire.from.nodeId === cpId) {
            wire.signals.push({ value: inputValues[i], ticksRemaining: wire.wtsDelay });
          }
        }
      }
    }
    advanceTick(simWires, nodes, topoOrder, state);
  }

  const outputValues: number[] = [];
  let i = 0;
  while (true) {
    const cpId = cpOutputId(i);
    const runtime = state.nodeStates.get(cpId);
    if (!runtime) break;
    outputValues.push(runtime.inputs[0] ?? 0);
    i++;
  }
  return outputValues;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('puzzle node evaluation in simulation', () => {
  it('puzzle node with baked Invert graph negates input', () => {
    // Bake an Invert puzzle: CP_in → Invert → CP_out
    const metadata = bakePuzzleMetadata(
      1, 1,
      [makeNode('inv', 'invert', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    // Build a gameboard graph: CP_in → PuzzleNode → CP_out
    const puzzleNode = makeNode('pz1', 'puzzle:test-invert', 1, 1);
    const { nodes, wires } = buildGraph(
      1, 1,
      [puzzleNode],
      [
        { from: cpInputId(0), fromPort: 0, to: 'pz1', toPort: 0 },
        { from: 'pz1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const { evaluate } = reconstructFromMetadata(metadata);
    const closures = new Map<string, (inputs: number[]) => number[]>();
    closures.set('pz1', evaluate);

    const output = runSimulationWithPuzzleNode(nodes, wires, closures, [60], 100);
    expect(output[0]).toBe(-60);
  });

  it('puzzle node with baked Mix Add graph sums two inputs', () => {
    // Bake a Mix(Add) puzzle: 2 CP_ins → Mix → CP_out
    const metadata = bakePuzzleMetadata(
      2, 1,
      [makeNode('mix1', 'mix', 2, 1, { mode: 'Add' })],
      [
        { from: cpInputId(0), fromPort: 0, to: 'mix1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'mix1', toPort: 1 },
        { from: 'mix1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    // Build gameboard: CP_in0, CP_in1 → PuzzleNode(2 in, 1 out) → CP_out
    const puzzleNode = makeNode('pz1', 'puzzle:test-mix', 2, 1);
    const { nodes, wires } = buildGraph(
      2, 1,
      [puzzleNode],
      [
        { from: cpInputId(0), fromPort: 0, to: 'pz1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'pz1', toPort: 1 },
        { from: 'pz1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const { evaluate } = reconstructFromMetadata(metadata);
    const closures = new Map<string, (inputs: number[]) => number[]>();
    closures.set('pz1', evaluate);

    const output = runSimulationWithPuzzleNode(nodes, wires, closures, [30, 40], 100);
    expect(output[0]).toBe(70);
  });

  it('puzzle node chained with fundamental node', () => {
    // Bake an Invert puzzle
    const metadata = bakePuzzleMetadata(
      1, 1,
      [makeNode('inv', 'invert', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    // Gameboard: CP_in → PuzzleInvert → FundamentalInvert → CP_out
    // Double invert should produce the original value
    const puzzleNode = makeNode('pz1', 'puzzle:test-invert', 1, 1);
    const invertNode = makeNode('inv2', 'invert', 1, 1);
    const { nodes, wires } = buildGraph(
      1, 1,
      [puzzleNode, invertNode],
      [
        { from: cpInputId(0), fromPort: 0, to: 'pz1', toPort: 0 },
        { from: 'pz1', fromPort: 0, to: 'inv2', toPort: 0 },
        { from: 'inv2', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const { evaluate } = reconstructFromMetadata(metadata);
    const closures = new Map<string, (inputs: number[]) => number[]>();
    closures.set('pz1', evaluate);

    const output = runSimulationWithPuzzleNode(nodes, wires, closures, [50], 100);
    // Invert(Invert(50)) = 50
    expect(output[0]).toBe(50);
  });

  it('puzzle node without bakedEvaluate produces zeros', () => {
    // Puzzle node with no closure attached — outputs should stay 0
    const puzzleNode = makeNode('pz1', 'puzzle:missing', 1, 1);
    const { nodes, wires } = buildGraph(
      1, 1,
      [puzzleNode],
      [
        { from: cpInputId(0), fromPort: 0, to: 'pz1', toPort: 0 },
        { from: 'pz1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    // No closures attached
    const closures = new Map<string, (inputs: number[]) => number[]>();
    const output = runSimulationWithPuzzleNode(nodes, wires, closures, [50], 100);
    expect(output[0]).toBe(0);
  });

  it('multiple puzzle nodes in same graph', () => {
    // Bake Invert and Threshold puzzles
    const invertMeta = bakePuzzleMetadata(
      1, 1,
      [makeNode('inv', 'invert', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const thresholdMeta = bakePuzzleMetadata(
      1, 1,
      [makeNode('thr', 'threshold', 1, 1, { threshold: 25 })],
      [
        { from: cpInputId(0), fromPort: 0, to: 'thr', toPort: 0 },
        { from: 'thr', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    // Gameboard: CP_in → PuzzleInvert → PuzzleThreshold → CP_out
    // Invert(50) = -50, Threshold(-50, 25) = -100 (since -50 < 25)
    const pzInvert = makeNode('pzInv', 'puzzle:test-invert', 1, 1);
    const pzThreshold = makeNode('pzThr', 'puzzle:test-threshold', 1, 1);
    const { nodes, wires } = buildGraph(
      1, 1,
      [pzInvert, pzThreshold],
      [
        { from: cpInputId(0), fromPort: 0, to: 'pzInv', toPort: 0 },
        { from: 'pzInv', fromPort: 0, to: 'pzThr', toPort: 0 },
        { from: 'pzThr', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const closures = new Map<string, (inputs: number[]) => number[]>();
    closures.set('pzInv', reconstructFromMetadata(invertMeta).evaluate);
    closures.set('pzThr', reconstructFromMetadata(thresholdMeta).evaluate);

    const output = runSimulationWithPuzzleNode(nodes, wires, closures, [50], 100);
    // Invert(50) = -50, Threshold(-50, 25) → -50 <= 25 → -100
    expect(output[0]).toBe(-100);
  });
});
