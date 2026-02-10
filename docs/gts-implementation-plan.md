# GTS (Gameboard Transfer Speed) + Delay Node Removal

## Context

Currently every wire has a fixed 16-tick (1 WTS) propagation delay. This means branching paths arrive at different times depending on wire count, and players need the Delay node to manually sync them. The GTS system replaces this with **variable per-wire delays** computed so that every path from any input to any terminal (output or dead-end) equals exactly **GTS = 4 WTS = 64 ticks**. The Delay node becomes unnecessary and is removed.

Graph mutations already trigger stop+restart (simulation-controller.ts:435-439), so wire delays are naturally recomputed on every structural change.

---

## Phase 1: Core Algorithm — New File

**Create `src/engine/graph/wire-delays.ts`**

```ts
export interface WireDelayResult {
  wireDelays: Map<string, number>;  // wireId → ticks (min 1)
  nodeDepths: Map<NodeId, number>;  // for debugging
  outputMaxDepth: number;
}

export function computeWireDelays(
  topoOrder: ReadonlyArray<NodeId>,
  wires: ReadonlyArray<Wire>,
  nodes: ReadonlyMap<NodeId, NodeState>,
  totalTicks: number,
): WireDelayResult;
```

**Algorithm:**
1. Build incoming/outgoing wire adjacency maps
2. Forward pass in topo order: `depth[node] = max(depth[pred] + 1)` per incoming wire; sources = 0
3. Backward BFS from output CPs to mark all "output-reachable" nodes
4. `outputMaxDepth = max(depth[outputCP])` (0 if no outputs connected)
5. For output-reachable wires A→B: `delay = round(depth[B] * total / maxDepth) - round(depth[A] * total / maxDepth)`, min 1
6. For dead-end subgraphs (targets NOT output-reachable):
   - Find entry node (output-reachable predecessor), `entryTime = round(depth[entry] * total / maxDepth)`
   - `remaining = total - entryTime`
   - Compute local depths within dead-end subgraph, `localMax = max local depth`
   - Each wire: `delay = round(localDepth[B] * remaining / localMax) - round(localDepth[A] * remaining / localMax)`, min 1
7. All-dead-end graph (no outputs): treat entire graph as one subgraph with budget = totalTicks

Rounding strategy: compute arrival times first, derive delays as differences. This guarantees exact total = GTS along any path.

**Export from `src/engine/graph/index.ts`**

**Create `src/engine/graph/wire-delays.test.ts`** — Test cases:
- Linear chain, fan-in, fan-out, diamond merge
- Dead-end branches (shared wire + exclusive wires)
- Single wire (delay = 64), no wires (empty map)
- All-dead-end graph, min-1 enforcement
- Multiple outputs at different depths

---

## Phase 2: Constants + Types

**`src/shared/constants/index.ts`**
- Add `GTS_CONFIG = { WTS_COUNT: 4, TOTAL_TICKS: 64 } as const`
- Remove `delay: 'Delay'` from `NODE_TYPE_LABELS`

**`src/shared/types/index.ts`**
- Remove `WIRE_BUFFER_SIZE` constant (line 26)
- Remove `'delay'` from `FundamentalNodeType` union (line 47)
- Update `createWire()` to use minimal 1-sample buffer (real size set at sim start):
  ```ts
  signalBuffer: [0],
  ```
- Update Wire JSDoc comments

---

## Phase 3: Tick Scheduler

**`src/wts/scheduler/tick-scheduler.ts`**
- Remove `WIRE_BUFFER_SIZE` import (line 2)
- Line 114: `wire.writeHead = (wire.writeHead + 1) % wire.signalBuffer.length`
- Update JSDoc comments referencing "16 ticks"

---

## Phase 4: Rendering

**`src/gameboard/canvas/render-wires.ts`**
- Remove `const BUFFER_SIZE = 16` (line 72)
- In `getSegmentSignal()`: replace all `BUFFER_SIZE` with `wire.signalBuffer.length`

**`src/gameboard/canvas/render-loop.ts`**
- Remove `const WIRE_BUFFER_SIZE = 16` (line 23)
- In `computePortSignals()` (line 40): `wire.signalBuffer[(wire.writeHead - 1 + wire.signalBuffer.length) % wire.signalBuffer.length]`

---

## Phase 5: Simulation Controller

**`src/simulation/simulation-controller.ts`**
- Remove `WIRE_BUFFER_SIZE` import (line 2)
- Remove `evaluateDelay` import (line 15)
- Add imports: `computeWireDelays` from engine/graph, `GTS_CONFIG` from constants
- In `startSimulation()`, after topo sort (after line 100):
  ```ts
  const delayResult = computeWireDelays(topoOrder, wires, nodes, GTS_CONFIG.TOTAL_TICKS);
  for (const wire of wires) {
    const delay = delayResult.wireDelays.get(wire.id) ?? GTS_CONFIG.TOTAL_TICKS;
    wire.signalBuffer = new Array(delay).fill(0);
    wire.writeHead = 0;
  }
  store.updateWires([...wires]); // push resized buffers to store
  ```
- In `stopSimulation()` (line 273): `new Array(1).fill(0)` instead of `new Array(WIRE_BUFFER_SIZE).fill(0)`
- Remove `delay` case from `evaluateNodeForInit()` (lines 342-346)
- Remove `delayState` from `evaluateNodeForInit` type signature (line 322)
- Update comments referencing "16-tick" propagation to "GTS"

---

## Phase 6: Baking System

**`src/engine/baking/delay-calculator.ts`**
- Remove `WIRE_BUFFER_SIZE` import
- Add `wireDelays: ReadonlyMap<string, number>` parameter to `analyzeDelays()`
- Lines 128, 138: replace `WIRE_BUFFER_SIZE` with `wireDelays.get(wire.id) ?? 1`
- Remove delay node special case (lines 148-157)

**`src/engine/baking/bake.ts`**
- Remove `WIRE_BUFFER_SIZE` import
- Add imports: `computeWireDelays`, `GTS_CONFIG`
- In `bakeGraph()` (line 193): compute wire delays first, pass to `analyzeDelays`:
  ```ts
  const delayResult = computeWireDelays(topoOrder, bakeWires, bakeNodes, GTS_CONFIG.TOTAL_TICKS);
  const analysis = analyzeDelays(topoOrder, bakeNodes, bakeWires, delayResult.wireDelays);
  ```
- In `buildMetadata()` (line 286): replace `wtsDelay: WIRE_BUFFER_SIZE` with actual per-wire delay from delay result (pass wireDelays map as additional param)
- In `reconstructFromMetadata()` (line 255): build wire delay map from stored `metadata.edges[i].wtsDelay`, pass to `analyzeDelays`

---

## Phase 7: Remove Delay Node

**Delete files:**
- `src/engine/nodes/definitions/delay.ts` + `delay.test.ts`
- `src/engine/nodes/delay.ts` + `delay.test.ts`

**Modify files:**
- `src/engine/nodes/definitions/index.ts` — remove delay export
- `src/engine/nodes/index.ts` — remove delay exports
- `src/engine/nodes/registry.ts` — remove `delayNode` from `NODE_DEFINITIONS`
- `src/palette/fundamental/node-defs.ts` — remove delay from `FUNDAMENTAL_NODES`
- `src/ui/overlays/ParameterPopover.tsx` — remove `DELAY_OPTIONS`, `DelayControls` component, delay branch
- `src/ui/overlays/context-menu-items.ts` — remove `'delay'` from `hasEditableParams()`

---

## Phase 8: Cleanup

- `src/store/slices/custom-puzzle-slice.ts` — remove unused `WIRE_BUFFER_SIZE` import
- Update test files:
  - `src/wts/scheduler/tick-scheduler.test.ts` — remove `WIRE_BUFFER_SIZE` references, update wire creation to use variable-size buffers, remove delay node tests
  - `src/engine/baking/bake.test.ts` — update for new `analyzeDelays` signature
  - `src/wts/scheduler/puzzle-node-evaluation.test.ts` — update if it references `WIRE_BUFFER_SIZE`
  - `src/engine/nodes/registry.test.ts` — adjust node count if it checks all registered nodes
  - `src/ui/overlays/context-menu-items.test.ts` — remove delay from editable params test
  - `src/ui/overlays/palette-items.test.ts` — adjust fundamental node count

---

## Implementation Order

1. Create `wire-delays.ts` + tests (purely additive, nothing breaks)
2. Add `GTS_CONFIG` constant (additive)
3. Update types: remove `WIRE_BUFFER_SIZE`, update `createWire()`, update `FundamentalNodeType`
4. Fix all consumers of `WIRE_BUFFER_SIZE` (phases 3-6, do together to keep builds passing)
5. Remove Delay node files and references (phase 7)
6. Fix all tests (phase 8)
7. Run full test suite, verify game plays correctly

---

## Verification

1. `npx vitest run` — all tests pass
2. `npx tsc --noEmit` — no type errors
3. Manual testing in browser:
   - Build a linear chain (input → 3 nodes → output): signal arrives at 4 seconds
   - Build a branching graph (splitter → long chain + short chain → merger → output): both branches arrive simultaneously
   - Build dead-end branches: signal flows through them, arrives at GTS
   - Verify wire rendering shows signal flowing at correct speed
   - Verify baking works (complete a puzzle, use the baked node in another puzzle)
