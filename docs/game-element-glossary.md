# Game Element Glossary

A dictionary of every game element term, organized from most fundamental to most composite.

---

## Signal Fundamentals

**Signal** — A numeric value in [-100, +100]. Clamped after every chip evaluation. Positive = amber, negative = teal, zero = gray.

**Cycle** — One evaluation pass of the entire chip graph. 256 cycles are computed instantly on every graph edit. Cycle 0 through 255.

**Playpoint** — The cursor index (0–255) into cycle results. Sweeps at 16 cycles/sec during playback, or stepped manually with arrow keys when paused.

---

## Chip System

**ChipDefinition** — The *blueprint* for a chip type. Lives in the registry. Defines inputs, outputs, evaluation function, size, parameters. One per type.

**ChipState** (instance) — A *placed* chip on a gameboard. Has a unique `ChipId`, grid position, parameter values, port counts, and optional rotation. Many per type.

**Port** — A signal input or output slot on a chip definition. Defined by `PortDefinition` (name, side, optional knob link). Referenced at runtime by `PortRef` (chipId + portIndex + 'input'|'output').

**Knob** — A port on a chip that's linked to an adjustable parameter. When a `PortDefinition` has `knob: 'amount'`, that port acts as both a signal input AND a manual dial. If the port is wired, the wire value overrides the knob. Only on Offset, Scale, and Threshold.

**Anchor** — The grid cell where a path physically attaches to a port. Computed by `getPortGridAnchor()`. Sits on the chip's boundary edge, 1 cell from center. This is the A* routing start/end point.

---

## Connection Points (CPs)

**Connection Point (CP)** — A *virtual* chip representing the gameboard's external I/O. Not placed by the player. Appears at the left/right edges of the playable area. Each gameboard has up to 3 input CPs (left) and 3 output CPs (right).

- **Input CP**: 0 inputs, 1 output — injects a waveform into the board
- **Output CP**: 1 input, 0 outputs — collects signal for validation
- **Bidirectional CP**: 1 input + 1 output — used inside utility chips

**ConnectionPointSlot** — Configuration for one CP position: active/inactive, direction (input/output), index.

**Key distinction: Port vs CP** — A *port* belongs to a chip (data flows through it). A *CP* IS a virtual chip (the gameboard's external interface). CPs have ports on them, but they are not ports themselves.

---

## Paths & Routing

**Path** — A connection between one output port and one input port. Has a `source: PortRef`, `target: PortRef`, and `route: GridPoint[]` (the routed grid cells). Carries one signal value per cycle.

**Stub** — The first 1–2 cells of a path's route, projected straight outward from a port anchor. The A* router handles the middle segment between stubs.

**Blip** — An animated dot that travels along a path during pause mode. Timing is depth-based (wavefront visualization of evaluation order).

---

## Gameboard

**Gameboard (GameboardState)** — The complete state container: a `Map<ChipId, ChipState>` of chips + a `Path[]` of connections. Only ONE gameboard is actively evaluated at a time.

**Grid** — The 66x36 cell coordinate system. Left meters (cols 0–9), playable area (cols 10–55), right meters (cols 56–65).

**Cell** — A single grid unit at (col, row). Pixel size = `cellSize` (computed from viewport).

**GridPoint** — A `{col, row}` position. Used everywhere in state/logic. Never pixels.

**Occupancy Grid** — A `boolean[66][36]` tracking which cells are occupied by chips. Used for placement validation and path routing.

**Ghost** — The semi-transparent placement preview when dragging or keyboard-placing a chip. A synthetic `ChipState` with `id='__ghost__'`. Green = valid, red = collision.

---

## Meters

**Meter** — A 10-column x 12-row canvas-rendered display flanking the playable area. Each CP gets one meter. Shows three channels:

1. **Waveform** — 256-sample polyline (all cycles)
2. **Level bar** — fills from center (current playpoint value)
3. **Needle** — red horizontal line (current playpoint value)

**MeterSlotState** — Runtime state for one meter: side, index, visual state, direction, associated CP index.

**Target overlay** — Dashed polyline on output meters showing the expected waveform the player must match.

---

## Palette & Chip Types

**Palette** — The chip library modal (opened with N or Space). Contains all available chip types for placement.

**Fundamental chips** — The 8 built-in types: Offset, Scale, Threshold, Max, Min, Memory, Split, Negate. Always available.

**Puzzle chip** — Created by completing a level. Its internal graph is "baked" into a closure. Auto-added to palette. Cannot be deleted.

**Utility chip** — Player-created custom chip. Editable, deletable. Stored with its internal gameboard.

---

## UI Layer

**Overlay** — A single active UI layer (discriminated union, one at a time): palette modal, parameter popover, context menu, level select, save dialog, etc. When active, canvas ignores input.

**Token (ThemeToken)** — A typed design value from CSS (colors, durations, sizes). Built once into a flat `ThemeTokens` object. Canvas draw functions receive tokens as a parameter, never read CSS directly.

---

## Definition vs Instance

| Concept | Definition (one per type) | Instance (many per type) |
|---------|--------------------------|--------------------------|
| Chip | `ChipDefinition` in registry | `ChipState` on gameboard |
| Port | `PortDefinition` in definition | `PortRef` referencing chip+index |
| Gameboard | Puzzle configuration | `GameboardState` in store |
| Path | — | `Path` connecting two PortRefs |
