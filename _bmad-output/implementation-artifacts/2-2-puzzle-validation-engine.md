# Story 2.2: Puzzle Validation Engine

Status: complete

## Story

As a player,
I want real-time feedback showing whether my output matches the target,
So that I can iteratively adjust my solution without guessing.

## Acceptance Criteria

1. **Given** signals reach the gameboard's output ports **When** each tick completes **Then** each output port shows a correct/incorrect indicator comparing actual vs target
2. Match tolerance is +/-5 units
3. A streak counter tracks consecutive ticks where ALL outputs match within tolerance
4. Victory triggers when streak reaches 2 full waveform cycles
5. Any graph mutation (wire add/remove, node add/remove/move, parameter change) resets the streak to zero
6. Validation runs against the full multi-waveform test suite (not just the displayed waveform)

## Tasks / Subtasks

- [x] Task 1: Core validation functions (AC: 1, 2)
  - [x] 1.1 Implement `validatePort(actual, target, tolerance)` — single port match within +/-5
  - [x] 1.2 Implement `validateAllPorts(actuals, targets, tolerance)` — returns `{allMatch, perPort[]}`
  - [x] 1.3 Write unit tests for validatePort (exact match, boundary, exceed, negatives, zero tolerance)
  - [x] 1.4 Write unit tests for validateAllPorts (all match, partial, none, empty, length mismatch, single)

- [x] Task 2: Victory threshold calculation (AC: 4)
  - [x] 2.1 Implement `getVictoryThreshold(testCase)` — returns `VICTORY_CYCLES * max(period)`
  - [x] 2.2 Write unit tests (single output, multiple outputs uses max, empty, equal periods)

- [x] Task 3: Validation state in puzzle store (AC: 3, 5)
  - [x] 3.1 Add `validationStreak`, `perPortMatch`, `puzzleStatus`, `testCasesPassed` to PuzzleSlice
  - [x] 3.2 Implement `updateValidation(perPortMatch, allMatch, victoryThreshold)` — increments or resets streak, marks test cases passed
  - [x] 3.3 Implement `resetValidationStreak()` — resets streak to 0
  - [x] 3.4 Implement `advanceTestCase()` — finds next unpassed test case or sets puzzleStatus to 'victory'

- [x] Task 4: Graph mutation detection (AC: 5)
  - [x] 4.1 Add `graphVersion` counter to GameboardSlice, incremented on addNode/removeNode/addWire/removeWire/updateNodeParams/setPortConstant
  - [x] 4.2 Track `lastGraphVersion` in simulation-controller; reset streak when version changes

- [x] Task 5: Simulation loop integration (AC: 1, 6)
  - [x] 5.1 Implement `validateTick()` in simulation-controller — runs each tick during puzzle mode
  - [x] 5.2 Gather actual output CP values from scheduler state
  - [x] 5.3 Generate target values for current tick via `generateWaveformValue`
  - [x] 5.4 Call `validateAllPorts` and `updateValidation` each tick
  - [x] 5.5 Auto-advance: when test case passes, stop simulation, advance to next test case, restart

- [x] Task 6: Per-port visual feedback (AC: 1)
  - [x] 6.1 Read `perPortMatch` from store in `renderConnectionPoints`
  - [x] 6.2 Draw green glow ring (#50c878) on matching output CPs, red glow ring (#e05050) on mismatched
  - [x] 6.3 Only show validation glow when simulation is running and puzzle is active

- [x] Task 7: PuzzleInfoBar validation display (AC: 3, 6)
  - [x] 7.1 Display streak counter with progress toward victory threshold
  - [x] 7.2 Display test cases passed count (e.g., "Tests: 1/2 passed")
  - [x] 7.3 Display "Puzzle Complete!" on victory

## Dev Notes

### Architecture Compliance

- **Engine isolation**: Validation functions in `src/puzzle/validation.ts` are pure TS — no React/Canvas imports. Correct.
- **Store communication**: Validation state flows through `src/store/slices/puzzle-slice.ts`. Canvas reads via `getState()` in rAF loop. Correct.
- **No lateral imports**: `src/puzzle/` imports only from `src/shared/`. Simulation reads puzzle/validation from store. Correct.

### Validation Flow

```
[Each tick]
  simulation-controller.validateTick()
    → gather actual output CP values from scheduler runtime state
    → generate expected values from waveform definitions
    → validateAllPorts(actuals, targets, tolerance=5)
    → store.updateValidation(perPort, allMatch, victoryThreshold)
    → if test case passed: stop sim → advanceTestCase() → restart sim

[Graph mutation detected]
  graphVersion changed → resetValidationStreak()

[Rendering]
  render-connection-points reads perPortMatch → green/red glow rings
  PuzzleInfoBar reads validationStreak, testCasesPassed, puzzleStatus
```

### Multi-Waveform Test Suite Flow

When a test case's streak reaches the victory threshold, that test case index is added to `testCasesPassed`. The simulation stops, `advanceTestCase()` finds the next unpassed index, and the simulation restarts with the new test case. When all test cases pass, `puzzleStatus` transitions to `'victory'`.

### What NOT to Build in This Story

- **Formula baking** — Story 2.3
- **Completion ceremony / zoom-out animation** — Story 2.4
- **Palette node addition** — Story 2.4
- **Test case switching UI** — deferred (auto-advance handles progression)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.2]
- [Source: _bmad-output/game-architecture.md — Puzzle Validation Engine]
- [Source: _bmad-output/project-context.md — Signal Processing Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented 3 pure validation functions (validatePort, validateAllPorts, getVictoryThreshold) with 17 unit tests.
- Extended PuzzleSlice with validation state: validationStreak, perPortMatch, puzzleStatus, testCasesPassed, plus updateValidation, resetValidationStreak, advanceTestCase actions.
- Added graphVersion counter to GameboardSlice, incremented on every structural mutation (6 mutation actions). Simulation controller tracks version for streak reset.
- Integrated validateTick() into simulation loop — runs every tick, auto-advances test cases on pass.
- Added per-port green/red glow rings on output connection points via Canvas shadow rendering.
- Extended PuzzleInfoBar to show streak progress, tests passed, and victory status.
- All 219 tests pass. TypeScript compiles cleanly.

### Change Log

- 2026-02-03: Story 2.2 implementation — validation engine, store integration, visual feedback

### File List

- `src/puzzle/validation.ts` — Created (validatePort, validateAllPorts, getVictoryThreshold)
- `src/puzzle/validation.test.ts` — Created (17 tests: port matching, multi-port, victory threshold)
- `src/store/slices/puzzle-slice.ts` — Modified (added validationStreak, perPortMatch, puzzleStatus, testCasesPassed, updateValidation, resetValidationStreak, advanceTestCase)
- `src/store/slices/gameboard-slice.ts` — Modified (added graphVersion counter, incremented in 6 mutation actions)
- `src/simulation/simulation-controller.ts` — Modified (added validateTick, graph mutation detection, auto-advance test cases)
- `src/gameboard/canvas/render-connection-points.ts` — Modified (added per-port green/red glow ring rendering)
- `src/ui/puzzle/PuzzleInfoBar.tsx` — Modified (added streak counter, tests passed, victory display)
- `src/ui/puzzle/PuzzleInfoBar.module.css` — Modified (added styles for streak, testsPassed, victory)
