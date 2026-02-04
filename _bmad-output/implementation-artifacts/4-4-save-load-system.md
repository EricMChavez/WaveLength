# Story 4.4: Save/Load System

Status: done

## Story

As a player,
I want my progress saved automatically so I can close the browser and return later,
so that I never lose my toolkit or progression.

## Acceptance Criteria

1. **Given** the player makes progress, **When** a save-worthy event occurs (puzzle complete, utility node saved), **Then** state is serialized to localStorage as JSON
2. **Given** the game loads, **Then** saved state is deserialized: progression, bake metadata for all nodes, gameboard layouts (utility node boards)
3. **Given** saved state contains bake metadata, **Then** baked node closures are reconstructed from serialized metadata on load (via `reconstructFromMetadata`)
4. **Given** localStorage operations, **Then** errors are handled gracefully (try-catch, no crash)
5. **Given** a full save with 15 completed levels and utility nodes, **Then** total data footprint stays under 1MB
6. **Given** the game initializes with no saved state, **Then** it starts fresh at level 0 (current behavior preserved)

## Tasks / Subtasks

- [x] Task 1: Create persistence serialization layer (AC: #1, #2, #5)
  - [x] 1.1 Create `src/store/persistence.ts` with `PersistedState` interface (version, completedLevels, currentLevelIndex, puzzleNodes, utilityNodes)
  - [x] 1.2 Implement `serializeState(store)` — extract persistence fields, convert Map→entries, Set→array
  - [x] 1.3 Implement `deserializeState(json)` — parse JSON, reconstruct Map/Set
  - [x] 1.4 Implement `serializeGameboard(board)` / `deserializeGameboard(data)` — convert nodes Map to/from entries array
  - [x] 1.5 Add schema `version: 1` field for future migrations
  - [x] 1.6 Write unit tests for serialize/deserialize roundtrip (Map, Set, GameboardState, BakeMetadata)

- [x] Task 2: Implement localStorage adapter with error handling (AC: #4)
  - [x] 2.1 Implement `saveToStorage(state)` — JSON.stringify + localStorage.setItem wrapped in try-catch
  - [x] 2.2 Implement `loadFromStorage()` — localStorage.getItem + JSON.parse wrapped in try-catch, returns null on failure
  - [x] 2.3 Write test for error handling: corrupt JSON returns null, missing key returns null

- [x] Task 3: Auto-save via Zustand subscribe (AC: #1)
  - [x] 3.1 Implement `initPersistence()` — Zustand subscribe watching completedLevels, puzzleNodes, utilityNodes, currentLevelIndex
  - [x] 3.2 Debounce saves (100ms) to avoid rapid writes from sequential state changes
  - [x] 3.3 Write test verifying subscribe triggers save on relevant state changes

- [x] Task 4: Hydrate saved state on startup (AC: #2, #3, #6)
  - [x] 4.1 Implement `hydrateSavedState()` — load from storage, deserialize, call store.setState for persistence fields
  - [x] 4.2 Call hydrate in `src/store/index.ts` at module level after store creation
  - [x] 4.3 App.tsx init already reads currentLevelIndex — verify it works with hydrated state
  - [x] 4.4 Write test for hydration: store starts with default state, hydrate overwrites persistence fields, transient fields unaffected

- [x] Task 5: Data footprint validation (AC: #5)
  - [x] 5.1 Write test asserting serialized state with 15 completed levels + 5 utility nodes stays under 1MB

- [x] Task 6: Full integration and regression (AC: all)
  - [x] 6.1 Run `npx tsc --noEmit` — zero errors
  - [x] 6.2 Run `npx vitest run` — all tests pass, no regressions
  - [x] 6.3 Verify save → load roundtrip preserves all persistence fields

## Dev Notes

### Architecture Requirements

- **New persistence module**: `src/store/persistence.ts` — follows store directory pattern, NOT a new domain
- **No Zustand persist middleware**: Custom implementation to handle Map/Set serialization and selective persistence
- **localStorage key**: `logic-puzzle-save` (single key for all game state)
- **Engine isolation**: `src/engine/` and `src/wts/` remain untouched

### Serialization Strategy

| State Field | Source Slice | Type | Serialized As |
|------------|-------------|------|---------------|
| `completedLevels` | progression | `Set<string>` | `string[]` |
| `currentLevelIndex` | progression | `number` | `number` |
| `puzzleNodes` | palette | `Map<string, PuzzleNodeEntry>` | `[string, PuzzleNodeEntry][]` |
| `utilityNodes` | palette | `Map<string, UtilityNodeEntry>` | `[string, SerializedUtilityEntry][]` |

UtilityNodeEntry contains `board: GameboardState` which has `nodes: Map<NodeId, NodeState>`. Must serialize recursively:
```
GameboardState.nodes: Map → [NodeId, NodeState][]
```

BakeMetadata is already JSON-serializable (primitives, arrays, simple objects). No special handling needed.

Wire.signals array is transient animation state — strip to empty array on save.

### DO NOT Persist (Transient State)

- InteractionSlice: UI mode, selection, mouse position
- SimulationSlice: running flag
- CeremonySlice: overlay state
- NavigationSlice: zoom stack, transitions
- PuzzleSlice: activePuzzle (loaded from PUZZLE_LEVELS), validation streak, puzzleStatus
- GameboardSlice: activeBoard (recreated from puzzle on load), graphVersion

### Key Integration Points

1. **Store creation** (`src/store/index.ts`): Call `initPersistence(useGameStore)` after store creation at module level
2. **App.tsx**: Already reads `currentLevelIndex` from store — hydration happens before React renders
3. **Zustand subscribe**: Watch state refs (Map/Set identity changes) to trigger debounced saves

### Existing Code to Reuse (DO NOT REINVENT)

| Need | Existing Solution | File |
|------|------------------|------|
| BakeMetadata reconstruction | `reconstructFromMetadata()` | `src/engine/baking/bake.ts:88` |
| Puzzle level registry | `PUZZLE_LEVELS` | `src/puzzle/levels/index.ts` |
| Store state access | `useGameStore.getState()` | `src/store/index.ts` |

### Testing Patterns

- Co-locate: `persistence.test.ts` next to `persistence.ts`
- Pure unit tests: serialize/deserialize roundtrips, localStorage mock, error handling
- No DOM, no Canvas, no React for persistence tests
- Vitest + describe/it/expect

### Anti-Patterns to Avoid

- DO NOT use Zustand persist middleware (doesn't handle Map/Set)
- DO NOT persist transient UI state (interaction, ceremony, navigation)
- DO NOT serialize closures (BakeMetadata only, reconstruct on load)
- DO NOT create a new domain directory
- DO NOT modify engine or wts code

### File Structure

```
src/store/persistence.ts        (NEW)
src/store/persistence.test.ts   (NEW)
src/store/index.ts              (MODIFY — add hydrate + subscribe init)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
- [Source: _bmad-output/project-context.md#Platform & Build Rules]
- [Source: _bmad-output/project-context.md#Error Handling]
- [Source: _bmad-output/project-context.md#Critical Anti-Patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Created `persistence.ts` with full serialize/deserialize layer: `PersistedState` interface, `serializeState`/`deserializeState`, `serializeGameboard`/`deserializeGameboard`, schema version 1
- Custom Map→entries and Set→array conversion for non-JSON-serializable types
- Wire.signals stripped to empty array on save (transient animation state)
- localStorage adapter with try-catch wrapping: `saveToStorage` returns boolean, `loadFromStorage` returns null on failure
- Auto-save via Zustand subscribe with 100ms debounce, watching 4 persistence fields by reference identity
- `initPersistence(store)` handles both hydration and subscribe setup at module level
- 25 new unit tests: gameboard serialization (3), state serialization roundtrips (4), deserialization error handling (5), localStorage adapter (4), persistenceFieldsChanged (5), initPersistence (3), data footprint (1)
- TypeScript clean, 505 total tests passing, zero regressions
- Code review fixes: added field type validation in deserializeState (guards against corrupted data), added subscribe-triggered save test, added debounce behavior test, added non-persistence field change test, added wrong-type fallback test

### File List

- `src/store/persistence.ts` (NEW)
- `src/store/persistence.test.ts` (NEW)
- `src/store/index.ts` (MODIFIED — added initPersistence call)

## Change Log

- 2026-02-03: Implemented Story 4.4 Save/Load System — persistence serialization, localStorage adapter, auto-save subscribe, hydration, 25 tests
