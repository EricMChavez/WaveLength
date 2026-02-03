---
project_name: 'logic-puzzle'
user_name: 'Eric Chavez'
date: '2026-02-02'
sections_completed: ['technology_stack', 'engine_rules', 'performance_rules', 'organization_rules', 'testing_rules', 'platform_rules', 'anti_patterns']
status: 'complete'
rule_count: 34
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing the Signal Processing Puzzle Game. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Role |
|-----------|---------|------|
| React | 19.2.4 | UI chrome (palette, breadcrumbs, controls, modals) |
| TypeScript | 5.9.3 | All source code |
| Vite | 7.3.1 | Dev server, HMR, production bundling |
| Zustand | 5.0.10 | State management bridge between React and Canvas |
| Canvas 2D API | Native | Gameboard rendering (nodes, wires, waveforms) |
| CSS Modules | Vite-native | Scoped styles for React UI chrome |
| Vitest | Latest | Testing (Vite-native, Jest-compatible API) |

---

## Critical Implementation Rules

### Rendering & State Architecture

- **Only one gameboard is live-evaluated at a time.** Nested boards are dormant baked formulas.
- **Canvas rAF loop reads Zustand via `getState()`**, not React hooks. React components use `useStore(selector)`.
- **Canvas writes state via `useGameStore.getState().actionName()`** -- direct store action calls from imperative code.
- **Full canvas redraw every frame.** Element count (dozens of nodes/wires) is within budget at 60fps. No partial invalidation needed.
- **Zoom transitions:** Departing board → offscreen canvas snapshot → animate snapshot → arriving board begins live rendering. Exactly one live board at all times.

### Engine Isolation & Boundaries

- **`src/engine/` and `src/wts/` must contain zero React or Canvas imports.** Pure TypeScript only. Testable in complete isolation.
- **No lateral imports between domains.** All inter-domain communication flows through `src/store/`. Actions update the store; subscribers react.
- **Only `src/gameboard/` reads store inside a rAF loop.** React components in `src/ui/` use standard Zustand hooks.
- **Any domain may import from `src/shared/`.** Nothing else is shared laterally.

### Signal Processing Rules

- **ALL signal values MUST be clamped to [-100, +100] after every node evaluation.** Use `clamp()` from `shared/math/`. No exceptions.
- **Unconnected inputs default to 0.** Nodes fire on each input update using latest values. Standard dataflow behavior.
- **Multiply outputs `(A * B) / 100`** to keep results in range. Not raw multiplication.
- **Waveform generators are pure functions `(t: number, ...params) => number`** returning unclamped values. Caller clamps if needed.

### Formula Baking

- **Baked nodes strip internal WTS delays** but preserve relative timing via per-input circular buffers (pre-filled with 0).
- **Equivalence contract:** For any graph, after live version fully settles, steady-state output must exactly match baked version output. Highest-priority automated test.
- **Baked function metadata is serializable.** Closure is reconstructed from metadata on load, not serialized directly.

### WTS Timing

- **1 WTS = 1 second base rhythm, 16 subdivisions.** Only active board wires carry WTS delay.
- **Wire state doubles as animation state** (`{value, ticksRemaining}` entries). Do not create separate animation data structures for signal pulses.
- **Topological sort determines evaluation order**, re-sorted on graph edit. Cycle detection is mandatory.

### Validation & Progression

- **Continuous validation, no Submit button.** Every tick, engine compares actual output to target per port.
- **Victory: streak of all outputs matching within +/-5 tolerance sustained for 2 full waveform cycles.** Any graph mutation resets streak to zero.
- **Puzzle node save hot-replaces all active instances** across all gameboards (safe because validation guarantees functional equivalence).
- **Utility node save:** Player chooses keep name (overwrite library entry) or rename (new entry). Other instances' version hashes become stale.

### Navigation (GDD Deviations)

- **No "Return to Puzzle" button.** One-level-at-a-time navigation only (Edit to zoom in, Done to zoom out).
- **Breadcrumbs are read-only depth indicators**, not clickable navigation. No skip-to-root or jump-to-level.

### Error Handling

- **Engine functions return `Result<T, E>`, never throw.** Typed, composable, testable.
- **Browser API boundaries (Canvas, localStorage) use try-catch.**
- **Errors never crash the game.** Worst case: frozen waveform with visual error indicator.
- **Invalid user actions prevented in UI** before reaching the engine.

### Undo/Redo

- **Wire connect (click source + click target) counts as one undoable action**, not two. Same for other multi-step interactions forming one logical edit.
- **History depth capped at ~50 entries.** Full gameboard state snapshots, not reverse-action diffs.

### IDs & References

- **Node IDs generated via `crypto.randomUUID()` only.** Single `generateId()` function in `shared/`.
- **Port references: `{ nodeId: string, portIndex: number, side: 'input' | 'output' }`** via `PortRef` type.

---

## Code Organization Rules

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Source files | `kebab-case.ts` | `topological-sort.ts` |
| React components | `PascalCase.tsx` | `PalettePanel.tsx` |
| CSS Modules | `ComponentName.module.css` | `PalettePanel.module.css` |
| Tests | Source file + `.test` | `topological-sort.test.ts` |
| Barrel exports | `index.ts` | Public API per directory |

### Code Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Types/Interfaces | PascalCase | `NodeState`, `GameboardState` |
| Functions | camelCase | `evaluateNode()`, `bakeFormula()` |
| Variables | camelCase | `activeBoard`, `signalValue` |
| Constants | UPPER_SNAKE_CASE | `SIGNAL_CONFIG`, `MAX_HISTORY_DEPTH` |
| Store actions | verb-first camelCase | `addNode`, `connectWire` |
| Node type IDs | kebab-case strings | `"multiply"`, `"low-pass-filter"` |
| Level IDs | `level-NN` | `"level-01"` |

### Configuration

- **Game-design-fixed values → TypeScript const objects** (`SIGNAL_CONFIG`, `WTS_CONFIG`, `VALIDATION_CONFIG`)
- **Player-changeable settings → Zustand store** (persisted to localStorage)

---

## Testing Rules

### Priority Order (highest first)

1. **Fundamental node operations** -- each type with edge cases (-100, 0, +100, overflow clamping). Pure functions, 100% coverage.
2. **Topological sort** -- including cycle detection and prevention.
3. **Formula baking equivalence** -- `bakedFunction(inputs) === liveGraphEvaluation(inputs)` for any graph.
4. **WTS tick accuracy** -- signals arrive at correct subdivisions, no off-by-one.
5. **Lower priority:** localStorage serialization, undo stack, React components.

### Testing Patterns

- Engine tests are pure TS logic -- no DOM, no Canvas, no React.
- Co-locate test files with source: `topological-sort.test.ts` next to `topological-sort.ts`.
- Integration tests spanning multiple domains go in `tests/` root directory.

---

## Platform & Build Rules

- **Web browser only.** No server, no native targets.
- **Debug tools gated behind `import.meta.env.DEV`** -- tree-shaken from production by Vite.
- **localStorage for all persistence** (JSON serialization). Total footprint well under 1MB.
- **CSS custom properties for theming.** No runtime CSS-in-JS.

---

## Critical Anti-Patterns

- **DO NOT** create separate event bus or pub/sub system. Zustand state change IS the event.
- **DO NOT** import between domains laterally. Route everything through `src/store/`.
- **DO NOT** use React hooks or lifecycle in `src/engine/` or `src/wts/`. Pure TS only.
- **DO NOT** forget to clamp signal values after node evaluation. Every. Single. Time.
- **DO NOT** serialize closures. Baked function metadata is serialized; closures are reconstructed.
- **DO NOT** create separate animation state for wire signals. Wire state IS animation state.
- **DO NOT** evaluate dormant (non-active) gameboards. Only the active board runs.
- **DO NOT** allow circular node references. Cycle detection must run on every graph edit.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any game code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Reference `_bmad-output/game-architecture.md` for full architectural details

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-02
