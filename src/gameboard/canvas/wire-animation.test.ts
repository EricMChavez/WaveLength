import { describe, it, expect } from 'vitest';
import { computeWireAnimationCache, computeBlipPortKeys } from './wire-animation';
import type { CycleResults } from '../../engine/evaluation/index';
import type { Path } from '../../shared/types/index';

function makeWire(
  id: string,
  sourceNodeId: string,
  sourcePort: number,
  targetNodeId: string,
  targetPort: number,
): Path {
  return {
    id,
    source: { chipId: sourceNodeId, portIndex: sourcePort, side: 'plug' },
    target: { chipId: targetNodeId, portIndex: targetPort, side: 'socket' },
    route: [],
  };
}

function makeCycleResults(
  processingOrder: string[],
  wireValues?: Map<string, number[]>,
  nodeDepths?: Map<string, number>,
  maxDepth?: number,
): CycleResults {
  return {
    outputValues: [],
    pathValues: wireValues ?? new Map(),
    chipOutputs: new Map(),
    crossCycleState: new Map(),
    processingOrder,
    chipDepths: nodeDepths ?? new Map(),
    maxDepth: maxDepth ?? 0,
    liveChipIds: new Set(processingOrder),
  };
}

describe('computeWireAnimationCache', () => {
  it('returns empty timings for empty graph', () => {
    const cache = computeWireAnimationCache(
      [],
      new Map(),
      makeCycleResults([]),
      0,
    );
    expect(cache.timings.size).toBe(0);
  });

  it('linear chain: phases monotonically increase', () => {
    // input_cp(depth 0) -> nodeA(depth 1) -> nodeB(depth 2) -> output_cp(depth 3)
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, 'nodeA', 0),
      makeWire('w2', 'nodeA', 0, 'nodeB', 0),
      makeWire('w3', 'nodeB', 0, '__cp_output_0__', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_input_0__', 0],
      ['nodeA', 1],
      ['nodeB', 2],
      ['__cp_output_0__', 3],
    ]);
    const results = makeCycleResults(['nodeA', 'nodeB'], undefined, depths, 3);

    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    const t1 = cache.timings.get('w1')!;
    const t2 = cache.timings.get('w2')!;
    const t3 = cache.timings.get('w3')!;

    // w1: CP source (depth 0) → nodeA (depth 1)
    expect(t1.departPhase).toBeCloseTo(0 / 3); // 0
    expect(t1.arrivePhase).toBeCloseTo(1 / 3);

    // w2: nodeA (depth 1) → nodeB (depth 2)
    expect(t2.departPhase).toBeCloseTo(1 / 3);
    expect(t2.arrivePhase).toBeCloseTo(2 / 3);

    // w3: nodeB (depth 2) → output CP (depth 3)
    expect(t3.departPhase).toBeCloseTo(2 / 3);
    expect(t3.arrivePhase).toBe(1);

    // Monotonically increasing
    expect(t1.departPhase).toBeLessThan(t1.arrivePhase);
    expect(t2.departPhase).toBeLessThan(t2.arrivePhase);
    expect(t3.departPhase).toBeLessThan(t3.arrivePhase);
    expect(t1.arrivePhase).toBeLessThanOrEqual(t2.departPhase);
    expect(t2.arrivePhase).toBeLessThanOrEqual(t3.departPhase);
  });

  it('input CP wires: departPhase = 0', () => {
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, 'nodeA', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_input_0__', 0],
      ['nodeA', 1],
    ]);
    const results = makeCycleResults(['nodeA'], undefined, depths, 1);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);
    expect(cache.timings.get('w1')!.departPhase).toBe(0);
  });

  it('output CP wires: arrivePhase = 1', () => {
    const wires: Path[] = [
      makeWire('w1', 'nodeA', 0, '__cp_output_0__', 0),
    ];
    const depths = new Map<string, number>([
      ['nodeA', 0],
      ['__cp_output_0__', 1],
    ]);
    const results = makeCycleResults(['nodeA'], undefined, depths, 1);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);
    expect(cache.timings.get('w1')!.arrivePhase).toBe(1);
  });

  it('direct CP-to-CP wire: full range', () => {
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, '__cp_output_0__', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_input_0__', 0],
      ['__cp_output_0__', 1],
    ]);
    const results = makeCycleResults([], undefined, depths, 1);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);
    const t = cache.timings.get('w1')!;
    expect(t.departPhase).toBe(0);
    expect(t.arrivePhase).toBe(1);
  });

  it('cross-cycle feedback: arrivePhase wraps to 1', () => {
    // nodeA has higher depth than nodeB, but wire goes nodeA → nodeB
    // This simulates a feedback/backward wire
    const wires: Path[] = [
      makeWire('w1', 'nodeA', 0, 'nodeB', 0),
    ];
    const depths = new Map<string, number>([
      ['nodeB', 1],
      ['nodeA', 2],
    ]);
    const results = makeCycleResults(['nodeB', 'nodeA'], undefined, depths, 2);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);
    const t = cache.timings.get('w1')!;

    // nodeA depart: 2/2 = 1
    // nodeB arrive: 1/2 = 0.5 — but 0.5 <= 1, so wraps to 1
    expect(t.departPhase).toBeCloseTo(1);
    expect(t.arrivePhase).toBe(1);
  });

  it('reads signal value from wireValues at playpoint', () => {
    const wireValues = new Map<string, number[]>();
    wireValues.set('w1', [10, 20, 30, 40]);

    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, 'nodeA', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_input_0__', 0],
      ['nodeA', 1],
    ]);
    const results = makeCycleResults(['nodeA'], wireValues, depths, 1);

    const cache = computeWireAnimationCache(wires, new Map(), results, 2);
    expect(cache.timings.get('w1')!.signalValue).toBe(30);
  });

  it('signal value defaults to 0 when wire not in wireValues', () => {
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, 'nodeA', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_input_0__', 0],
      ['nodeA', 1],
    ]);
    const results = makeCycleResults(['nodeA'], undefined, depths, 1);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);
    expect(cache.timings.get('w1')!.signalValue).toBe(0);
  });

  it('creative slot CPs are treated as connection points', () => {
    const wires: Path[] = [
      makeWire('w1', '__cp_creative_0__', 0, 'nodeA', 0),
      makeWire('w2', 'nodeA', 0, '__cp_creative_3__', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_creative_0__', 0],
      ['nodeA', 1],
      ['__cp_creative_3__', 2],
    ]);
    const results = makeCycleResults(['nodeA'], undefined, depths, 2);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    // Creative input CP → depart at 0
    expect(cache.timings.get('w1')!.departPhase).toBe(0);
    // Creative output CP → arrive at 1
    expect(cache.timings.get('w2')!.arrivePhase).toBe(1);
  });

  it('parallel paths fire at same phase (wavefront behavior)', () => {
    // input_cp(0) → nodeA(1), input_cp(0) → nodeB(1), nodeA(1) → output_cp(2), nodeB(1) → output_cp2(2)
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, 'nodeA', 0),
      makeWire('w2', '__cp_input_0__', 0, 'nodeB', 0),
      makeWire('w3', 'nodeA', 0, '__cp_output_0__', 0),
      makeWire('w4', 'nodeB', 0, '__cp_output_1__', 0),
    ];
    const depths = new Map<string, number>([
      ['__cp_input_0__', 0],
      ['nodeA', 1],
      ['nodeB', 1],
      ['__cp_output_0__', 2],
      ['__cp_output_1__', 2],
    ]);
    const results = makeCycleResults(['nodeA', 'nodeB'], undefined, depths, 2);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    // nodeA and nodeB are at same depth → same depart phase
    const t1 = cache.timings.get('w1')!;
    const t2 = cache.timings.get('w2')!;
    expect(t1.arrivePhase).toBeCloseTo(t2.arrivePhase); // both arrive at depth 1/2

    const t3 = cache.timings.get('w3')!;
    const t4 = cache.timings.get('w4')!;
    expect(t3.departPhase).toBeCloseTo(t4.departPhase); // both depart at depth 1/2
    expect(t3.arrivePhase).toBe(1); // output CPs at maxDepth
    expect(t4.arrivePhase).toBe(1);
  });
});

describe('computeBlipPortKeys', () => {
  it('source held when progress < departPhase', () => {
    const wires: Path[] = [
      makeWire('w1', 'nodeA', 0, 'nodeB', 0),
    ];
    const depths = new Map([['nodeA', 1], ['nodeB', 2]]);
    const results = makeCycleResults(['nodeA', 'nodeB'], undefined, depths, 3);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    const t = cache.timings.get('w1')!;
    // Progress before departPhase → source is held
    const holding = computeBlipPortKeys(cache, wires, t.departPhase - 0.01);
    expect(holding.has('nodeA:plug:0')).toBe(true);
    expect(holding.has('nodeB:socket:0')).toBe(false);
  });

  it('source not held when progress >= departPhase', () => {
    const wires: Path[] = [
      makeWire('w1', 'nodeA', 0, 'nodeB', 0),
    ];
    const depths = new Map([['nodeA', 1], ['nodeB', 2]]);
    const results = makeCycleResults(['nodeA', 'nodeB'], undefined, depths, 3);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    const t = cache.timings.get('w1')!;
    const holding = computeBlipPortKeys(cache, wires, t.departPhase);
    expect(holding.has('nodeA:plug:0')).toBe(false);
  });

  it('target held when progress >= arrivePhase', () => {
    const wires: Path[] = [
      makeWire('w1', 'nodeA', 0, 'nodeB', 0),
    ];
    const depths = new Map([['nodeA', 1], ['nodeB', 2]]);
    const results = makeCycleResults(['nodeA', 'nodeB'], undefined, depths, 3);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    const t = cache.timings.get('w1')!;
    const holding = computeBlipPortKeys(cache, wires, t.arrivePhase);
    expect(holding.has('nodeB:socket:0')).toBe(true);
  });

  it('target not held when progress < arrivePhase', () => {
    const wires: Path[] = [
      makeWire('w1', 'nodeA', 0, 'nodeB', 0),
    ];
    const depths = new Map([['nodeA', 1], ['nodeB', 2]]);
    const results = makeCycleResults(['nodeA', 'nodeB'], undefined, depths, 3);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    const t = cache.timings.get('w1')!;
    const holding = computeBlipPortKeys(cache, wires, t.arrivePhase - 0.01);
    expect(holding.has('nodeB:socket:0')).toBe(false);
  });

  it('empty set when all blips mid-transit', () => {
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, '__cp_output_0__', 0),
    ];
    const depths = new Map([['__cp_input_0__', 0], ['__cp_output_0__', 1]]);
    const results = makeCycleResults([], undefined, depths, 1);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    // Mid-transit: past depart (0), before arrive (1)
    const holding = computeBlipPortKeys(cache, wires, 0.5);
    expect(holding.size).toBe(0);
  });

  it('CP-to-CP paths work correctly', () => {
    const wires: Path[] = [
      makeWire('w1', '__cp_input_0__', 0, '__cp_output_0__', 0),
    ];
    const depths = new Map([['__cp_input_0__', 0], ['__cp_output_0__', 1]]);
    const results = makeCycleResults([], undefined, depths, 1);
    const cache = computeWireAnimationCache(wires, new Map(), results, 0);

    // At progress 0: source held (0 < 0 is false, so not held), target not held
    // Actually departPhase = 0, so progress 0 is NOT < 0 → source not held
    // arrivePhase = 1, so progress 0 is NOT >= 1 → target not held
    const holdingStart = computeBlipPortKeys(cache, wires, 0);
    expect(holdingStart.has('__cp_input_0__:plug:0')).toBe(false);
    expect(holdingStart.has('__cp_output_0__:socket:0')).toBe(false);

    // At progress 1: source not held, target held
    const holdingEnd = computeBlipPortKeys(cache, wires, 1);
    expect(holdingEnd.has('__cp_input_0__:plug:0')).toBe(false);
    expect(holdingEnd.has('__cp_output_0__:socket:0')).toBe(true);
  });
});
