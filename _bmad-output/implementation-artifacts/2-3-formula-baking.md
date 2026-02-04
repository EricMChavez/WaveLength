# Story 2.3: Formula Baking

Status: complete

## Story

As a developer,
I want solved puzzles to compile into instant-evaluation baked nodes,
So that custom nodes execute efficiently without re-evaluating their internal graph.

## Acceptance Criteria

1. **Given** a gameboard with connected nodes **When** baking is triggered **Then** the graph is walked in topological order and fundamental operations are composed into a single `(inputs: number[]) => number[]` closure
2. Per-input-path delays are accumulated (wire count x WTS ticks + Delay param values) and normalized (shortest path = 0 buffer)
3. Circular buffers are created per input port, pre-filled with 0
4. Bake metadata (topo order, node configs, edges, input delays) is serializable to JSON
5. Closure is reconstructable from metadata alone
6. Equivalence test passes: for any graph, `bakedFunction(inputs)` matches live graph steady-state output exactly

## Tasks / Subtasks

- [x] Task 1: Bake metadata types (AC: 4)
  - [x] 1.1 Define `BakedNodeConfig`, `BakedEdge`, `BakeMetadata`, `BakeResult`, `BakeError` interfaces in `src/engine/baking/types.ts`
  - [x] 1.2 All types are plain objects (no Maps, no functions) — JSON-serializable

- [x] Task 2: Delay analysis (AC: 2, 3)
  - [x] 2.1 Implement `analyzeDelays(topoOrder, nodes, wires)` in `delay-calculator.ts`
  - [x] 2.2 Walk topo order tracking cumulative delay from each input CP through wires and delay nodes
  - [x] 2.3 Normalize offsets so shortest CP path has bufferOffset = 0
  - [x] 2.4 Compute inputBufferSizes: max bufferOffset per CP index + 1
  - [x] 2.5 Produce PortSource mappings: each node input port maps to either a CP buffer read (with offset) or a direct node output read
  - [x] 2.6 Produce OutputMapping: each output CP maps to the node/port that feeds it

- [x] Task 3: Bake graph into closure (AC: 1, 3)
  - [x] 3.1 Implement `bakeGraph(nodes, wires)` in `bake.ts` — returns `Result<BakeResult, BakeError>`
  - [x] 3.2 Build circular buffers per input CP with size from delay analysis
  - [x] 3.3 Build NodeSpec array for fast evaluation (pre-computed input sources per node)
  - [x] 3.4 Create closure that: pushes inputs into CP buffers → evaluates processing nodes in topo order → collects output CP values
  - [x] 3.5 Handle all 5 fundamental node types via `evaluateNodePure` (mirrors tick-scheduler evaluation)
  - [x] 3.6 Create DelayState per delay node inside closure scope (captures mutable state)

- [x] Task 4: Metadata reconstruction (AC: 5)
  - [x] 4.1 Implement `reconstructFromMetadata(metadata)` — rebuilds nodes/wires from metadata, re-runs analyzeDelays, builds new closure
  - [x] 4.2 Handles CP virtual nodes not present in nodeConfigs

- [x] Task 5: Comprehensive test suite (AC: 6)
  - [x] 5.1 Single Invert node: baked output matches -input
  - [x] 5.2 Mix Add chain: two inputs summed, clamped
  - [x] 5.3 Threshold node: binary output (+100/-100) matches live eval
  - [x] 5.4 Delay node: output appears after correct number of ticks
  - [x] 5.5 Multi-node pipeline: Invert → Mix → Threshold chain
  - [x] 5.6 Diamond graph: two paths merge at a Mix node
  - [x] 5.7 Direct CP-to-CP passthrough (no processing nodes)
  - [x] 5.8 Multiple outputs: 2 separate processing chains
  - [x] 5.9 Unconnected input port defaults to 0
  - [x] 5.10 Cycle detection returns error
  - [x] 5.11 Metadata reconstruction equivalence: reconstructed closure matches original
  - [x] 5.12 Metadata is JSON-serializable (round-trip test)
  - [x] 5.13 Delay buffer normalization: two paths with different wire counts
  - [x] 5.14 Multiply node with port constants
  - [x] 5.15 Mix Add node with values exceeding range (clamping)
  - [x] 5.16 Live graph equivalence: baked output matches tick-scheduler steady-state for multi-node graphs

## Dev Notes

### Architecture Compliance

- **Engine isolation**: All baking code in `src/engine/baking/` — pure TS, no React/Canvas imports. Correct.
- **Pure functions**: `evaluateNodePure` mirrors `evaluateNode` from tick-scheduler but is side-effect-free. Correct.
- **No lateral imports**: Baking imports from `src/shared/`, `src/engine/nodes/`, `src/engine/graph/`, and `src/puzzle/connection-point-nodes.ts` only. Correct.

### Baking Pipeline

```
bakeGraph(nodes, wires)
  1. topologicalSort(nodeIds, wires)        → topoOrder
  2. analyzeDelays(topoOrder, nodes, wires) → portSources, inputBufferSizes, outputMappings, processingOrder
  3. buildMetadata(topoOrder, nodes, wires, analysis) → BakeMetadata (JSON-serializable)
  4. buildClosure(nodes, analysis) → (inputs: number[]) => number[]
     └─ Captures: cpBuffers[], nodeSpecs[], delayStates, nodeOutputs
     └─ Each call: push inputs → eval topo → collect outputs
```

### Delay Normalization

Wire delays and Delay node subdivisions accumulate along paths. The shortest path from any input CP is normalized to bufferOffset=0, and longer paths use proportionally larger buffer offsets. This preserves internal timing relationships without introducing unnecessary latency.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.3]
- [Source: _bmad-output/game-architecture.md — Formula Baking Engine]
- [Source: _bmad-output/project-context.md — Baked Node Architecture]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented full baking pipeline: delay analysis, closure construction, metadata serialization, and reconstruction.
- Delay calculator walks topological order accumulating wire delays and Delay node subdivisions, normalizes to shortest-path-zero.
- Closure captures mutable state (circular buffers, DelayStates) and evaluates the entire graph in a single function call.
- reconstructFromMetadata rebuilds nodes/wires from plain-object metadata and produces an equivalent closure.
- 25 tests cover all fundamental node types, multi-node pipelines, diamond graphs, CP passthrough, delay buffering, cycle detection, metadata round-trip, and live-graph equivalence.
- All tests pass. TypeScript compiles cleanly.

### Change Log

- 2026-02-03: Story 2.3 implementation — formula baking engine with delay analysis, closure construction, metadata serialization

### File List

- `src/engine/baking/types.ts` — Created (BakedNodeConfig, BakedEdge, BakeMetadata, BakeResult, BakeError)
- `src/engine/baking/delay-calculator.ts` — Created (analyzeDelays, PortSource, OutputMapping, DelayAnalysis)
- `src/engine/baking/bake.ts` — Created (bakeGraph, reconstructFromMetadata, buildClosure, evaluateNodePure)
- `src/engine/baking/bake.test.ts` — Created (25 tests: all node types, pipelines, diamonds, delays, metadata, equivalence)
- `src/engine/baking/index.ts` — Created (barrel exports)
