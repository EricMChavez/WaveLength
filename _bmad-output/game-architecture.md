---
title: 'Game Architecture'
project: 'logic-puzzle'
date: '2026-02-01'
author: 'Eric Chavez'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
engine: 'Canvas 2D + React 19 + TypeScript + Vite'
platform: 'Web Browser'

# Source Documents
gdd: 'signal_puzzle_game_design.md'
epics: 'planning-artifacts/epics.md'
brief: null
---

# Game Architecture

## Executive Summary

**Signal Processing Puzzle Game** architecture targets Canvas 2D + React 19 + TypeScript + Vite for a browser-based puzzle game where players manipulate signal waveforms by connecting processing nodes.

**Key Architectural Decisions:**

- Zustand bridges React UI and imperative Canvas rendering loop via shared store
- Custom nodes bake their internal graphs into composed closures on save -- only one gameboard is live-evaluated at a time
- Tick-based signal pipeline with 16-subdivision WTS timing on the active board's wires

**Project Structure:** Domain-driven organization with 10 core systems across isolated directories communicating through Zustand store.

**Implementation Patterns:** 7 pattern groups defined ensuring AI agent consistency, including novel formula baking pipeline and gameboard navigation tree.

**Ready for:** Epic creation and implementation phase.

---

## Project Context

### Game Overview

**Signal Processing Puzzle Game** - A DAW/node-graph inspired puzzle game where players manipulate signal waveforms by connecting and configuring processing nodes to transform an input waveform into a target output. Every solved puzzle becomes a reusable node, creating a recursive, fractal tool-building experience.

### Technical Scope

**Platform:** Web Browser (Canvas 2D)
**Genre:** Puzzle / Visual Programming
**Project Level:** Medium complexity (smart baking reduces recursive evaluation to flat graph processing)

### Core Systems

| System | Complexity | Description |
|--------|-----------|-------------|
| Signal Graph Engine | Medium | Flat graph evaluation on active gameboard only; custom nodes are pre-baked functions |
| Formula Baking/Compilation | Medium | Collapses a gameboard's node graph into a composed formula on save/complete |
| Gameboard Navigation | Medium | Zoom in/out between nested gameboards; only one active at a time |
| Waveform Visualization | Medium | Real-time animated waveforms and signal pulse animation on active board only |
| Timing System (WTS) | Medium | 1-second base rhythm, 16 subdivisions; only active board wires carry WTS delay |
| Puzzle Validation Engine | Medium | Multi-waveform test suites, tolerance matching (±5 units), timing verification |
| Node Palette & Library | Medium | Fundamental nodes, puzzle node unlocks, utility node CRUD |
| Progression System | Low-Medium | 25+ levels across 4 arcs, tool-building progression loop |
| UI/UX System | Medium | Full-screen gameboard, node palette, wire drawing, breadcrumb navigation |
| Save/Persistence | Low-Medium | Player node library, progression state, utility node storage |

### Technical Requirements

- Real-time signal graph evaluation on single active gameboard (topological sort)
- Formula baking: collapse node graphs into composed functions on save/complete
- Smooth waveform animation (Canvas/WebGL)
- Signal values clamped to -100 to +100 range throughout
- WTS timing precision with 16 subdivisions (active board wires only)
- Multi-waveform validation for puzzle completion
- Single gameboard rendered at a time; nested boards are dormant

### Key Design Simplification: Baked Nodes

- Only one gameboard is active/rendered at a time
- Custom nodes bake their internal graph into a single formula on save -- internal wires carry no WTS delay
- **Open node**: Live graph with visible wires, real-time evaluation, WTS timing on wires
- **Closed node**: Baked formula for evaluation + stored layout data for re-opening later
- This eliminates recursive evaluation and deep nesting performance concerns

### Complexity Drivers

**Remaining Complexity:**
- Formula baking/compilation -- composing fundamental node operations into a single callable function per custom node
- WTS timing on the active gameboard -- signals traversing visible wires with 16-subdivision precision

**Novel Concepts:**
- "Every puzzle becomes a node" -- solved gameboards bake into reusable formula-nodes
- Rhythmic signal propagation visualization synchronized to the WTS clock

**Resolved by Design:**
- Merge node timing: GDD specifies nodes fire on each input update using latest values; unconnected inputs default to 0. Standard dataflow behavior, no ambiguity.

### Technical Risks

- Formula baking correctness -- ensuring composed formulas match the live graph behavior exactly
- Waveform rendering performance with many simultaneous animated signals on one board
- Undo/redo within the active gameboard context
- Circular dependency prevention when custom nodes reference each other

## Engine & Framework

### Selected Stack

**Canvas 2D API + React 19 + TypeScript + Vite**

**Rationale:** This is an interactive puzzle application with game mechanics, not a traditional sprite-based game. The rendering needs (rectangles, lines, waveform paths, gradients) are well within Canvas 2D's capabilities. React handles the UI chrome (palette, breadcrumbs, parameter controls, menus) naturally. No game engine overhead for features we won't use.

### Project Initialization

```bash
npm create vite@latest logic-puzzle -- --template react-ts
```

### Verified Versions

| Component | Version | Notes |
|-----------|---------|-------|
| React | 19.2.4 | Latest stable (Jan 26, 2026) |
| TypeScript | 5.9.3 | Latest stable; TS 7 native preview available but not yet stable |
| Vite | 7.3.1 | Latest stable; Vite 8 beta available with Rolldown bundler |

### Architecture Provided by Stack

| Component | Solution | Notes |
|-----------|----------|-------|
| Rendering | Canvas 2D API | Native browser API, no library needed |
| UI Framework | React 19 | Component tree for palette, menus, controls |
| Language | TypeScript | Type safety for signal graph logic |
| Build Tool | Vite 7 | Fast dev server, HMR, production bundling |
| Module System | ES Modules | Native via Vite |

### Remaining Architectural Decisions

~~All resolved in Step 4 below.~~

### AI Tooling (MCP Servers)

**Context7** (upstash/context7) - Pulls up-to-date, version-specific documentation for React, TypeScript, Canvas API, and any other libraries directly into AI prompts. Prevents outdated API usage.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

## Architectural Decisions

### Decision Summary

| Category | Decision | Version | Rationale |
|----------|----------|---------|-----------|
| State Management | Zustand | 5.0.10 | Readable/subscribable from imperative Canvas code outside React's render cycle |
| Canvas Rendering | Single Canvas; offscreen snapshot for zoom transitions | n/a | Element count within per-frame redraw budget at 60fps; one coordinate space, one hit-test surface |
| Signal Graph Engine | Node map + Edge list (hybrid), tick-based pipeline | n/a | First-class nodes/wires; evaluation maps directly to WTS timing model |
| Formula Baking | Symbolic composition | n/a | Composed closures execute at native JS speed; serializable metadata |
| Save/Persistence | localStorage (JSON) | n/a | Small data footprint; synchronous API; migration path to IndexedDB if needed |
| CSS/Styling | CSS Modules | n/a | Zero runtime cost; Vite-native; scoped by default |
| Testing | Vitest | n/a | Vite-native; Jest-compatible API; core test surface is pure TS logic |
| Undo/Redo | State snapshots (immutable history stack) | n/a | Gameboard state is small; simplest approach; no per-action reverse logic |

### State Management

**Approach:** Zustand 5.0.10

Zustand store serves as the bridge between React's declarative UI (palette, breadcrumbs, menus) and the imperative Canvas rendering loop. The store is readable and subscribable from outside React components, which is critical because the gameboard renderer runs in a `requestAnimationFrame` loop, not a React render cycle.

### Canvas Rendering

**Approach:** Single Canvas with offscreen snapshot for zoom transitions

One visible canvas handles all gameboard rendering (nodes, wires, waveform paths, signal pulse animations). Full redraw per frame -- element count (dozens of nodes/wires) is well within Canvas 2D's budget at 60fps. Offscreen buffer caching can be added as an optimization if profiling shows a need.

**Zoom Transitions:** When navigating between gameboards (Edit/Save/Done), the departing board is rendered to a temporary offscreen canvas as a frozen image. This snapshot is animated (scale/position/fade) on the main canvas during the transition (~0.5s). The arriving board begins live rendering after the transition completes. This maintains exactly one live-evaluated board at all times.

**Puzzle Completion Animation:** The zoom-out reveal (solved board shrinks into a node) is a first-class animation state in the system, using the same snapshot transition mechanism.

### Signal Graph Engine

**Data Model:** Hybrid -- Node map + Edge list

- **Nodes** stored by ID in a `Map<NodeId, NodeState>`. Each node holds its type, parameters, position, and evaluation function.
- **Wires** stored as a separate edge list `Wire[]`. Each wire references source node/port and target node/port, carries WTS delay, and holds in-flight signal state (`{value, ticksRemaining}` entries).
- Both are first-class: nodes own evaluation logic, wires own timing and animation state.

**Evaluation:** Tick-based pipeline

Each WTS tick (with 16 subdivisions), signals advance along wires. Nodes fire when inputs arrive, outputting results onto outgoing wires. Wire state doubles as animation state for signal pulse visualization. Topological sort determines evaluation order, re-sorted on graph edit.

**Implementation Note:** `Wire` and `Node` TypeScript interfaces must be defined as the very first implementation task -- they are the foundational contracts the entire engine builds on.

### Formula Baking

**Approach:** Symbolic composition

When a gameboard is saved/completed, walk the graph in topological order and compose a single `(inputs: number[]) => number[]` closure by chaining the fundamental node operations (clamp, multiply, add, max, min, invert, threshold). Internal WTS delays are stripped -- baked nodes evaluate instantly.

Baked function metadata (topological order + node params) is serializable for save/load. The closure is reconstructed from metadata on load.

**Critical Invariant:** For any graph, `bakedFunction(inputs)` must produce identical results to live graph evaluation (minus timing). This equivalence must be verified by tests.

### Save/Persistence

**Approach:** localStorage with JSON serialization

**Data stored:**
- Puzzle progression state (completed levels, unlocked nodes)
- Baked formula metadata for each puzzle/utility node (topological order + params)
- Internal gameboard layouts for custom nodes (for re-editing)
- Player settings (WTS speed, etc.)

Total data footprint estimated well under 1MB. Migration path to IndexedDB exists if data grows.

### CSS/Styling

**Approach:** CSS Modules

Scoped styles for React UI chrome (palette sidebar, breadcrumb bar, parameter controls, modals, menus). Zero runtime overhead, Vite supports natively with no configuration. CSS custom properties handle theming.

### Testing

**Approach:** Vitest

Native Vite integration (shared config and transforms). Jest-compatible API.

**Test Priority Order:**
1. Fundamental node operations -- each node type with edge cases (-100, 0, +100, overflow clamping). Pure functions, 100% coverage.
2. Topological sort correctness -- including cycle detection and prevention.
3. Formula baking equivalence -- `bakedFunction(inputs) === liveGraphEvaluation(inputs)` for any graph.
4. WTS tick accuracy -- signals arrive at correct subdivisions, no off-by-one errors.
5. Lower priority: localStorage serialization, undo stack, React components.

### Undo/Redo

**Approach:** State snapshots (immutable history stack)

Push full gameboard state to a history stack before each edit action. Undo = restore previous snapshot. History depth capped at ~50 entries.

**Granularity:** Wire connect (click source + click target) counts as a single undoable action, not two separate actions. Same for other multi-step interactions that form one logical edit.

## Cross-cutting Concerns

These patterns apply to ALL systems and must be followed by every implementation.

### Cross-cutting Summary

| Concern | Decision | Key Rule |
|---------|----------|----------|
| Error Handling | Hybrid: Result objects (engine) + try-catch (browser APIs) | Never crash; frozen waveform + indicator on failure |
| Logging | Structured logger utility with namespaces and levels | Production: WARN+, Development: DEBUG |
| Configuration | TS consts (fixed values) + Zustand store (player settings) | If fixed → const. If player-changeable → store. |
| Inter-system Communication | Zustand subscriptions; async functions for sequenced ceremonies | No separate event bus; state change is the event |
| Debug Tools | All behind `import.meta.env.DEV`; tree-shaken from production | Graph overlay, tick debugger, bake inspector, level skip |

### Error Handling

**Strategy:** Hybrid

- **Signal graph engine:** Functions return Result objects (`{ ok: true, value } | { ok: false, error }`). Typed, composable, testable.
- **Browser API boundaries:** Try-catch around Canvas and localStorage calls.
- **User actions:** Invalid operations (bad wire connections, etc.) prevented in the UI before they reach the engine.
- **Failure mode:** Errors never crash the game. Worst case is a frozen waveform with a visual error indicator.

### Logging

**Strategy:** Structured logger utility

Thin wrapper (~20 lines) around `console.*` with namespace prefixes and a level filter. No external dependencies.

**Namespaces:** `Graph`, `WTS`, `Bake`, `Render`, `Save`, `UI`

**Levels:**
- **ERROR** -- Something broke (graph cycle detected, bake failed, localStorage write failed)
- **WARN** -- Unexpected but handled (unconnected input defaulting to 0, clamped overflow)
- **INFO** -- Milestone events (puzzle completed, node baked, game loaded)
- **DEBUG** -- Detailed diagnostics (tick evaluation, per-node signal values, wire state)

**Production:** Level set to WARN+. **Development:** Level set to DEBUG.

### Configuration

**Strategy:** Hybrid -- TypeScript consts + Zustand store

- **TypeScript const objects:** Game constants and balancing values. Grouped by domain (`SIGNAL_CONFIG`, `WTS_CONFIG`, `VALIDATION_CONFIG`). Immutable, type-safe, zero runtime cost.
- **Zustand store:** Player-adjustable settings (WTS speed, visual preferences). Persisted to localStorage.
- **Boundary rule:** If game-design-fixed → const. If player-changeable → store.

### Inter-system Communication

**Strategy:** Zustand subscriptions

No separate event bus. Systems subscribe to Zustand store slices they depend on. State change *is* the event. Data flow is unidirectional: actions update store, subscribers react.

**Sequenced ceremonies** (e.g., puzzle completion: validate → reveal name → play animation → add to palette → load next) are orchestrated imperatively via async functions, not event chains.

### Debug & Development Tools

**Gate:** `import.meta.env.DEV` (Vite-native, tree-shaken from production builds)

**Tools:**
- **Zustand devtools middleware** -- Connects to Redux DevTools browser extension for state inspection. Dev only.
- **Graph inspector overlay** -- Toggle via keyboard shortcut. Shows node IDs, current signal values, wire state on the canvas.
- **WTS tick debugger** -- Manual tick stepping, per-subdivision signal inspection. Accessible from dev panel overlay.
- **Bake inspector** -- View composed formula for any baked node, test with arbitrary inputs. Accessible from dev panel overlay.
- **Level skip/unlock** -- Jump to any puzzle level for testing. Accessible from dev panel overlay.

## Project Structure

### Organization Pattern

**Pattern:** Domain-Driven

**Rationale:** Each core system (engine, WTS, validation, gameboard, etc.) maps to its own directory with co-located types, logic, and tests. Domains communicate through the Zustand store, not lateral imports.

### Directory Structure

```
logic-puzzle/
├── src/
│   ├── engine/                     # Signal Graph Engine
│   │   ├── nodes/                  # Node type definitions and evaluation functions
│   │   ├── wires/                  # Wire state, signal transport
│   │   ├── graph/                  # Graph data structure, topological sort, cycle detection
│   │   └── baking/                 # Formula baking/compilation (symbolic composition)
│   │
│   ├── wts/                        # Wire Transfer Speed / Timing System
│   │   ├── clock/                  # WTS clock, tick management, 16 subdivisions
│   │   └── scheduler/             # Tick-based signal advancement
│   │
│   ├── validation/                 # Puzzle Validation Engine
│   │   ├── suites/                 # Multi-waveform test suite definitions
│   │   └── matching/              # Tolerance matching, timing verification
│   │
│   ├── gameboard/                  # Gameboard Navigation & Rendering
│   │   ├── canvas/                 # Canvas 2D rendering loop, hit testing
│   │   ├── navigation/            # Zoom in/out, breadcrumb state, transitions
│   │   ├── interaction/           # Wire drawing, node placement, drag, selection
│   │   └── visualization/         # Waveform drawing, signal pulse animation
│   │
│   ├── palette/                    # Node Palette & Library
│   │   ├── fundamental/           # Built-in node definitions (Multiply, Mix, etc.)
│   │   ├── library/               # Player node library management
│   │   └── components/            # Palette UI (React components)
│   │
│   ├── progression/                # Progression System
│   │   ├── levels/                 # Level definitions (TS data files with generator functions)
│   │   ├── unlocks/               # Node unlock tracking
│   │   └── ceremonies/            # Puzzle completion sequences (async orchestration)
│   │
│   ├── persistence/                # Save/Load System
│   │   ├── storage/               # localStorage adapter
│   │   ├── serialization/         # JSON serialization for baked formulas, layouts
│   │   └── migration/             # Future data migration utilities
│   │
│   ├── store/                      # Zustand Store
│   │   ├── slices/                # Store slices by domain
│   │   └── middleware/            # Dev tools, persistence, undo/redo history stack
│   │
│   ├── ui/                         # React UI Chrome
│   │   ├── layout/                # Top-level layout (full-screen gameboard + sidebar)
│   │   ├── breadcrumbs/           # Breadcrumb navigation bar
│   │   ├── controls/              # Node parameter controls (dropdowns, sliders)
│   │   ├── modals/                # Naming dialogs, confirmation prompts
│   │   └── puzzle/                # Puzzle-specific UI (preview, match indicator, submit)
│   │
│   ├── shared/                     # Cross-cutting utilities
│   │   ├── types/                 # Shared TypeScript interfaces (Node, Wire, Port, Signal, etc.)
│   │   ├── constants/             # Config objects (SIGNAL_CONFIG, WTS_CONFIG, VALIDATION_CONFIG)
│   │   ├── logger/                # Structured logger with namespaces and levels
│   │   ├── result/                # Result<T, E> type and helpers
│   │   └── math/                  # Clamp, interpolation, waveform generators (sine, square, triangle)
│   │
│   ├── debug/                      # Dev-only tools (tree-shaken via import.meta.env.DEV)
│   │   ├── graph-inspector/       # Graph overlay (node IDs, signal values, wire state)
│   │   ├── tick-debugger/         # WTS manual stepping, per-subdivision inspection
│   │   ├── bake-inspector/        # Composed formula viewer/tester
│   │   └── level-skip/            # Progression skip for testing
│   │
│   ├── assets/                     # Vite-imported assets
│   │   ├── styles/                # Global CSS (reset, custom properties/theming)
│   │   └── audio/                 # Sound effects (if added)
│   │
│   ├── App.tsx                     # Root React component
│   ├── main.tsx                    # Vite entry point
│   └── vite-env.d.ts              # Vite type declarations
│
├── public/                         # Static assets
│   ├── fonts/                     # Custom fonts (if needed)
│   └── favicon.ico
│
├── tests/                          # Integration tests spanning multiple domains
├── docs/                           # Documentation
├── index.html                      # Vite entry point
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

### System Location Mapping

| System | Location | Responsibility |
|--------|----------|----------------|
| Signal Graph Engine | `src/engine/graph/` | Node map, edge list, topological sort, cycle detection |
| Node Evaluation | `src/engine/nodes/` | Per-node-type evaluation functions |
| Wire State | `src/engine/wires/` | Wire data, in-flight signal state, WTS delay per wire |
| Formula Baking | `src/engine/baking/` | Symbolic composition, closure generation, metadata serialization |
| WTS Clock | `src/wts/clock/` | 1-second base rhythm, 16 subdivisions, tick counter |
| WTS Scheduler | `src/wts/scheduler/` | Advance signals along wires, trigger node evaluation |
| Puzzle Validation | `src/validation/suites/` | Multi-waveform test definitions per level |
| Tolerance Matching | `src/validation/matching/` | ±5 unit matching, timing verification, 2-cycle sustain |
| Canvas Rendering | `src/gameboard/canvas/` | rAF loop, node/wire/waveform drawing, hit testing |
| Zoom Navigation | `src/gameboard/navigation/` | Gameboard stack, zoom transitions, offscreen snapshot |
| User Interaction | `src/gameboard/interaction/` | Wire drawing, node placement, drag, selection |
| Waveform Visualization | `src/gameboard/visualization/` | Animated waveform paths, signal pulse animation |
| Fundamental Nodes | `src/palette/fundamental/` | Built-in node type registry (5 types) |
| Player Library | `src/palette/library/` | Puzzle node unlocks, utility node CRUD |
| Palette UI | `src/palette/components/` | React sidebar with fundamental/puzzle/utility sections |
| Level Definitions | `src/progression/levels/` | Per-level TS data files using waveform generators |
| Unlock Tracking | `src/progression/unlocks/` | Progression state, available nodes |
| Completion Ceremonies | `src/progression/ceremonies/` | Async orchestration: validate → reveal → animate → unlock |
| localStorage Adapter | `src/persistence/storage/` | Read/write localStorage with error handling |
| Serialization | `src/persistence/serialization/` | Baked formula metadata, gameboard layouts, progression |
| Zustand Store | `src/store/slices/` | Gameboard, palette, progression, settings slices |
| Undo/Redo | `src/store/middleware/` | History stack on gameboard state (capped at ~50) |
| UI Layout | `src/ui/layout/` | Full-screen gameboard + sidebar shell |
| Breadcrumbs | `src/ui/breadcrumbs/` | Nesting depth display (read-only, no click-to-jump) |
| Parameter Controls | `src/ui/controls/` | Mix mode dropdown, Delay subdivision, Threshold slider |
| Puzzle UI | `src/ui/puzzle/` | Input/output preview, target overlay, match indicator |
| Shared Types | `src/shared/types/` | Node, Wire, Port, Signal, GameboardState interfaces |
| Constants | `src/shared/constants/` | SIGNAL_CONFIG, WTS_CONFIG, VALIDATION_CONFIG |
| Logger | `src/shared/logger/` | Structured logger with namespaces and levels |
| Result Type | `src/shared/result/` | Result\<T, E\> for engine error handling |
| Math Utilities | `src/shared/math/` | Clamp, interpolation, waveform generators |
| Debug Tools | `src/debug/` | Graph inspector, tick debugger, bake inspector, level skip |

### Naming Conventions

#### Files

| File Type | Convention | Example |
|-----------|-----------|---------|
| Source files | `kebab-case.ts` | `topological-sort.ts`, `waveform-generators.ts` |
| React components | `PascalCase.tsx` | `PalettePanel.tsx`, `BreadcrumbBar.tsx` |
| CSS Modules | `ComponentName.module.css` | `PalettePanel.module.css` |
| Test files | Match source file + `.test` | `topological-sort.test.ts`, `PalettePanel.test.tsx` |
| Barrel exports | `index.ts` | Public API per directory |

#### Code Elements

| Element | Convention | Example |
|---------|-----------|---------|
| Interfaces/Types | PascalCase | `NodeState`, `WireConfig`, `GameboardState` |
| Functions | camelCase | `evaluateNode()`, `bakeFormula()`, `advanceTick()` |
| React Components | PascalCase | `PalettePanel`, `WaveformDisplay` |
| Variables | camelCase | `activeBoard`, `signalValue`, `tickCount` |
| Constants | UPPER_SNAKE_CASE | `SIGNAL_CONFIG`, `MAX_HISTORY_DEPTH` |
| Zustand slices | camelCase | `gameboardSlice`, `paletteSlice` |
| Enum values | PascalCase | `MixMode.Add`, `MixMode.Subtract` |
| Type parameters | Single uppercase | `Result<T, E>` |

#### Game-Specific

| Element | Convention | Example |
|---------|-----------|---------|
| Node type IDs | kebab-case strings | `"multiply"`, `"mix"`, `"low-pass-filter"` |
| Level IDs | `level-NN` | `"level-01"`, `"level-12"` |
| Store actions | verb-first camelCase | `addNode`, `connectWire`, `completeLevel` |
| Debug namespaces | PascalCase | `Graph`, `WTS`, `Bake`, `Render`, `Save`, `UI` |

### Architectural Boundaries

- **Engine isolation:** `src/engine/` and `src/wts/` contain pure TypeScript logic with zero React or Canvas imports. They are testable in complete isolation.
- **Unidirectional data flow:** Domains never import from each other laterally. All inter-domain communication flows through `src/store/`. Actions update the store; subscribers react.
- **Rendering boundary:** Only `src/gameboard/` reads from the store inside a `requestAnimationFrame` loop. React components in `src/ui/` use standard Zustand hooks.
- **Shared imports:** Any domain may import from `src/shared/`. Nothing else is shared laterally.
- **Debug gate:** Everything in `src/debug/` is guarded by `import.meta.env.DEV` and tree-shaken from production builds.

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents.

### Novel Patterns

#### Formula Baking Pipeline

**Purpose:** Collapse a live node graph into an instant-evaluation form that preserves relative timing behavior through internal buffers.

**Trigger Points:**
- Puzzle completion (validation passes → bake → add to palette)
- Utility node save (user saves → bake → update library)
- Game load (deserialize metadata → reconstruct baked nodes)

**Baking Process:**
1. Walk the graph in topological order
2. For each path from input port to output port, accumulate total delay (wire count × 16 ticks + Delay node parameter values)
3. Normalize delays by subtracting the minimum path delay (shortest path = 0 buffer)
4. Compose fundamental node operations into a single math function
5. Record per-input buffer sizes (in game ticks)

**Data Structure:**

```typescript
interface BakedNode {
  /** Pure math: composed fundamental operations, no timing */
  evaluate: (inputs: number[]) => number[];
  /** Per-input-port buffer sizes in game ticks, after normalization */
  inputDelays: number[];
  /** Runtime state: circular buffers, pre-filled with 0 */
  buffers: CircularBuffer[];
  /** Serializable metadata for reconstruction on load */
  metadata: BakeMetadata;
}

interface BakeMetadata {
  /** Topological order of nodes in the source graph */
  topoOrder: NodeId[];
  /** Node types and parameters for each node */
  nodeConfigs: Map<NodeId, { type: string; params: Record<string, number> }>;
  /** Wiring: source port → target port */
  edges: Array<{ from: PortRef; to: PortRef }>;
  /** Accumulated delay per input path (for buffer reconstruction) */
  inputDelays: number[];
}
```

**Runtime Behavior on a Live Board:**
- Each game tick, input values are pushed into the corresponding circular buffers (pre-filled with 0, so output is valid from tick one)
- Buffers emit the value from N ticks ago (where N = that path's normalized delay)
- Once all buffered values are ready, `evaluate()` runs the composed math
- From the outside, the baked node behaves like any other node -- one tick per wire, but internal timing offsets are preserved via buffers

**Equivalence Contract:** For any graph, after the live version fully settles, its steady-state output must exactly match the baked version's output. This is the highest-priority automated test.

**Layout Preservation:** The source gameboard layout (node positions, wire paths) is stored separately alongside the baked data. This enables re-opening and editing the node's internals.

#### Gameboard Navigation & Puzzle Completion

**Purpose:** Manage navigation through a persistent tree of nested gameboards, with puzzle completion as a special zoom-out variant that gates progression.

**The Gameboard Tree:**

The game maintains a persistent tree structure (not a disposable stack). The root is the current puzzle. Each node instance on a gameboard owns a child gameboard, forming branches downward.

```typescript
interface GameboardTree {
  /** The root gameboard (current puzzle) */
  root: GameboardId;
  /** Currently active (rendered) gameboard */
  activeBoard: GameboardId;
  /** Parent lookup for zoom-out navigation */
  parentMap: Map<GameboardId, { board: GameboardId; nodeId: NodeId }>;
}
```

**Navigation Rules:**
- **Zoom in:** Click Edit on a node → push to its child gameboard (one level at a time)
- **Zoom out:** Click Done → return to parent gameboard (one level at a time)
- No skip-to-root shortcut; player navigates manually
- Breadcrumbs display nesting depth (read-only indicator, not clickable navigation)

**GDD Deviations:**

The following are deliberate design decisions that differ from the GDD:

| GDD Spec | Architecture Decision | Rationale |
|----------|----------------------|-----------|
| "Return to Puzzle" button (skip to root) | Removed. One-level-at-a-time navigation only. | Reinforces the fractal nesting mental model; skipping levels undermines spatial awareness of where you are in the tree |
| Breadcrumb click-to-jump | Breadcrumbs are read-only depth indicators | Same rationale; navigation is always one level via Edit/Done |
| "Submit" button for puzzle validation | Continuous validation with streak counter (no Submit button) | Real-time feedback is more engaging; 2-cycle streak threshold replaces explicit submission |

**Node Instance Model:**

Every node placed on a gameboard is a unique, editable deep copy from the palette library:

```typescript
interface NodeInstance {
  instanceId: string;
  /** Node type from library */
  libraryNodeType: string;
  /** Hash of the library version at time of placement/last sync */
  libraryVersionHash: string;
  /** This instance's internal gameboard (deep copy) */
  internalBoard: GameboardState;
  /** Baked evaluation data */
  baked: BakedNode;
  /** Position on parent gameboard */
  position: Vec2;
  /** Parameters (Mix mode, Threshold value, etc.) */
  params: Record<string, number | string>;
}
```

**Modified Detection:**
- Each library entry has a version hash, updated on every save
- Each placed instance stores the library version hash from placement time
- Comparison: `instance.libraryVersionHash !== library.currentVersionHash` → show modified indicator
- If another instance overwrites the library, previously-matching instances become "modified" without being touched

**Save Semantics:**

| Node Type | Save Trigger | Name | Library Effect |
|-----------|-------------|------|----------------|
| Utility node | Player clicks Save | Player chooses: keep name (overwrite) or rename (new entry) | Updates library entry; other instances' version hashes become stale |
| Puzzle node | Validation passes while editing | Fixed puzzle name only | **Hot-replaces all active instances** across all gameboards with new library version |

**Puzzle node hot-replacement is safe** because validation guarantees functional equivalence -- the node passes all test waveforms, so replacing instances won't break other boards.

**Puzzle Completion Flow:**

| Step | First Completion | Subsequent Completion |
|------|-----------------|----------------------|
| All outputs match target for 2 cycles | Victory triggers | Victory detected |
| Name/description revealed | Yes | No (already known) |
| Save prompt | Automatic save to palette | "Save new solution?" or "Keep current" |
| Zoom-out animation | Forced, automatic | Only if player chooses to save |
| Hot-replace instances | n/a (first time) | Yes, if saved |
| Next puzzle loads | Yes, new root with completed node in center | No, player continues normally |

**Continuous Validation (no Submit button):**
- Every tick, the engine compares actual output to target output per port
- Visual feedback: each output port shows correct/incorrect in real time
- Streak counter: tracks consecutive ticks where all outputs match within ±5 tolerance
- Victory threshold: streak reaches 2 full waveform cycles
- **Any graph mutation (wire edit, node move, zoom navigation) resets the streak to zero**

### Communication Patterns

**Pattern:** Zustand store as central bus

- **Canvas → Store:** User interactions call `store.getState().actionName()` directly
- **Store → Canvas:** rAF loop calls `store.getState()` each frame (direct read, no subscription)
- **React → Store:** `useStore(selector)` hooks for reads, store actions for writes
- **Store → React:** Automatic re-render via Zustand hook subscriptions

```typescript
// Canvas reading state each frame
function renderLoop() {
  const { nodes, wires, activeBoard } = useGameStore.getState();
  drawGameboard(ctx, nodes, wires);
  requestAnimationFrame(renderLoop);
}

// Canvas writing state on interaction
function handleCanvasClick(e: MouseEvent) {
  const hit = hitTest(e.x, e.y);
  if (hit.type === 'port') {
    useGameStore.getState().startWireDraw(hit.portId);
  }
}

// React component reading state
function PalettePanel() {
  const nodes = useGameStore((s) => s.paletteNodes);
  return <div>{nodes.map(renderPaletteItem)}</div>;
}
```

### Entity Patterns

**Creation:** Deep clone from palette library

```typescript
function placeNode(libraryId: string, position: Vec2): NodeInstance {
  const libraryEntry = getLibraryEntry(libraryId);
  return {
    instanceId: generateId(),
    libraryNodeType: libraryId,
    libraryVersionHash: libraryEntry.versionHash,
    internalBoard: deepClone(libraryEntry.gameboard),
    baked: reconstructBakedNode(libraryEntry.bakeMetadata),
    position,
    params: { ...libraryEntry.defaultParams },
  };
}
```

Fundamental nodes (Multiply, Mix, Invert, Threshold, Delay) have no internal gameboard -- they are leaf nodes with only an `evaluate` function and parameters.

### State Patterns

**Pattern:** Enum discriminated unions + switch

```typescript
type InteractionMode =
  | { type: 'idle' }
  | { type: 'placing-node'; nodeType: string }
  | { type: 'drawing-wire'; fromPort: PortId }
  | { type: 'dragging-node'; nodeId: NodeId; offset: Vec2 };

type ValidationState =
  | { type: 'inactive' }
  | { type: 'evaluating' }
  | { type: 'streak'; tickCount: number }
  | { type: 'victory' };

type ZoomTransition =
  | { type: 'live' }
  | { type: 'snapshot-captured'; image: OffscreenCanvas }
  | { type: 'animating'; progress: number }
  | { type: 'arriving' };
```

State stored in Zustand. Transitions are store actions. Current state drives rendering logic via switch statements.

### Data Patterns

**Access:** Direct imports + Zustand store

| Data Type | Access Method | Location |
|-----------|--------------|----------|
| Game constants | `import { SIGNAL_CONFIG } from 'shared/constants'` | `src/shared/constants/` |
| Level definitions | `import { level01 } from 'progression/levels'` | `src/progression/levels/` |
| Runtime state | `useGameStore(selector)` or `useGameStore.getState()` | `src/store/` |
| Persisted saves | `persistence.load()` / `persistence.save()` | `src/persistence/storage/` |

No service locator or data manager. Constants are imports, runtime is store, saves go through the persistence adapter.

### Consistency Rules

| Pattern | Convention | Enforcement |
|---------|-----------|-------------|
| All signal values | Clamped to [-100, +100] after every operation | `clamp()` from `shared/math/` wraps all node evaluate outputs |
| Node IDs | Generated via `crypto.randomUUID()` | Single `generateId()` function in `shared/` |
| Port references | `{ nodeId: string, portIndex: number, side: 'input' \| 'output' }` | `PortRef` type in `shared/types/` |
| Store actions | verb-first camelCase, synchronous unless ceremony | All defined in slice files, never inline |
| Error results | `Result<T, E>` for engine functions | Engine functions never throw; UI boundary functions use try-catch |
| Waveform generators | Pure functions `(t: number, ...params) => number` | All in `shared/math/`, return unclamped (caller clamps if needed) |

## Architecture Validation

### Validation Summary

| Check | Result | Notes |
|-------|--------|-------|
| Decision Compatibility | PASS | All 8 decisions (Zustand, Canvas 2D, symbolic baking, etc.) are mutually compatible |
| GDD Coverage | PASS | All 10 core systems and all technical requirements have architectural support |
| Pattern Completeness | PASS | 6/6 pattern categories defined with concrete examples |
| Epic Mapping | N/A | No epics document yet; System Location Mapping (24 entries) covers implementation guidance |
| Document Completeness | PASS | All mandatory sections present; no placeholder text |

### Coverage Report

**Systems Covered:** 10/10
**Patterns Defined:** 7 (Formula Baking, Gameboard Navigation, Communication, Entity, State, Data, Consistency)
**Decisions Made:** 8

### Issues Resolved

- **Navigation scope**: GDD specifies breadcrumb click-to-jump and "Return to Puzzle" button. Architecture intentionally restricts to one-level-at-a-time navigation. Documented as deliberate deviation in GDD Deviations table.
- **Breadcrumb description**: Updated from "click-to-navigate" to "read-only, no click-to-jump" in System Location Mapping.
- **Validation model**: GDD mentions Submit button. Architecture uses continuous validation with 2-cycle streak counter. Documented as deliberate deviation.

### Validation Date

2026-02-02

## Development Environment

### Prerequisites

- Node.js 22 LTS
- npm 10+

### AI Tooling (MCP Servers)

The following MCP server was selected during architecture to enhance AI-assisted development:

| MCP Server | Purpose | Install Type |
|------------|---------|-------------|
| Context7 (upstash/context7) | Up-to-date, version-specific docs for React, TypeScript, Canvas API, and other libraries | npx |

**Setup:**

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

This gives your AI assistant direct access to current library documentation for context-aware code generation.

### Setup Commands

```bash
npm create vite@latest logic-puzzle -- --template react-ts
cd logic-puzzle
npm install zustand
npm install -D vitest
```

### First Steps

1. Run project initialization commands above
2. Define foundational types in `src/shared/types/` (`Node`, `Wire`, `PortRef`, `Signal`, `GameboardState`)
3. Configure Context7 MCP server per the AI Tooling instructions above
4. Implement fundamental node evaluation functions in `src/engine/nodes/` with Vitest tests
