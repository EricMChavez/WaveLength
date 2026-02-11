# Creative Mode Behavior Specification

> Consolidated reference for debugging and future development.
> Reflects the cycle-based evaluation model (256 instant cycles, no WTS tick simulation).

---

## Overview

Creative mode is the freeform sandbox where players build circuits without puzzle targets. It is the **default mode** — the app starts in creative mode with a start-screen overlay. Puzzles temporarily replace it.

Players can:
- Configure 6 connection point slots (input/output/off) with waveform shapes
- Wire fundamental and custom nodes freely
- Create/edit utility nodes (reusable custom components)
- Record outputs and save them as custom puzzles (authoring system)

---

## 1. Startup & Initialization

### App.tsx startup sequence

On first load (`activeBoard === null`):

1. `enterCreativeMode()` — sets `isCreativeMode: true`
2. `setActiveBoard(createCreativeGameboard())` — creates board `'creative-mode'` with 6 virtual creative-slot nodes (`__cp_creative_0__` through `__cp_creative_5__`)
3. `initializeMeters(...)` — configures 6 meters: left 0-2 as input, right 0-2 as output, all `'active'`
4. `initializeOutputBuffers()` — creates 6 `OutputRingBuffer` instances (authoring)
5. `openOverlay({ type: 'start-screen' })` — shows start screen

### Start screen choices

- **"Level Select"** — opens level-select overlay (creative board persists underneath)
- **"Creative Mode"** — calls `initializeCreativeMode()` which re-runs steps 1-4, closes overlay

### Re-entry

`initializeCreativeMode()` is exported from `App.tsx` and called from `StartScreen.tsx`. It always creates a fresh board (no persistence of previous creative mode state across re-entries).

---

## 2. Creative Slots (6 Slots)

### Layout

| Slot Index | Side | Default Direction |
|-----------|------|------------------|
| 0 | Left | input |
| 1 | Left | input |
| 2 | Left | input |
| 3 | Right | output |
| 4 | Right | output |
| 5 | Right | output |

### Data structure

```typescript
interface CreativeSlotState {
  direction: 'input' | 'output' | 'off';
  waveform: WaveformDef;  // only meaningful when direction === 'input'
}
```

### Directions

- **input** — slot emits a waveform into the gameboard (signal source). Left-side slots 0-2 can be inputs.
- **output** — slot receives signal from the gameboard (signal sink, recorded for authoring).
- **off** — slot hidden, its virtual node removed from the board, its meter hidden.

### Default waveform

```typescript
{ shape: 'sine-quarter', amplitude: 100, period: 64, phase: 0, offset: 0 }
```

When switching a slot TO input direction, the waveform resets to this default.

### Available waveform shapes (24 total)

4 base shapes (sine, triangle, square, sawtooth) x 3 periods x 2 amplitudes:
- Periods: full (256 cycles), half (128), quarter (64)
- Amplitudes: normal (100) or reduced (50, via `-reduced` suffix)

### Direction change behavior

1. Any wires connected to the changed slot's virtual node are deleted
2. `setCreativeSlotDirection(index, direction)` updates the slot state
3. `updateCreativeSlotNode(index, direction)` or `addCreativeSlotNode(index, direction)` updates the gameboard:
   - **off**: removes the virtual node from the board's node map
   - **input**: sets node type to `'connection-input'` (0 inputs, 1 output)
   - **output**: sets node type to `'connection-output'` (1 input, 0 outputs)
4. Meter visual state updated: `'off'` -> hidden, `'input'`/`'output'` -> active

### Slot configuration UI

Clicking a meter in creative mode opens `WaveformSelectorOverlay` for that slot. The overlay allows:
- Setting direction (input/output/off via radio buttons or similar)
- Choosing waveform shape (when direction is input)

---

## 3. Virtual CP Nodes

### Creative slot nodes

IDs: `__cp_creative_0__` through `__cp_creative_5__`

Created by `createCreativeSlotNode(slotIndex, direction)` in `connection-point-nodes.ts`:
- Input slots: `type: 'connection-input'`, `inputCount: 0`, `outputCount: 1`
- Output slots: `type: 'connection-output'`, `inputCount: 1`, `outputCount: 0`
- `params: { slotIndex }` — stores the slot index
- `position: { col: 0, row: 0 }` — not rendered as boxes; wire endpoints resolve via `getConnectionPointPosition()`

### Bidirectional CP nodes (utility editing)

IDs: `__cp_bidir_0__` through `__cp_bidir_5__`

Used when editing a utility node. These are distinct from creative slot nodes and have different behavior in the evaluator.

### Standard puzzle CP nodes

IDs: `__cp_input_N__` and `__cp_output_N__`

Used in puzzle mode. Created by `createConnectionInputNode()` / `createConnectionOutputNode()`.

---

## 4. Cycle-Based Evaluation in Creative Mode

### How evaluation works

The cycle runner (`cycle-runner.ts`) subscribes to Zustand state changes:
- `graphVersion` change (node/wire edit) -> re-evaluate
- `activeBoardId` change -> re-initialize meters + re-evaluate
- `activeTestCaseIndex` change -> re-evaluate (puzzle mode only)

### Creative mode input generation

When `isCreativeMode === true`, the cycle runner builds inputs from left-side creative slots:

```
For slots 0, 1, 2:
  if slot.direction === 'input':
    input[i] = generateWaveformValue(cycleIndex, slot.waveform)
  else:
    input[i] = 0
```

The `generateWaveformValue(cycle, waveformDef)` function evaluates the waveform at the given cycle index (0-255), producing a signal value in [-100, +100].

### Evaluation result

`evaluateAllCycles()` produces `CycleResults`:
- `outputValues[cycle][outputIndex]` — signal at each output CP per cycle
- `wireValues: Map<wireId, number[]>` — signal on each wire per cycle
- `nodeOutputs: Map<nodeId, number[][]>` — per-node outputs per cycle

### No validation in creative mode

Validation (comparing outputs to expected targets) only runs when `activePuzzle !== null && !isCreativeMode`. Creative mode has no victory condition.

### Meter initialization note

In creative mode, meters are initialized by `initializeCreativeMode()` in `App.tsx`, NOT by the cycle runner's `initializeMeters()`. The cycle runner skips meter initialization for creative mode.

---

## 5. Meter Rendering

### Signal arrays for meters

`buildMeterSignalArrays()` in `render-loop.ts` builds flat 256-sample arrays for each meter:
- **Puzzle mode**: Input meters show puzzle waveform values; output meters show `cycleResults.outputValues`
- **Creative mode**: Input meter signal arrays should show the creative slot waveform; output meter signal arrays show `cycleResults.outputValues`

### Playpoint

A playpoint cursor (0-255) sweeps through results at 16 cycles/sec when `playMode === 'playing'`. Meters show:
1. Static 256-sample waveform graph (full cycle visible)
2. Vertical playpoint indicator line
3. Level bar and needle show value at current playpoint

### Meter hit testing

`hitTestMeter()` checks clicks within meter bounds. In creative mode, a meter hit opens the waveform selector overlay for that slot.

---

## 6. Authoring System (Recording & Saving Custom Puzzles)

> **Status**: The authoring system still uses WTS terminology and the recording pipeline has a gap — `pushOutputSample()` and `advanceRecordingTick()` are defined but have NO callers in the current codebase. This means output buffers are initialized but never populated. This is the primary blocker for the "Save as Puzzle" flow.

### Architecture overview

The authoring system has three phases: **idle** -> **trimming** -> **saving**

### Phase: Idle (recording)

- 6 `OutputRingBuffer` instances (capacity: 480 samples each) are allocated on creative mode entry
- **BROKEN**: These buffers should be filled each cycle with output values from `cycleResults`, but the old tick-based `pushOutputSample()` mechanism was removed during the cycle-based rework and not replaced
- `validRecordedWTS` tracks how many complete 16-sample chunks had non-silent output
- `recordingArmed` flag activates once the first non-silent sample is seen

### Phase: Trimming

Triggered by "Save as Puzzle" button (`SimulationControls.tsx`):

1. **Prerequisites** (all must be true):
   - `validRecordedWTS >= 16` (at least 16 WTS of non-silent recording)
   - At least one slot has `direction === 'output'`
   - All output slot buffers have >= 256 samples

2. `openTrimDialog()`:
   - Snapshots all 6 output buffers
   - `prepareSnapshotBuffers()` truncates to complete WTS boundaries, strips leading silence
   - Sets default trim window to rightmost 16 WTS
   - Opens `'trim-dialog'` overlay

3. **TrimDialog UI**:
   - Canvas showing all output waveforms, color-coded
   - Draggable 16-WTS selection window
   - Arrow keys nudge window by 1 WTS
   - "Continue" -> proceeds to save; "Cancel" -> returns to idle

### Phase: Saving

**SavePuzzleDialog UI**:
- Title (required, max 50 chars)
- Description (optional, max 200 chars)
- Puzzle config summary (inputs, outputs, duration)
- Allowed nodes checkboxes (defaults: all selected)
- Starting nodes checkboxes (pre-placed locked nodes)

**On save**:
1. Extracts trimmed samples from snapshot for each output slot
2. Builds slot configuration (direction + waveform per slot)
3. Serializes starting nodes
4. Creates `CustomPuzzle` with ID `custom-{timestamp}`
5. `addCustomPuzzle(puzzle)` persists it
6. Returns to idle

### CustomPuzzle data shape

```typescript
interface CustomPuzzle {
  id: string;                              // 'custom-{timestamp}'
  title: string;
  description: string;
  createdAt: number;
  slots: Array<{direction, waveform?}>;    // 6 entries
  targetSamples: Map<number, number[]>;    // slotIndex -> trimmed samples
  initialNodes: Array<{...}>;              // starting nodes (locked)
  initialWires: Array<{...}>;             // currently always empty
  allowedNodes: string[] | null;           // null = all allowed
}
```

---

## 7. Utility Node Editing

### Creating a new utility node

**From palette ("Create Custom Node" button)**:
1. Generates new utility ID
2. Creates blank utility gameboard with 6 bidirectional CPs (`__cp_bidir_0__` to `__cp_bidir_5__`)
3. Captures canvas snapshot, starts zoom-in transition
4. `startEditingUtility(utilityId, board)` — pushes creative board onto stack, swaps to utility board

**From context menu ("Edit" on a custom-blank or utility node)**:
1. For `custom-blank`: creates new blank utility gameboard
2. For `utility:*`: loads existing utility's saved board
3. Starts lid-open animation
4. `startEditingUtility(utilityId, board, nodeIdInParent)` — includes parent node ID for later swap

### Board stack

`boardStack` stores a chain of `BoardStackEntry` objects preserving:
- `board` (parent board state)
- `nodeIdInParent` (which node was zoomed into)
- `meterSlots` (meter configuration to restore)
- `portConstants` (port constant values to restore)

### Editing state

- `editingUtilityId` — non-null when editing a utility
- `editingNodeIdInParent` — the node in the parent board that this utility corresponds to
- `activeBoardReadOnly: false` — board is editable

### NavigationBar (Save/Cancel/Done)

Shows **Save + Cancel** when `editingUtilityId !== null`:

**Save flow**:
1. Bakes the graph via `bakeGraph(activeBoard.nodes, activeBoard.wires)`
2. If bake fails: shows alert with error message
3. Extracts `cpLayout` from bake metadata
4. **Existing utility**: asks "Overwrite?" via `window.confirm()`
   - Yes: `updateUtilityNode()`, zoom-out, `finishEditingUtility()`
   - No: prompts new name, creates new utility + `NodeSwap`, `finishEditingUtility(swap)`
5. **First save**: prompts for name, `addUtilityNode()`, creates `NodeSwap` to convert `custom-blank` to `utility:{id}`, `finishEditingUtility(swap)`

**Cancel flow**:
Zoom-out transition, `finishEditingUtility()` with no swap (discards all changes).

**Done button** (shown when navigating into a read-only node, not during editing):
Zoom-out transition, `zoomOut()`.

### finishEditingUtility(nodeSwap?)

1. Pops from `boardStack`
2. If `nodeSwap`: updates parent board's node with new type, inputCount, outputCount, cpLayout
3. Restores parent board, portConstants, meterSlots

---

## 8. Known Issues & Gaps (Post Cycle-Based Rework)

### Critical: Recording pipeline disconnected

The old WTS tick-based recording mechanism (`pushOutputSample()`, `advanceRecordingTick()`) was part of the simulation-controller.ts which was deleted in the cycle-based rework. These functions exist in `authoring-slice.ts` but have **zero callers**. The output ring buffers are never populated, making "Save as Puzzle" impossible.

**To fix**: The cycle runner or render loop needs to feed `cycleResults.outputValues` into the authoring system. Since all 256 output values are computed instantly, the recording model needs rethinking — the old "continuous recording over time" model doesn't fit the instant-evaluation paradigm.

### Authoring system uses WTS terminology

All variable names, comments, and UI strings still reference WTS (Wire Transfer Speed). Functionally the math may still work (16 samples per WTS = 256 total), but the conceptual model is mismatched. The trim window operates in WTS units (16-sample chunks) rather than cycle-based units.

### Creative mode meter input signals

`buildMeterSignalArrays()` in render-loop.ts may not correctly populate input meter signal arrays in creative mode. It checks for `activePuzzle` to source input waveforms, but in creative mode there's no active puzzle — inputs come from `creativeSlots[i].waveform`. This may result in flat/empty input meters.

### No persistence of creative mode state

When re-entering creative mode (via `initializeCreativeMode()`), the board is always recreated fresh. Any work done in creative mode is lost when loading a puzzle and returning.

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Startup sequence, `initializeCreativeMode()` export |
| `src/store/slices/creative-slice.ts` | 6-slot state, directions, waveform config |
| `src/store/slices/authoring-slice.ts` | Output ring buffers, recording, trim/save phases |
| `src/store/slices/custom-puzzle-slice.ts` | CustomPuzzle CRUD, loading, serialization |
| `src/store/slices/gameboard-slice.ts` | Board management, creative slot node add/update/remove |
| `src/store/slices/navigation-slice.ts` | Board stack, utility editing, zoom in/out |
| `src/store/slices/meter-slice.ts` | Meter slot visual states |
| `src/store/slices/overlay-slice.ts` | Overlay type union (waveform-selector, trim-dialog, etc.) |
| `src/puzzle/connection-point-nodes.ts` | Virtual node creation (creative, bidir, puzzle) |
| `src/puzzle/utility-gameboard.ts` | Blank utility gameboard with 6 bidir CPs |
| `src/simulation/cycle-runner.ts` | Cycle evaluation, creative mode input generation |
| `src/gameboard/canvas/render-loop.ts` | Frame rendering, meter signal array building |
| `src/gameboard/canvas/hit-testing.ts` | Meter click detection |
| `src/gameboard/canvas/GameboardCanvas.tsx` | Click dispatch to waveform selector |
| `src/ui/controls/SimulationControls.tsx` | "Save as Puzzle" button |
| `src/ui/overlays/WaveformSelectorOverlay.tsx` | Slot direction/waveform UI |
| `src/ui/overlays/TrimDialog.tsx` | Trim window selection |
| `src/ui/overlays/SavePuzzleDialog.tsx` | Puzzle metadata save dialog |
| `src/ui/controls/NavigationBar.tsx` | Save/Cancel for utility editing |
| `src/ui/screens/StartScreen.tsx` | Initial mode selection |
