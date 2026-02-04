# Story 4.5: Undo/Redo System

Status: done

## Story

As a player,
I want to undo mistakes when editing my gameboard,
so that I can experiment freely without fear of breaking my work.

## Acceptance Criteria

1. **Given** the player makes an edit (place node, connect wire, change parameter), **When** the edit completes, **Then** the previous gameboard state is pushed to a history stack
2. **Given** the player presses Ctrl+Z, **Then** the previous gameboard state is restored (undo)
3. **Given** the player presses Ctrl+Shift+Z, **Then** the next gameboard state is restored (redo)
4. **Given** wire connect (click source + click target), **Then** it counts as a single undoable action
5. **Given** the history stack, **Then** depth is capped at 50 entries
6. **Given** board switching (zoom in/out, level change), **Then** undo/redo history is cleared

## Tasks / Subtasks

- [x] Task 1: Create history slice (AC: #1, #4, #5)
  - [x] 1.1 Create `src/store/slices/history-slice.ts` with `HistorySlice` interface: undoStack, redoStack, undo(), redo(), clearHistory()
  - [x] 1.2 BoardSnapshot type: `{ board: GameboardState, portConstants: Map<string, number> }`
  - [x] 1.3 Auto-capture snapshots via Zustand subscribe watching graphVersion changes
  - [x] 1.4 Module-level `isRestoring` flag to prevent undo/redo from triggering snapshot capture
  - [x] 1.5 Cap undo stack at 50 entries
  - [x] 1.6 Clear redo stack when new edit is made
  - [x] 1.7 Register slice in GameStore union, call initHistory() in index.ts
  - [x] 1.8 Write unit tests for all actions and auto-capture

- [x] Task 2: Keyboard bindings (AC: #2, #3)
  - [x] 2.1 Add Ctrl+Z / Ctrl+Shift+Z handler in GameboardCanvas.tsx existing keydown useEffect
  - [x] 2.2 Skip undo/redo when typing in input/textarea elements
  - [x] 2.3 Skip undo/redo when activeBoardReadOnly is true

- [x] Task 3: Board switch clears history (AC: #6)
  - [x] 3.1 Detect activeBoardId changes in subscribe listener, call clearHistory()
  - [x] 3.2 Write test verifying history clears on board switch

- [x] Task 4: Full integration and regression (AC: all)
  - [x] 4.1 Run `npx tsc --noEmit` — zero errors
  - [x] 4.2 Run `npx vitest run` — all tests pass, no regressions

## Dev Notes

### Architecture

- **New slice**: `src/store/slices/history-slice.ts` — `StateCreator<GameStore, [], [], HistorySlice>` for cross-slice access
- **Snapshot approach**: Full gameboard snapshots (not reverse-action diffs) per project-context.md
- **Auto-capture**: Subscribe to `graphVersion` changes — captures prev.activeBoard before each mutation
- **Wire connect**: Two-step UI interaction, ONE `addWire()` call → ONE graphVersion increment → ONE snapshot. AC #4 satisfied automatically.

### Mutating actions that trigger graphVersion (auto-captured by subscriber)

| Action | File | Triggers Snapshot |
|--------|------|-------------------|
| `addNode` | gameboard-slice.ts | Yes |
| `removeNode` | gameboard-slice.ts | Yes |
| `addWire` | gameboard-slice.ts | Yes |
| `removeWire` | gameboard-slice.ts | Yes |
| `updateNodeParams` | gameboard-slice.ts | Yes |
| `setPortConstant` | gameboard-slice.ts | Yes |
| `updateWires` | gameboard-slice.ts | No (no graphVersion increment) |
| `restoreBoard` | gameboard-slice.ts | No (no graphVersion increment) |

### Anti-Patterns to Avoid

- DO NOT deep-copy snapshots — Zustand actions create new references, old refs are safe to store
- DO NOT persist undo history to localStorage (transient per-session state)
- DO NOT modify engine or wts code
- DO NOT add undo for progression state (that's a different concern)

### File Structure

```
src/store/slices/history-slice.ts        (NEW)
src/store/slices/history-slice.test.ts   (NEW)
src/store/index.ts                       (MODIFY — add HistorySlice)
src/gameboard/canvas/GameboardCanvas.tsx  (MODIFY — add keyboard handler)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5]
- [Source: _bmad-output/project-context.md#Undo/Redo]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Created `history-slice.ts` with HistorySlice: undoStack/redoStack as BoardSnapshot arrays, undo/redo/clearHistory actions
- Module-level `isRestoring` flag prevents undo/redo restores from triggering new snapshot captures
- `initHistory(store)` sets up Zustand subscribe watching graphVersion for auto-capture, activeBoardId for history clear on board switch
- Undo stack capped at 50 via `.slice(-MAX_HISTORY)`; redo stack cleared on every new edit
- Keyboard bindings added to GameboardCanvas.tsx: Ctrl+Z (undo), Ctrl+Shift+Z (redo), with guards for input/textarea and activeBoardReadOnly
- 18 unit tests covering: initial state, auto-capture (node add, wire add, param update, port constant, redo clear), undo (restore, redo stack, no-op, isRestoring, portConstants, sequential), redo (restore, no-op, idempotent), history cap, board switch, clearHistory
- TypeScript clean, 501 total tests passing, zero regressions
- Code review fixes: redo key matching now case-insensitive (e.key.toLowerCase()), added removeNode/removeWire auto-capture tests, history cap test verifies FIFO eviction order, subscriber uses state param instead of store.getState()

### File List

- `src/store/slices/history-slice.ts` (NEW)
- `src/store/slices/history-slice.test.ts` (NEW)
- `src/store/index.ts` (MODIFIED — added HistorySlice + initHistory)
- `src/gameboard/canvas/GameboardCanvas.tsx` (MODIFIED — added Ctrl+Z/Ctrl+Shift+Z keyboard handler)

## Change Log

- 2026-02-03: Implemented Story 4.5 Undo/Redo System — history slice, auto-capture, keyboard bindings, 18 tests
