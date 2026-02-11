import { describe, it, expect } from 'vitest';
import type { NodeId, NodeState, Wire } from '../../shared/types/index.ts';
import { createWire } from '../../shared/types/index.ts';
import { bakeGraph, reconstructFromMetadata } from './bake.ts';
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
  return { id, type, position: { col: 0, row: 0 }, params, inputCount, outputCount };
}

function makeWire(
  sourceId: NodeId,
  sourcePort: number,
  targetId: NodeId,
  targetPort: number,
): Wire {
  return createWire(
    `${sourceId}:${sourcePort}->${targetId}:${targetPort}`,
    { nodeId: sourceId, portIndex: sourcePort, side: 'output' },
    { nodeId: targetId, portIndex: targetPort, side: 'input' },
  );
}

/** Build a nodes Map and wires array from a description. */
function buildGraph(
  inputCount: number,
  outputCount: number,
  processingNodes: NodeState[],
  wireSpecs: { from: NodeId; fromPort: number; to: NodeId; toPort: number }[],
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
    makeWire(spec.from, spec.fromPort, spec.to, spec.toPort),
  );

  return { nodes, wires };
}

// ─── bakeGraph ─────────────────────────────────────────────────────────────

describe('bakeGraph', () => {
  it('returns err for cyclic graphs', () => {
    const nodes = new Map<NodeId, NodeState>();
    nodes.set('A', makeNode('A', 'inverter', 1, 1));
    nodes.set('B', makeNode('B', 'inverter', 1, 1));

    const wires = [
      makeWire('A', 0, 'B', 0),
      makeWire('B', 0, 'A', 0),
    ];

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Cycle');
    }
  });

  it('returns ok for valid graphs', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [makeNode('inv', 'inverter', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value.evaluate).toBe('function');
      expect(result.value.metadata).toBeDefined();
    }
  });

  it('handles direct CP-to-CP pass-through', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [],
      [
        { from: cpInputId(0), fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { evaluate } = result.value;
    // Cycle-based: output appears on first call
    const output = evaluate([50]);
    expect(output[0]).toBe(50);
  });
});

// ─── Cycle-Based Evaluation ───────────────────────────────────────────────

describe('cycle-based evaluation', () => {
  it('pass-through: CP_in → CP_out', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [],
      [{ from: cpInputId(0), fromPort: 0, to: cpOutputId(0), toPort: 0 }],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([75]);
    expect(output[0]).toBe(75);
  });

  it('single Inverter node', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [makeNode('inv', 'inverter', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([60]);
    expect(output[0]).toBe(-60);
  });

  it('two-input Offset', () => {
    const { nodes, wires } = buildGraph(
      2, 1,
      [makeNode('shft1', 'offset', 2, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'shft1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'shft1', toPort: 1 },
        { from: 'shft1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([30, 40]);
    expect(output[0]).toBe(70);
  });

  it('Memory node: outputs 0 on first cycle, then echoes previous input', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [makeNode('mem', 'memory', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'mem', toPort: 0 },
        { from: 'mem', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { evaluate } = result.value;

    // Cycle 0: Memory outputs previousValue (0)
    expect(evaluate([80])[0]).toBe(0);
    // Cycle 1: Memory outputs previous input (80)
    expect(evaluate([50])[0]).toBe(80);
    // Cycle 2: Memory outputs previous input (50)
    expect(evaluate([30])[0]).toBe(50);
  });

  it('Amp node: 50 * (1 + 40/100) = 70', () => {
    const { nodes, wires } = buildGraph(
      2, 1,
      [makeNode('amp1', 'amp', 2, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'amp1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'amp1', toPort: 1 },
        { from: 'amp1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([50, 40]);
    expect(output[0]).toBe(70);
  });

  it('Polarizer node saturates positive input to +100', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [makeNode('pol', 'polarizer', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'pol', toPort: 0 },
        { from: 'pol', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([50]);
    expect(output[0]).toBe(100);
  });

  it('multi-input multi-output graph', () => {
    const { nodes, wires } = buildGraph(
      2, 2,
      [
        makeNode('inv1', 'inverter', 1, 1),
        makeNode('inv2', 'inverter', 1, 1),
      ],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'inv2', toPort: 0 },
        { from: 'inv1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
        { from: 'inv2', fromPort: 0, to: cpOutputId(1), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([30, 70]);
    expect(output[0]).toBe(-30);
    expect(output[1]).toBe(-70);
  });

  it('all node types in one graph', () => {
    // CP0 → Inverter → Offset(port0)
    // CP1 → Amp(port0), CP2 → Amp(port1) → Offset(port1)
    // Offset → Polarizer → Out0
    const { nodes, wires } = buildGraph(
      3, 1,
      [
        makeNode('inv', 'inverter', 1, 1),
        makeNode('amp1', 'amp', 2, 1),
        makeNode('shft', 'offset', 2, 1),
        makeNode('pol', 'polarizer', 1, 1),
      ],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'amp1', toPort: 0 },
        { from: cpInputId(2), fromPort: 0, to: 'amp1', toPort: 1 },
        { from: 'inv', fromPort: 0, to: 'shft', toPort: 0 },
        { from: 'amp1', fromPort: 0, to: 'shft', toPort: 1 },
        { from: 'shft', fromPort: 0, to: 'pol', toPort: 0 },
        { from: 'pol', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // inputs: CP0=40, CP1=20, CP2=50
    const output = result.value.evaluate([40, 20, 50]);

    // Inverter(40) = -40
    // Amp(20, 50) = 20 * (1 + 50/100) = 20 * 1.5 = 30
    // Offset(-40, 30) = -10
    // Polarizer(-10) = -100 (negative input → -100)
    expect(output[0]).toBe(-100);
  });
});

// ─── Metadata Serialization Roundtrip ──────────────────────────────────────

describe('metadata serialization roundtrip', () => {
  it('JSON roundtrip produces identical outputs', () => {
    const { nodes, wires } = buildGraph(
      2, 1,
      [
        makeNode('inv', 'inverter', 1, 1),
        makeNode('shft1', 'offset', 2, 1),
      ],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: 'shft1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'shft1', toPort: 1 },
        { from: 'shft1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = JSON.stringify(result.value.metadata);
    const deserialized = JSON.parse(serialized);
    const reconstructed = reconstructFromMetadata(deserialized);

    const inputs = [40, 20];
    // -40 + 20 = -20
    const original = result.value.evaluate(inputs);
    const roundtripped = reconstructed.evaluate(inputs);

    expect(roundtripped).toEqual(original);
    expect(original[0]).toBe(-20);
  });

  it('roundtrip with memory node preserves behavior', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [makeNode('mem', 'memory', 1, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'mem', toPort: 0 },
        { from: 'mem', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = JSON.stringify(result.value.metadata);
    const deserialized = JSON.parse(serialized);
    const reconstructed = reconstructFromMetadata(deserialized);

    const sequence = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const originalOutputs: number[][] = [];
    const reconstructedOutputs: number[][] = [];

    for (const val of sequence) {
      originalOutputs.push(result.value.evaluate([val]));
      reconstructedOutputs.push(reconstructed.evaluate([val]));
    }

    expect(reconstructedOutputs).toEqual(originalOutputs);
  });
});

// ─── Edge Cases ────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('unconnected input ports default to 0', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [makeNode('shft1', 'offset', 2, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'shft1', toPort: 0 },
        { from: 'shft1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([50]);
    expect(output[0]).toBe(50);
  });

  it('disconnected processing node does not affect output', () => {
    const { nodes, wires } = buildGraph(
      1, 1,
      [
        makeNode('inv', 'inverter', 1, 1),
        makeNode('orphan', 'amp', 2, 1),
      ],
      [
        { from: cpInputId(0), fromPort: 0, to: 'inv', toPort: 0 },
        { from: 'inv', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([42]);
    expect(output[0]).toBe(-42);
  });

  it('empty graph with no nodes produces empty output', () => {
    const nodes = new Map<NodeId, NodeState>();
    const wires: Wire[] = [];

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([]);
    expect(output).toEqual([]);
  });

  it('Diverter node produces two split outputs', () => {
    const { nodes, wires } = buildGraph(
      1, 2,
      [makeNode('fdr', 'diverter', 2, 2)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'fdr', toPort: 0 },
        { from: 'fdr', fromPort: 0, to: cpOutputId(0), toPort: 0 },
        { from: 'fdr', fromPort: 1, to: cpOutputId(1), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([80]);
    // Diverter at X=0: Y = 80 * 50/100 = 40, Z = 80 * 50/100 = 40
    expect(output[0]).toBe(40);
    expect(output[1]).toBe(40);
  });

  it('clamping: Offset with values exceeding range', () => {
    const { nodes, wires } = buildGraph(
      2, 1,
      [makeNode('shft1', 'offset', 2, 1)],
      [
        { from: cpInputId(0), fromPort: 0, to: 'shft1', toPort: 0 },
        { from: cpInputId(1), fromPort: 0, to: 'shft1', toPort: 1 },
        { from: 'shft1', fromPort: 0, to: cpOutputId(0), toPort: 0 },
      ],
    );

    const result = bakeGraph(nodes, wires);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const output = result.value.evaluate([80, 80]);
    // Offset: 80 + 80 = 160, clamped to 100
    expect(output[0]).toBe(100);
  });
});
