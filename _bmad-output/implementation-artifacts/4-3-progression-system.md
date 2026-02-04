# Story 4.3: Progression System

Status: done

## Story

As a player,
I want to progress through levels in order, with each completed puzzle unlocking the next,
so that the game has a clear path forward and my toolkit grows predictably.

## Acceptance Criteria

1. **Given** the player completes a puzzle, **When** the ceremony finishes, **Then** the next level loads automatically
2. **Given** the game tracks progression, **Then** state includes: completed levels (`Set<string>`), unlocked puzzle node IDs, current level index
3. **Given** the palette renders, **Then** it reflects full 3-section progression: Fundamental (always), Puzzle (grows with completions), Utility (player-managed)
4. **Given** a previously completed level, **When** the player selects it, **Then** they can replay it (re-solve flow with `ceremonyIsResolve: true`)
5. **Given** the game initializes, **When** progression state exists, **Then** the current level resumes (not always level 0)
6. **Given** a puzzle has `allowedNodes` constraints, **Then** only fundamental nodes + unlocked puzzle nodes matching allowedNodes are placeable

## Tasks / Subtasks

- [x] Task 1: Create progression-slice in Zustand store (AC: #2, #5)
  - [x] 1.1 Define `ProgressionSlice` interface: `completedLevels: Set<string>`, `currentLevelIndex: number`
  - [x] 1.2 Implement `completeLevel(puzzleId: string)` action — adds to completedLevels, advances currentLevelIndex
  - [x] 1.3 Implement `setCurrentLevel(index: number)` for replay navigation
  - [x] 1.4 Implement `getUnlockedPuzzleIds()` derived helper — returns puzzle IDs completed so far
  - [x] 1.5 Implement `isLevelUnlocked(index: number)` — level 0 always unlocked, others require previous completion
  - [x] 1.6 Register slice in `src/store/index.ts` GameStore union
  - [x] 1.7 Write unit tests for all actions and derived state

- [x] Task 2: Integrate progression into puzzle completion flow (AC: #1, #2)
  - [x] 2.1 In CompletionCeremony `handleContinue`, call `completeLevel(puzzleId)` before advancing
  - [x] 2.2 Update `handleContinue` to use `currentLevelIndex + 1` from progression state (not index search)
  - [x] 2.3 Pass `ceremonyIsResolve: true` when `completedLevels.has(puzzleId)` is already true (re-solve detection)
  - [x] 2.4 Write test verifying completeLevel + advance flow

- [x] Task 3: Implement level selection for replay (AC: #4)
  - [x] 3.1 Add `LevelSelect` React component showing all 15 levels with locked/unlocked/completed status
  - [x] 3.2 Clicking an unlocked level calls `setCurrentLevel(index)` + loads that puzzle
  - [x] 3.3 Integrate LevelSelect into PalettePanel or NavigationBar area
  - [x] 3.4 Write test for level selection state transitions

- [x] Task 4: Palette filtering by allowedNodes + progression (AC: #3, #6)
  - [x] 4.1 Update PalettePanel to filter puzzle nodes: only show nodes whose puzzleId is in `completedLevels`
  - [x] 4.2 When `activePuzzle.allowedNodes` is non-null, filter palette to only show matching fundamental + puzzle types
  - [x] 4.3 Write test verifying palette filtering logic

- [x] Task 5: App initialization with progression state (AC: #5)
  - [x] 5.1 Update App.tsx `useEffect` to read `currentLevelIndex` from progression slice
  - [x] 5.2 Load `PUZZLE_LEVELS[currentLevelIndex]` instead of always `PUZZLE_LEVELS[0]`
  - [x] 5.3 Write test for initialization from saved progression

- [x] Task 6: Full integration test and regression check (AC: all)
  - [x] 6.1 Run `npx tsc --noEmit` — zero errors
  - [x] 6.2 Run `npx vitest run` — all tests pass, no regressions
  - [x] 6.3 Verify ceremony → progression → next level flow end-to-end

## Dev Notes

### Architecture Requirements

- **New Zustand slice**: `src/store/slices/progression-slice.ts` — follows exact pattern of existing slices (StateCreator, GameStore generic)
- **No new domains**: Progression state lives in the store, not a separate `src/progression/` domain. The store IS the single source of truth per project-context.md rules.
- **No lateral imports**: All inter-domain communication through `src/store/`. CompletionCeremony reads/writes store; palette reads store.
- **Engine isolation**: `src/engine/` and `src/wts/` remain untouched — pure TS, zero React/Canvas imports.

### Existing Code to Reuse (DO NOT REINVENT)

| Need | Existing Solution | File |
|------|------------------|------|
| Puzzle level registry | `PUZZLE_LEVELS` array, `getPuzzleById()` | `src/puzzle/levels/index.ts` |
| Puzzle loading | `loadPuzzle()`, `createPuzzleGameboard()` | `src/store/slices/puzzle-slice.ts`, `src/puzzle/puzzle-gameboard.ts` |
| Puzzle node storage | `puzzleNodes` Map, `addPuzzleNode()` | `src/store/slices/palette-slice.ts` |
| Ceremony flow | `startCeremony()`, `dismissCeremony()` | `src/store/slices/ceremony-slice.ts` |
| Continue → next level | `handleContinue()` in CompletionCeremony | `src/ui/puzzle/CompletionCeremony.tsx` |
| Unique IDs | `generateId()` | `src/shared/generate-id.ts` |

### Key Integration Points

1. **CompletionCeremony.tsx (line 15-29)**: `handleContinue()` already finds next puzzle by index and loads it. Must add `completeLevel()` call and use progression state for index.
2. **App.tsx (line 22-32)**: Init loads `PUZZLE_LEVELS[0]`. Must read `currentLevelIndex` from progression slice.
3. **PalettePanel.tsx**: Renders Fundamental/Puzzle/Utility sections. Puzzle section must filter by `completedLevels`. When `activePuzzle.allowedNodes` is set, filter further.
4. **palette-slice.ts**: `puzzleNodes` Map already tracks completed puzzle nodes — progression slice is the *ordering* layer on top.

### Re-solve Detection

Currently `ceremonyIsResolve` is set by the caller of `startCeremony()`. The progression slice's `completedLevels.has(puzzleId)` provides the authoritative check. The ceremony trigger code (wherever it calls `startCeremony`) should use this.

### Allowed Nodes Filtering

`PuzzleDefinition.allowedNodes` is `string[] | null`. When non-null, it lists allowed node type strings like `['mix']`, `['mix', 'invert']`, etc. Fundamental types: `multiply`, `mix`, `invert`, `threshold`, `delay`. Puzzle types use `puzzle:${puzzleId}` format. Filtering logic:
- `null` → show all fundamentals + all unlocked puzzles + all utilities
- `string[]` → show only fundamentals whose `type` is in the array + puzzle nodes whose `puzzleId` is in the array + filter utilities similarly

### Testing Patterns (Follow Existing)

- Co-locate: `progression-slice.test.ts` next to `progression-slice.ts`
- Pure unit tests: Create store instance, call actions, assert state
- Pattern from `ceremony-slice.test.ts` and `palette-slice.test.ts` — use `create()` with the combined store
- Vitest + `describe`/`it`/`expect` — no DOM, no Canvas, no React for slice tests
- Integration assertions: math correctness tests iterate ticks (see `tutorial-levels.test.ts`)

### File Structure

```
src/store/slices/progression-slice.ts        (NEW)
src/store/slices/progression-slice.test.ts   (NEW)
src/store/index.ts                           (MODIFY — add ProgressionSlice)
src/ui/puzzle/CompletionCeremony.tsx         (MODIFY — call completeLevel)
src/ui/puzzle/LevelSelect.tsx                (NEW — level selection UI)
src/ui/puzzle/LevelSelect.module.css         (NEW — styles)
src/App.tsx                                  (MODIFY — init from progression)
src/palette/components/PalettePanel.tsx       (MODIFY — filter by progression)
```

### Anti-Patterns to Avoid

- DO NOT create a `src/progression/` domain directory — state lives in `src/store/slices/`
- DO NOT duplicate the `PUZZLE_LEVELS` array or create a parallel level tracking structure
- DO NOT add localStorage persistence in this story (that's Story 4.4)
- DO NOT add undo/redo for progression state (that's Story 4.5)
- DO NOT modify engine or wts code
- DO NOT modify puzzle level definitions or waveform generators

### Project Structure Notes

- Alignment: New slice follows `src/store/slices/` pattern exactly
- New UI component follows `src/ui/puzzle/` pattern (co-located with CompletionCeremony)
- CSS Modules: `LevelSelect.module.css` per naming convention
- Tests co-located with source per project-context.md

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]
- [Source: _bmad-output/project-context.md#Validation & Progression]
- [Source: _bmad-output/project-context.md#Error Handling]
- [Source: _bmad-output/project-context.md#Code Organization Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Created `ProgressionSlice` with `completedLevels: Set<string>`, `currentLevelIndex: number`, and 4 actions (`completeLevel`, `setCurrentLevel`, `getUnlockedPuzzleIds`, `isLevelUnlocked`)
- Registered progression slice in GameStore union (8th slice)
- Updated CompletionCeremony `handleContinue()` to call `completeLevel()` before advancing and use progression state for next level index
- Created LevelSelect React component with locked/unlocked/completed visual states, integrated into PalettePanel
- Updated PalettePanel to filter fundamental nodes by `allowedNodes` constraint and puzzle nodes by both `completedLevels` and `allowedNodes`
- Updated App.tsx initialization to read `currentLevelIndex` from progression state instead of always loading PUZZLE_LEVELS[0]
- 16 new unit tests covering all progression-slice actions and derived state
- TypeScript clean, 456 total tests passing, zero regressions

### File List

- `src/store/slices/progression-slice.ts` (NEW)
- `src/store/slices/progression-slice.test.ts` (NEW)
- `src/store/index.ts` (MODIFIED)
- `src/ui/puzzle/CompletionCeremony.tsx` (MODIFIED)
- `src/ui/puzzle/LevelSelect.tsx` (NEW)
- `src/ui/puzzle/LevelSelect.module.css` (NEW)
- `src/App.tsx` (MODIFIED)
- `src/palette/components/PalettePanel.tsx` (MODIFIED)
- `src/simulation/simulation-controller.ts` (MODIFIED — re-solve detection fix)
- `src/store/slices/palette-slice.test.ts` (MODIFIED — added ProgressionSlice + filtering tests)

## Change Log

- 2026-02-03: Implemented Story 4.3 Progression System — progression slice, ceremony integration, level select UI, palette filtering, app initialization
- 2026-02-03: Code review fixes — re-solve detection uses completedLevels (not puzzleNodes), added 15 missing tests (level selection, palette filtering, app init), fixed LevelSelect logic duplication, removed CompletionCeremony dead code, fixed palette-slice.test.ts stale store
