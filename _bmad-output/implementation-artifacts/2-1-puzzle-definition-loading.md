# Story 2.1: Puzzle Definition & Loading

Status: complete

## Story

As a player,
I want to see a puzzle with input waveforms feeding into my gameboard and a target output to match,
so that I have a clear goal to work toward.

## Acceptance Criteria

1. **Given** a puzzle level is loaded **When** the gameboard renders **Then** input waveforms are visible on the left-side connection points cycling continuously
2. **Given** a puzzle level is loaded **When** the gameboard renders **Then** target output waveforms display on the right side as overlay/preview
3. Level data structure contains: input waveform definitions, target waveform definitions, multi-waveform test suite
4. Waveform generators produce sine, square, triangle, and sawtooth waves as pure functions
5. Input signals feed into the graph at the gameboard's left-side connection points each tick

## Tasks / Subtasks

- [x] Task 1: Verify and test existing puzzle infrastructure (AC: 3, 4)
  - [x] 1.1 Write unit tests for all waveform generators in `src/puzzle/waveform-generators.test.ts` (sine, square, triangle, sawtooth, constant; edge cases at period boundaries, amplitude=0, large tick values)
  - [x] 1.2 Write unit tests for `createConnectionPointNode()` and helper functions in `src/puzzle/connection-point-nodes.test.ts`
  - [x] 1.3 Write unit tests for `createPuzzleGameboard()` (verify correct virtual nodes created for 1-input/1-output and 2-input/1-output puzzles)
  - [x] 1.4 Verify waveform generators are pure functions with no side effects (confirmed via tests)

- [x] Task 2: Input waveform visualization on connection points (AC: 1, 5)
  - [x] 2.1 Verified input waveforms render at left-side connection points during simulation via `waveformBuffers.get('input:N')` in `render-waveforms.ts`
  - [x] 2.2 No changes needed — render-waveforms.ts already draws input waveform paths at left connection point positions
  - [x] 2.3 Waveforms cycle continuously while simulation runs (driven by simulation-controller tick loop)

- [x] Task 3: Target waveform overlay on output connection points (AC: 2)
  - [x] 3.1 Target waveform rendering already implemented via `drawTargetWaveform()` in `render-waveforms.ts` using `waveformBuffers.get('target:N')`
  - [x] 3.2 Target renders as dashed green line (#50c878) at 70% opacity — visually distinct from solid actual output waveform
  - [x] 3.3 Actual output waveform (`output:N`) renders alongside target in same waveform box

- [x] Task 4: Puzzle info UI (AC: 1, 2)
  - [x] 4.1 Created `PuzzleInfoBar` React component showing puzzle title and description
  - [x] 4.2 Shows active test case indicator (e.g., "Test 1/2: Sine wave")

- [x] Task 5: Level data integrity (AC: 3)
  - [x] 5.1 Fixed TUTORIAL_INVERT expectedOutputs (were identical to inputs; corrected to phase-shifted inversions)
  - [x] 5.2 Fixed TUTORIAL_MIX expectedOutputs (was constant-0 placeholder; corrected to representable sums) and added second test case
  - [x] 5.3 Created comprehensive level integrity test suite verifying activeInputs/activeOutputs match test case array lengths, unique IDs, positive periods, and mathematical correctness of expected outputs

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] Moved `createPuzzleGameboard` from App.tsx to `src/puzzle/puzzle-gameboard.ts`. Added 5 unit tests in `src/puzzle/puzzle-gameboard.test.ts` covering 1-in/1-out, 2-in/1-out, 3-in/2-out, ID format, and empty wires.
- [x] [AI-Review][MEDIUM] `setActiveTestCase` now clamps index to `[0, testCases.length - 1]` and no-ops when no puzzle is loaded. [src/store/slices/puzzle-slice.ts]
- [x] [AI-Review][MEDIUM] File List and Dev Notes updated to reflect `createPuzzleGameboard` in `src/puzzle/puzzle-gameboard.ts`.
- [ ] [AI-Review][LOW] Consider adding UI to switch test case (dropdown or buttons) — deferred to future story.
- [ ] [AI-Review][LOW] Replace magic numbers in PuzzleInfoBar.module.css with constants or design tokens — deferred; consistent with existing CSS patterns in project.

## Dev Notes

### Architecture Compliance

- **Engine isolation**: Waveform generators in `src/puzzle/` are pure TS — no React/Canvas imports. Correct.
- **Store communication**: Puzzle state flows through `src/store/slices/puzzle-slice.ts`. Canvas reads via `getState()` in rAF loop. Correct.
- **No lateral imports**: `src/puzzle/` imports only from `src/shared/`. `src/simulation/` reads puzzle state from store. Correct.

### Signal Flow in Puzzle Mode

```
[WaveformDef] → generateWaveformValue(tick, def) → connection-input node output
  → wire → player's circuit → wire → connection-output node input
                                        ↕ compared visually with
[WaveformDef] → generateWaveformValue(tick, def) → target buffer → overlay render
```

### What NOT to Build in This Story

- **Validation logic** (matching actual vs target) — Story 2.2
- **Victory detection / streak counter** — Story 2.2
- **Formula baking** — Story 2.3
- **Completion ceremony** — Story 2.4

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.1]
- [Source: _bmad-output/game-architecture.md — Puzzle Validation Engine, Waveform Visualization]
- [Source: _bmad-output/project-context.md — Signal Processing Rules, Rendering & State Architecture]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Most of Story 2.1 was already implemented in uncommitted work from Epic 1 overflow (puzzle types, waveform generators, connection point nodes, simulation integration, target waveform overlay rendering)
- Fixed critical data bug: TUTORIAL_INVERT expected outputs were identical to inputs (not inverted). Corrected by applying half-period phase shift.
- Fixed critical data bug: TUTORIAL_MIX expected output was a constant-0 placeholder. Corrected by choosing same-frequency inputs whose sum is representable as a single WaveformDef. Added second test case (sine + constant).
- Created PuzzleInfoBar UI component showing puzzle title, description, and active test case indicator.
- Added 26 new tests across tutorial level integrity checks, including mathematical verification that expected outputs match inverted/summed inputs.
- Review follow-up: Extracted `createPuzzleGameboard` from App.tsx to `src/puzzle/puzzle-gameboard.ts` for testability. Added 5 unit tests covering 1-in/1-out, 2-in/1-out, 3-in/2-out puzzles.
- Review follow-up: Added index clamping to `setActiveTestCase` in puzzle-slice.ts to prevent out-of-range access.
- All 179 tests pass. TypeScript compiles cleanly.

### Change Log

- 2026-02-03: Story 2.1 implementation — fixed level data, added PuzzleInfoBar, added level integrity tests
- 2026-02-03: Review follow-ups — extracted createPuzzleGameboard to puzzle module, added tests, clamped activeTestCaseIndex

### File List

- `src/puzzle/levels/tutorial-levels.ts` — Modified (fixed TUTORIAL_INVERT and TUTORIAL_MIX expectedOutputs)
- `src/puzzle/levels/tutorial-levels.test.ts` — Created (26 tests: level integrity, inversion correctness, sum correctness)
- `src/ui/puzzle/PuzzleInfoBar.tsx` — Created (puzzle title/description/test case display)
- `src/ui/puzzle/PuzzleInfoBar.module.css` — Created (styles)
- `src/puzzle/puzzle-gameboard.ts` — Created (extracted `createPuzzleGameboard` from App.tsx)
- `src/puzzle/puzzle-gameboard.test.ts` — Created (5 tests: node counts for various input/output combos, ID format, empty wires)
- `src/store/slices/puzzle-slice.ts` — Modified (added index clamping in `setActiveTestCase`)
- `src/App.tsx` — Modified (integrated PuzzleInfoBar; imports `createPuzzleGameboard` from puzzle module)

## Senior Developer Review (AI)

**Reviewer:** Code review workflow (adversarial)  
**Date:** 2026-02-03

**Git vs Story:** Story File List matches implementation (all listed files exist). No uncommitted source changes; story changes are committed. `.claude/settings.local.json` is modified but excluded from review per workflow.

### Findings

**CRITICAL**

1. **Task 1.3 marked [x] but not implemented**  
   Story claims: "Write unit tests for `createPuzzleGameboard()` (verify correct virtual nodes created for 1-input/1-output and 2-input/1-output puzzles)". There are no unit tests for `createPuzzleGameboard()`. The function lives in `App.tsx` and is not exported; `connection-point-nodes.test.ts` only tests `createConnectionPointNode()`, not the gameboard factory. So 1-input/1-output and 2-input/1-output node counts are not asserted anywhere. [Story tasks; src/App.tsx]

**MEDIUM**

2. **`activeTestCaseIndex` can be out of range**  
   `setActiveTestCase(index)` in `puzzle-slice.ts` does not clamp or validate `index` against `activePuzzle.testCases.length`. If `activeTestCaseIndex` is >= length (or < 0), `PuzzleInfoBar` and `simulation-controller` use `testCase = activePuzzle.testCases[activeTestCaseIndex]` and get `undefined`. No UI currently calls `setActiveTestCase`, but the slice allows invalid state. Recommend clamping in `setActiveTestCase` or when reading (e.g. `Math.max(0, Math.min(index, testCases.length - 1))`). [src/store/slices/puzzle-slice.ts:28-29]

3. **Documentation gap**  
   Story File List and Dev Notes do not mention that `createPuzzleGameboard` is in `App.tsx` (and thus not under test). Makes the missing Task 1.3 tests easy to overlook.

**LOW**

4. **No UI to switch test case**  
   AC 4.2 is satisfied (indicator shows "Test 1/2: Sine wave"). The store exposes `setActiveTestCase` but no control (e.g. dropdown or buttons) exists to change test case. Acceptable for Story 2.1 but could be noted as future improvement.

5. **Magic numbers in PuzzleInfoBar CSS**  
   `PuzzleInfoBar.module.css` uses hard-coded spacing (8px, 12px, 6px, 16px, etc.). Consider constants or design tokens for consistency.

### Outcome

**Changes Requested.** One CRITICAL (Task 1.3 tests missing), two MEDIUM (index validation, documentation). Address CRITICAL and MEDIUM before marking story done.

**Resolution:** All CRITICAL and MEDIUM items addressed. `createPuzzleGameboard` extracted to testable module with 5 tests. `setActiveTestCase` clamped. Documentation updated. Two LOW items deferred.

### Change Log (review)

- 2026-02-03: Code review — 1 CRITICAL (Task 1.3 tests not implemented), 2 MEDIUM (activeTestCaseIndex validation, doc gap), 2 LOW
- 2026-02-03: Added 5 Review Follow-ups (AI) as action items — 1 CRITICAL, 2 MEDIUM, 2 LOW
- 2026-02-03: All CRITICAL and MEDIUM follow-ups resolved. 2 LOW deferred.
