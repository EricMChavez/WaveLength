---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
inputDocuments:
  - signal_puzzle_game_design.md
  - _bmad-output/game-architecture.md
---

# logic-puzzle - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for logic-puzzle (Signal Processing Puzzle Game), decomposing the requirements from the GDD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Gameboard displays full-screen with 3 connection points on each side (left/right)
FR2: Players can place nodes from palette onto gameboard
FR3: Players can connect nodes via wires (click output port, then input port)
FR4: Connection points support 3 states: wired, constant (-100 to +100), unconnected (defaults to 0)
FR5: Multiply node: (A x B) / 100, 2 inputs, 1 output
FR6: Mix node: 2 inputs, 1 output, mode parameter (Add, Subtract, Average, Max, Min)
FR7: Invert node: -A, 1 input, 1 output
FR8: Threshold node: +100 if A > threshold else -100, 1 input, threshold param, 1 output
FR9: Delay node: delays input by 0-16 WTS subdivisions, 1 input, delay param, 1 output
FR10: Signal values clamped to [-100, +100] after every operation
FR11: All wires transfer signals in exactly 1 WTS (1 second); nodes process instantly
FR12: Delay node supports 16 subdivisions per WTS cycle
FR13: Signal pulses animate along wires synchronized to WTS rhythm
FR14: Waveform visualization with centerline at 0, animated display
FR15: Zoom-in: click Edit on custom node → internal gameboard fills screen
FR16: Zoom-out: click Done → return to parent gameboard (one level at a time)
FR17: Breadcrumb trail shows nesting depth (read-only indicator)
FR18: Puzzle gameboard provides input source waveform and target output waveform
FR19: Custom node gameboard is freeform (no input source, no target)
FR20: Puzzle validation: output matches target within +/-5, sustained 2 full cycles, across multiple test waveforms
FR21: Continuous validation with real-time per-port match feedback (no Submit button)
FR22: Puzzle completion: name/description revealed, zoom-out animation, node added to palette
FR23: Puzzle nodes cannot be deleted; automatically added to palette on completion
FR24: Utility nodes: player creates anytime via "Create Custom Node" button
FR25: Utility nodes: player names, edits, deletes; saved to library
FR26: Node palette has 3 sections: Fundamental (always), Puzzle (unlocked), Utility (player-created)
FR27: Node parameters adjustable after placement (Mix mode, Delay subdivision, Threshold value)
FR28: Solved puzzles bake into reusable formula-nodes (every puzzle becomes a node)
FR29: Custom nodes can contain other custom nodes (recursive nesting)
FR30: 25+ levels across 4 progression arcs (Tutorial, Signal Shaping, Timing, Advanced)
FR31: Puzzle completion unlocks nodes available in future puzzles
FR32: Undo/redo for gameboard edits
FR33: Save/load player state (progression, node library, settings)

### NonFunctional Requirements

NFR1: Real-time signal graph evaluation at 60fps
NFR2: Smooth waveform animation via Canvas 2D
NFR3: Baked formula closures execute at native JS speed
NFR4: Only one active gameboard rendered at a time; nested boards dormant
NFR5: WTS timing precision with 16 subdivisions
NFR6: Topological sort for evaluation order, re-sorted on graph edit
NFR7: Cycle detection and prevention on every graph edit
NFR8: Persistence data under 1MB in localStorage
NFR9: Engine code (engine/, wts/) is pure TypeScript -- no React or Canvas imports
NFR10: Debug tools tree-shaken from production builds

### Additional Requirements

AR1: Project initialized via `npm create vite@latest logic-puzzle -- --template react-ts`
AR2: Zustand 5.0.10 for state management
AR3: Domain-driven project structure with isolated directories
AR4: Unidirectional data flow through Zustand store
AR5: Result<T, E> error handling for engine functions
AR6: Structured logger with namespaces (Graph, WTS, Bake, Render, Save, UI)
AR7: CSS Modules for UI chrome styling
AR8: Vitest for testing
AR9: Undo history capped at ~50 state snapshots
AR10: Wire connect = single undoable action
AR11: Modified detection via version hash for node instances
AR12: Puzzle node hot-replacement on re-solve
AR13: One-level-at-a-time navigation only (no breadcrumb jumps, no Return to Puzzle)

### FR Coverage Map

FR1: Epic 1 (Story 1.5) - Gameboard canvas rendering with 3+3 connection points
FR2: Epic 1 (Story 1.6) - Node placement from palette
FR3: Epic 1 (Story 1.7) - Wire drawing between ports
FR4: Epic 1 (Story 1.7) - Connection point states (wired, constant, unconnected)
FR5: Epic 1 (Story 1.2) - Multiply node evaluation
FR6: Epic 1 (Story 1.2) - Mix node evaluation (all 5 modes)
FR7: Epic 1 (Story 1.2) - Invert node evaluation
FR8: Epic 1 (Story 1.2) - Threshold node evaluation
FR9: Epic 1 (Story 1.2) - Delay node evaluation
FR10: Epic 1 (Story 1.2) - Signal clamping [-100, +100]
FR11: Epic 1 (Story 1.4) - WTS wire transfer timing
FR12: Epic 1 (Story 1.4) - Delay node 16 subdivisions
FR13: Epic 1 (Story 1.8) - Signal pulse animation on wires
FR14: Epic 1 (Story 1.8) - Waveform visualization with centerline
FR15: Epic 3 (Story 3.1) - Zoom-in navigation
FR16: Epic 3 (Story 3.1) - Zoom-out navigation
FR17: Epic 3 (Story 3.3) - Breadcrumb trail (read-only)
FR18: Epic 2 (Story 2.1) - Puzzle input/target waveforms
FR19: Epic 3 (Story 3.4) - Freeform custom node gameboard
FR20: Epic 2 (Story 2.2) - Puzzle validation (tolerance, cycles, test suites)
FR21: Epic 2 (Story 2.2) - Continuous validation with per-port feedback
FR22: Epic 2 (Story 2.4) - Puzzle completion ceremony
FR23: Epic 2 (Story 2.4) - Puzzle nodes permanent in palette
FR24: Epic 3 (Story 3.4) - Utility node creation
FR25: Epic 3 (Story 3.4) - Utility node edit/delete/library
FR26: Epic 1 (Story 1.6, fundamental) → Epic 2 (Story 2.5, puzzle) → Epic 3 (Story 3.4, utility) → Epic 4 (Story 4.3, full)
FR27: Epic 1 (Story 1.6) - Node parameter controls
FR28: Epic 2 (Story 2.3) - Formula baking
FR29: Epic 3 (Story 3.5) - Recursive nesting
FR30: Epic 4 (Stories 4.1, 4.2) - 25+ levels across 4 arcs
FR31: Epic 2 (Story 2.4) + Epic 4 (Story 4.3) - Puzzle unlock progression
FR32: Epic 4 (Story 4.5) - Undo/redo
FR33: Epic 4 (Story 4.4) - Save/load

## Epic List

### Epic 1: Interactive Signal Sandbox
Player can place fundamental nodes on a gameboard, connect them with wires, configure parameters, and watch real-time signal flow through the graph.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR26 (fundamental), FR27

### Epic 2: Puzzle Play
Player can load a puzzle with input/target waveforms, solve it using continuous real-time validation, experience the completion ceremony, and receive the solved puzzle as a reusable node.
**FRs covered:** FR18, FR20, FR21, FR22, FR23, FR26 (puzzle), FR28, FR31

### Epic 3: Node Building & Navigation
Player can create utility nodes, zoom into any custom node to edit its internals, navigate between nested gameboards via breadcrumbs, and manage their node library.
**FRs covered:** FR15, FR16, FR17, FR19, FR24, FR25, FR26 (utility), FR29

### Epic 4: Progression & Persistence
Player progresses through 25+ levels across 4 arcs, with full save/load and undo/redo, creating a complete game experience.
**FRs covered:** FR26 (full), FR30, FR32, FR33

---

## Epic 1: Interactive Signal Sandbox

Player can place fundamental nodes on a gameboard, connect them with wires, configure parameters, and watch real-time signal flow through the graph.

### Story 1.1: Project Setup & Shared Foundation

As a developer,
I want a properly initialized project with core types and utilities,
So that all future stories build on a consistent foundation.

**Acceptance Criteria:**

**Given** a fresh checkout
**When** `npm install && npm run dev` is run
**Then** Vite dev server starts with a blank React app
**And** `src/shared/types/` contains `NodeState`, `Wire`, `PortRef`, `Signal`, `GameboardState` interfaces
**And** `src/shared/math/` exports `clamp(value, -100, 100)` utility
**And** `src/shared/result/` exports `Result<T, E>` type with `ok()` and `err()` helpers
**And** `src/shared/logger/` exports structured logger with namespace and level support
**And** `src/store/` exports a Zustand store shell with gameboard slice
**And** directory structure matches architecture document
**And** Vitest runs with `npm test`

*Covers: AR1, AR2, AR3, AR5, AR6, AR7, AR8*

### Story 1.2: Fundamental Node Evaluation Engine

As a developer,
I want all 5 fundamental node types implemented as pure functions,
So that the signal processing core is testable and correct.

**Acceptance Criteria:**

**Given** a Multiply node with inputs (50, 50)
**When** evaluated
**Then** output is 25 ((50x50)/100)
**And** Mix node supports all 5 modes (Add, Subtract, Average, Max, Min) with clamping
**And** Invert node outputs -A for any input
**And** Threshold node outputs +100 if A > threshold, else -100
**And** Delay node stores input and emits after specified subdivision count
**And** all outputs are clamped to [-100, +100]
**And** edge cases tested: -100, 0, +100, overflow beyond range
**And** 100% test coverage on all node evaluation functions

*Covers: FR5, FR6, FR7, FR8, FR9, FR10*

### Story 1.3: Signal Graph & Topological Sort

As a developer,
I want a graph data structure with topological sort and cycle detection,
So that nodes evaluate in the correct order.

**Acceptance Criteria:**

**Given** a node map and edge list
**When** topological sort runs
**Then** nodes are ordered so every node evaluates after its dependencies
**And** adding a wire that creates a cycle returns `Result.err` with cycle path
**And** topological order is recalculated on every graph edit (add/remove node or wire)
**And** disconnected nodes are included in the sort order
**And** tests cover: linear chain, diamond merge, parallel paths, single node, cycle detection

*Covers: NFR6, NFR7*

### Story 1.4: WTS Clock & Signal Transport

As a developer,
I want a tick-based timing system that advances signals along wires,
So that signal propagation has the correct rhythmic timing.

**Acceptance Criteria:**

**Given** a WTS clock running
**When** 16 ticks elapse
**Then** exactly 1 WTS (1 second at default speed) has passed
**And** each wire carries in-flight signal state (`{value, ticksRemaining}`)
**And** signals advance 1 tick per clock tick, arriving after 16 ticks (1 WTS)
**And** Delay node adds its parameter value (0-16 subdivisions) to the signal's remaining ticks
**And** nodes fire when input signals arrive, outputting results onto outgoing wires
**And** wire state is the canonical source for signal pulse animation (no duplicate state)

*Covers: FR11, FR12, NFR5*

### Story 1.5: Gameboard Canvas Rendering

As a player,
I want to see a gameboard with nodes and wires drawn on screen,
So that I can visually understand my signal processing graph.

**Acceptance Criteria:**

**Given** the app loads
**When** a gameboard state exists in the store
**Then** a full-screen Canvas renders the gameboard
**And** 3 connection points are visible on the left side and 3 on the right side
**And** nodes render as labeled rectangles with input/output ports
**And** wires render as lines/curves between connected ports
**And** the rAF loop reads Zustand via `getState()` each frame (not React hooks)
**And** rendering maintains 60fps with dozens of nodes and wires

*Covers: FR1, NFR1, NFR2*

### Story 1.6: Node Palette & Placement

As a player,
I want to pick nodes from a palette and place them on the gameboard,
So that I can start building signal processing chains.

**Acceptance Criteria:**

**Given** the palette sidebar is visible
**When** the player views it
**Then** all 5 fundamental nodes are listed (Multiply, Mix, Invert, Threshold, Delay)
**And** clicking a palette item then clicking the gameboard places a new node instance at that position
**And** placed nodes display parameter controls: Mix mode dropdown, Delay subdivision dropdown, Threshold slider
**And** parameters are adjustable after placement
**And** node IDs are generated via `crypto.randomUUID()`

*Covers: FR2, FR26 (fundamental section), FR27*

### Story 1.7: Wire Drawing & Connection Points

As a player,
I want to draw wires between nodes and set constant values on ports,
So that I can route signals through my processing chain.

**Acceptance Criteria:**

**Given** a node on the gameboard
**When** the player clicks an output port then clicks an input port
**Then** a wire connects them
**And** clicking a connection point that has no wire opens a numeric input for constant value (-100 to +100)
**And** unconnected inputs without a constant default to 0
**And** visual feedback shows during wire drawing (line follows cursor from source port)
**And** hit testing correctly identifies port clicks vs gameboard clicks
**And** invalid connections (input-to-input, output-to-output) are prevented

*Covers: FR3, FR4*

### Story 1.8: Waveform Visualization & Signal Animation

As a player,
I want to see animated waveforms and signal pulses flowing through my graph,
So that I can understand what my signal chain is doing in real time.

**Acceptance Criteria:**

**Given** signals are flowing through the graph
**When** the canvas renders
**Then** waveform paths display at connection points with a centerline at 0
**And** signal pulses animate along wires synchronized to the WTS clock
**And** the animation state is read directly from wire state (`{value, ticksRemaining}`)
**And** multiple signals at different timing positions on the same wire render as separate pulses
**And** signal flow is visually clear at 1 WTS per wire transfer rate

*Covers: FR13, FR14*

---

## Epic 2: Puzzle Play

Player can load a puzzle with input/target waveforms, solve it using continuous real-time validation, experience the completion ceremony, and receive the solved puzzle as a reusable node.

### Story 2.1: Puzzle Definition & Loading

As a player,
I want to see a puzzle with input waveforms feeding into my gameboard and a target output to match,
So that I have a clear goal to work toward.

**Acceptance Criteria:**

**Given** a puzzle level is loaded
**When** the gameboard renders
**Then** input waveforms are visible on the left-side connection points cycling continuously
**And** target output waveforms display on the right side as overlay/preview
**And** level data structure contains: input waveform definitions, target waveform definitions, multi-waveform test suite
**And** waveform generators produce sine, square, triangle, and sawtooth waves as pure functions
**And** input signals feed into the graph at the gameboard's left-side connection points each tick

*Covers: FR18*

### Story 2.2: Puzzle Validation Engine

As a player,
I want real-time feedback showing whether my output matches the target,
So that I can iteratively adjust my solution without guessing.

**Acceptance Criteria:**

**Given** signals reach the gameboard's output ports
**When** each tick completes
**Then** each output port shows a correct/incorrect indicator comparing actual vs target
**And** match tolerance is +/-5 units
**And** a streak counter tracks consecutive ticks where ALL outputs match within tolerance
**And** victory triggers when streak reaches 2 full waveform cycles
**And** any graph mutation (wire add/remove, node add/remove/move, parameter change) resets the streak to zero
**And** validation runs against the full multi-waveform test suite (not just the displayed waveform)

*Covers: FR20, FR21*

### Story 2.3: Formula Baking

As a developer,
I want solved puzzles to compile into instant-evaluation baked nodes,
So that custom nodes execute efficiently without re-evaluating their internal graph.

**Acceptance Criteria:**

**Given** a gameboard with connected nodes
**When** baking is triggered
**Then** the graph is walked in topological order and fundamental operations are composed into a single `(inputs: number[]) => number[]` closure
**And** per-input-path delays are accumulated (wire count x 16 ticks + Delay param values) and normalized (shortest path = 0 buffer)
**And** circular buffers are created per input port, pre-filled with 0
**And** bake metadata (topo order, node configs, edges, input delays) is serializable to JSON
**And** closure is reconstructable from metadata alone
**And** equivalence test passes: for any graph, `bakedFunction(inputs)` matches live graph steady-state output exactly

*Covers: FR28, NFR3*

### Story 2.4: Puzzle Completion Ceremony

As a player,
I want a rewarding moment when I solve a puzzle -- the node's name is revealed and it becomes a tool I own,
So that each victory feels meaningful and compounds my capabilities.

**Acceptance Criteria:**

**Given** validation reaches victory state
**When** the completion ceremony triggers
**Then** the puzzle node's name and description are revealed with animation
**And** a zoom-out animation plays (gameboard shrinks into a node using offscreen canvas snapshot)
**And** the baked node is automatically added to the palette's Puzzle section
**And** the puzzle node cannot be deleted from the palette
**And** on first completion, the next puzzle loads automatically with the new node available
**And** on subsequent completions, player is prompted to save new solution or keep current

*Covers: FR22, FR23, FR31*

### Story 2.5: Baked Node Runtime on Gameboard

As a player,
I want to place puzzle nodes I've earned onto new gameboards and have them work correctly,
So that I can use my growing toolkit to solve harder puzzles.

**Acceptance Criteria:**

**Given** a baked puzzle node is placed on a gameboard
**When** signals arrive at its inputs each tick
**Then** input values are pushed into circular buffers and buffered values feed into the composed evaluate function
**And** the baked node's output appears after the appropriate buffer delay (preserving internal timing relationships)
**And** from the outside, the baked node behaves like any other node (one tick per wire)
**And** puzzle nodes appear in the Puzzle section of the palette

*Covers: FR26 (puzzle section)*

---

## Epic 3: Node Building & Navigation

Player can create utility nodes, zoom into any custom node to edit its internals, navigate between nested gameboards via breadcrumbs, and manage their node library.

### Story 3.1: Gameboard Tree & Zoom Navigation

As a player,
I want to click Edit on a custom node to see inside it and Done to go back,
So that I can explore and modify nested signal chains.

**Acceptance Criteria:**

**Given** a custom node on the gameboard
**When** the player clicks Edit
**Then** the view transitions to that node's internal gameboard (child board fills screen)
**And** clicking Done returns to the parent gameboard (one level up)
**And** navigation is strictly one level at a time (no skip-to-root)
**And** only the active gameboard is evaluated and rendered; all other boards are dormant
**And** the GameboardTree tracks root, activeBoard, and parentMap

*Covers: FR15, FR16, NFR4, AR13*

### Story 3.2: Zoom Transition Animations

As a player,
I want smooth animated transitions when zooming in and out of nodes,
So that navigation feels spatial and I maintain context of where I am.

**Acceptance Criteria:**

**Given** the player triggers zoom-in or zoom-out
**When** the transition starts
**Then** the departing board is captured to an offscreen canvas as a frozen snapshot
**And** the snapshot animates (scale/position/fade) over ~0.5 seconds
**And** the arriving board begins live rendering only after the transition completes
**And** exactly one board is live-evaluated at all times during the transition
**And** puzzle completion zoom-out uses the same snapshot mechanism

### Story 3.3: Breadcrumb Bar

As a player,
I want to see where I am in the nesting hierarchy,
So that I don't get lost when editing nodes inside nodes.

**Acceptance Criteria:**

**Given** the player is inside a nested gameboard
**When** the breadcrumb bar renders
**Then** it shows the full path (e.g., "Main Puzzle > Low-Pass Filter > Smoother")
**And** breadcrumbs update on every navigation (zoom in/out)
**And** breadcrumbs are read-only indicators (not clickable for navigation)

*Covers: FR17*

### Story 3.4: Utility Node Creation & Management

As a player,
I want to create my own reusable nodes for patterns I use frequently,
So that I can reduce tedium and manage complexity my own way.

**Acceptance Criteria:**

**Given** the palette is visible
**When** the player clicks "Create Custom Node"
**Then** a zoom-in animation transitions to a blank gameboard (no input source, no target)
**And** the player can build any node configuration on the blank gameboard
**And** clicking Save prompts for a name and saves the node to the Utility section of the palette
**And** the player can edit any utility node by clicking Edit on it in the palette
**And** the player can delete utility nodes from their library
**And** the Utility section appears in the palette below Fundamental and Puzzle sections

*Covers: FR19, FR24, FR25, FR26 (utility section)*

### Story 3.5: Node Instance Model & Library Sync

As a player,
I want placed nodes to track whether their library version has changed,
So that I know when an instance differs from the latest saved version.

**Acceptance Criteria:**

**Given** a node is placed on a gameboard
**When** it is created
**Then** it is a deep clone from the palette library with a stored `libraryVersionHash`
**And** each library entry has a version hash updated on every save
**And** when `instance.libraryVersionHash !== library.currentVersionHash`, a modified indicator is shown
**And** utility node save: player chooses to overwrite (keep name) or rename (new library entry)
**And** puzzle node re-solve: hot-replaces all active instances across all gameboards with the new baked version
**And** custom nodes can contain other custom nodes (recursive nesting supported by GameboardTree)

*Covers: FR29, AR11, AR12*

---

## Epic 4: Progression & Persistence

Player progresses through 25+ levels across 4 arcs, with full save/load and undo/redo, creating a complete game experience.

### Story 4.1: Level Definitions -- Tutorial Arc (Levels 1-5)

As a player,
I want the first 5 puzzles to teach me the fundamentals while building essential tools,
So that I learn the mechanics naturally through play.

**Acceptance Criteria:**

**Given** the game starts
**When** Level 1 loads
**Then** it presents "Build a Rectifier" with sine input (-100 to +100) and target (0 to +100)
**And** Level 2 presents "Build an Amplifier (2x)" with sine (-50 to +50) target (-100 to +100)
**And** Level 3 presents "Build DC Offset (+50)" with sine (-50 to +50) target (0 to +100)
**And** Level 4 presents "Build a Clipper (+/-50)" with sine (-100 to +100) target clipped at +/-50
**And** Level 5 presents "Build a Square Wave Generator" with sine input and square wave target
**And** each level has a multi-waveform test suite (sine, square, triangle at various amplitudes)

*Covers: FR30 (partial)*

### Story 4.2: Level Definitions -- Remaining Arcs (Levels 6-25+)

As a player,
I want increasingly complex puzzles that use my growing toolkit,
So that the game remains challenging and my tools compound in value.

**Acceptance Criteria:**

**Given** the Tutorial Arc is complete
**When** later arcs load
**Then** Signal Shaping arc (Levels 6-12) introduces Delay and timing with puzzles like Low-Pass Filter, Pulse Generator, Envelope Follower
**And** Timing Challenge arc (Levels 13-20) introduces multi-path synchronization with puzzles like Phaser, Crossfader
**And** Advanced Synthesis arc (Levels 21+) requires deep nesting and full toolkit with puzzles like Parametric EQ, Multi-Band Compressor
**And** each level's test suite validates functional correctness across multiple input waveforms
**And** later levels require puzzle nodes earned from earlier levels

*Covers: FR30 (complete)*

### Story 4.3: Progression System

As a player,
I want to progress through levels in order, with each completed puzzle unlocking the next,
So that the game has a clear path forward and my toolkit grows predictably.

**Acceptance Criteria:**

**Given** the player completes a puzzle
**When** the ceremony finishes
**Then** the next level loads automatically
**And** progression state tracks: completed levels, unlocked puzzle nodes, current level
**And** the full 3-section palette reflects progression (Fundamental always available, Puzzle section grows with completions, Utility section managed by player)
**And** previously completed levels can be replayed

*Covers: FR26 (full), FR31*

### Story 4.4: Save/Load System

As a player,
I want my progress saved automatically so I can close the browser and return later,
So that I never lose my toolkit or progression.

**Acceptance Criteria:**

**Given** the player makes progress
**When** a save-worthy event occurs (puzzle complete, utility node saved, settings changed)
**Then** state is serialized to localStorage as JSON
**And** on game load, saved state is deserialized: progression, bake metadata for all nodes, gameboard layouts, player settings
**And** baked node closures are reconstructed from serialized metadata on load
**And** localStorage adapter handles errors gracefully (try-catch, no crash)
**And** total data footprint stays under 1MB

*Covers: FR33, NFR8*

### Story 4.5: Undo/Redo System

As a player,
I want to undo mistakes when editing my gameboard,
So that I can experiment freely without fear of breaking my work.

**Acceptance Criteria:**

**Given** the player makes an edit (place node, connect wire, change parameter)
**When** the edit completes
**Then** the previous gameboard state is pushed to a history stack
**And** Ctrl+Z restores the previous state (undo), Ctrl+Shift+Z restores the next state (redo)
**And** wire connect (click source + click target) counts as a single undoable action
**And** history depth is capped at 50 entries
**And** undo/redo only applies to the active gameboard

*Covers: FR32, AR9, AR10*
