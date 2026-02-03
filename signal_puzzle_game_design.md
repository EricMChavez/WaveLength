# Signal Processing Puzzle Game - Design Document

## High-Level Concept

A puzzle game inspired by Digital Audio Workstations (DAWs) and node-based visual scripting interfaces. Players manipulate signal waveforms by connecting and configuring processing nodes to transform an input waveform into a target output waveform.

**Core Progression Loop**: Every puzzle is building a custom node. When you solve a puzzle, the gameboard becomes that node, which you then use in future puzzles. The game is a recursive, fractal experience where you're building both solutions and the tools to solve future problems.

## Core Inspiration

- **DAW interfaces**: Logic Pro, Pro Tools
- **Node-based systems**: Unreal Engine Blueprints, Blender Shader Nodes
- **Signal processing**: Audio synthesis and effects processing

## Gameboard Hierarchy

### The Gameboard
The **gameboard** is the playable area where nodes can be placed and connected. Every gameboard has:
- **3 connection points on the left side** (typically inputs)
- **3 connection points on the right side** (typically outputs)
- Space for nodes to be placed and wired together
- When displayed, always fills the screen

### Recursive Structure
The game world is fractally nested - every custom node contains a gameboard, which can contain more custom nodes, which contain more gameboards, infinitely recursive.

**Navigation:**
- **Zoom in**: Click "Edit" on any custom node → its internal gameboard expands to fill screen
- **Zoom out**: Click "Save" or "Done" → gameboard compresses back into a node, return to parent level
- **Breadcrumb trail**: Shows nesting depth (e.g., "Main Puzzle > Low-Pass Filter > Smoother")
- **"Return to Puzzle" button**: Always visible, zooms all the way back to main puzzle gameboard

**Consistent Interface**: 
At every level (main puzzle, inside custom nodes, nested deeper), the player sees:
- One gameboard (full screen, 3×3 connection points)
- One node palette (fundamentals + available custom nodes)
- Wire connection tools
- Same interaction model

The only difference between contexts:
- **Puzzle gameboard**: Has input source and target output to validate against
- **Custom node gameboard**: No input source, no target (freeform building)

## Visual Design

### Signal Range
- All signals operate in the range **-100 to +100**
- **0** represents the neutral centerline
- Positive values (+1 to +100) represent upward amplitude
- Negative values (-1 to -100) represent downward amplitude

### Waveform Visualization
- Waveforms display with a **visible horizontal centerline at 0**
- Signal animates/pulses through wires to show flow
- Suggested visual treatments:
  - Color gradient: Red (negative) → Gray (zero) → Blue (positive)
  - Filled regions above/below centerline
  - Numeric value display on hover

### Input/Output
- Each puzzle provides an **input waveform** (sine, square, sawtooth, or complex pattern)
- Player must configure nodes to produce the **target output waveform**
- Waveform cycles slowly enough for players to observe transformations in real-time

## Timing System

### Wire Transfer Speed (WTS)
- **Base rhythm**: 1 WTS = 1 second (adjustable in final implementation)
- **All wires take exactly 1 WTS** to transfer a signal from one node to another
- **Nodes process instantly** - no computational delay
- Creates a rhythmic, musical quality where signals pulse in sync

### Delay Subdivisions
- Delay nodes can delay signals by subdivisions of WTS
- **16 subdivisions per WTS** (1/16, 1/8, 1/4, 1/2, whole)
- Aligns with musical timing for intuitive rhythm-based puzzles

### Visual Timing Feedback
- Signal "pulses" hop from node to node in rhythm
- Players can see when signals are synchronized or out of phase
- Multiple signals at different timing shown as sequential pulses

## Node System Architecture

### Two Types of Custom Nodes

**1. Puzzle Nodes (Required Progression)**
- **How created**: By completing puzzle levels
- **Fixed requirements**: Specific input waveform → target output waveform
- **Success criteria**: Strict validation - output must match target within tolerance
- **Multiple solutions allowed**: Different internal implementations can pass validation
- **Reveal on completion**: 
  - Name appears: "Rectifier", "Low-Pass Filter", "Compressor"
  - Description appears: "Converts negative values to positive" or "Smooths rapid changes"
  - Zoom-out animation plays - gameboard becomes a node
- **Purpose**: Gate progression, ensure player has necessary tools
- **Added to palette**: Automatically available for all future puzzles
- **Cannot be deleted**: They're part of the core progression

**2. Utility Nodes (Player-Created Anytime)**
- **How created**: Player clicks "Create Custom Node" button during any puzzle
- **No requirements**: Opens blank 3×3 gameboard, no input source, no target output
- **Freeform creation**: Player builds whatever configuration they want
- **Save anytime**: Can save incomplete, experimental, or specialized nodes
- **Player naming**: Full control over name and optional description
- **Purpose**: Reduce tedium, enable personal problem-solving strategies
- **Examples**:
  - "My 3× Amplifier" (frequently needed multiplication)
  - "Quick Delay Chain" (common timing pattern)
  - "Debug Splitter" (splits signal to observe multiple paths)
- **Can be edited/deleted**: Full control in player's library

### Validation Strategy for Puzzle Nodes

To ensure multiple solutions are valid while still building the correct tool:

**Test with multiple input waveforms:**
- Sine wave (-100 to +100)
- Square wave (-50 to +50)
- Triangle wave (-80 to +30)
- Complex/irregular waveforms

**Example: "Build a Rectifier" puzzle**
- Solution A: `Mix(Max) with Input and Inverted Input` (true absolute value)
- Solution B: `Mix(Max, constant: 0)` (clips negatives to zero)
- Both pass validation if they correctly handle all test waveforms

If the node passes all validation tests = player built the right kind of processor, regardless of internal implementation.

### Connection Point System
Each connection point can be in one of three states:

1. **Wired**: Connected to another node via wire, receives/sends continuous signal
2. **Constant**: User clicks and sets a fixed numeric value (-100 to +100)
   - Display: Show value with +/- prefix ("+50", "-30", "0")
   - UI: Click connection point to open input field
3. **Unconnected**: No wire, no constant value set (defaults to 0)

### Node Types

#### Fundamental Nodes (Cannot be broken down further)

**1. Multiply**
- **Inputs**: 2 (A, B)
- **Output**: (A × B) / 100
- **Behavior**: 
  - Scales signals: 50 × 50 = 25
  - Inverts polarity if one input is negative: 50 × -100 = -50
  - Keeps result in -100 to +100 range
- **Uses**: Amplification, attenuation, polarity inversion, ring modulation

**2. Mix**
- **Inputs**: 2 (A, B)
- **Output**: Depends on mode parameter
- **Modes**:
  - **Add**: clamp(A + B, -100, 100)
  - **Subtract**: clamp(A - B, -100, 100)
  - **Average**: (A + B) / 2
  - **Max**: maximum of A and B
  - **Min**: minimum of A and B
- **Behavior**: When inputs arrive at different times (out of sync), outputs appear sequentially
- **Uses**: Signal combining, comparison, limiting

**3. Invert**
- **Inputs**: 1 (A)
- **Output**: -A
- **Behavior**: Flips signal polarity (phase inversion)
- **Uses**: Phase cancellation, signal flipping, creating negative constants

**4. Threshold**
- **Inputs**: 1 (A)
- **Parameter**: Threshold value (-100 to +100)
- **Output**: +100 if A > threshold, else -100
- **Behavior**: Converts continuous signal to binary (square wave)
- **Uses**: Gate generation, square wave synthesis, logic operations

**5. Delay**
- **Inputs**: 1 (A)
- **Parameter**: Delay amount (0-16 subdivisions of WTS)
- **Output**: Input signal delayed by specified time
- **Behavior**: Holds signal and releases after specified delay
- **UI**: Dropdown showing musical subdivisions (1/16, 1/8, 1/4, 1/2, whole note)
- **Uses**: Timing synchronization, phase alignment, echo effects

#### Custom Nodes (Player-created)

**Structure**:
- Same 3×3 connection point layout as any gameboard
- Players click "Edit" on a custom node → zoom in to see its internal gameboard
- Can contain any combination of fundamental and other custom nodes
- Saved to player's library for reuse

**Navigation**:
- **To edit**: Click "Edit" on any custom node → lid opens, zoom in to internal gameboard
- **To save**: Click "Save" or "Done" → zoom out, gameboard becomes a node again
- **Visual feedback**: Breadcrumb trail shows nesting depth

**Key Features**:
- **Recursive**: Custom nodes can contain other custom nodes (infinite nesting possible)
- **Named**: Players name their custom nodes (puzzle nodes have pre-set names)
- **Abstraction**: Allows players to manage complexity by building reusable components

## Progression System

### Core Progression: Every Puzzle Builds a Tool

**The Loop**:
1. Enter a puzzle with specific input → target output requirements
2. Build solution using available nodes (fundamentals + your library)
3. On success, name/description revealed, zoom-out animation plays
4. That gameboard becomes a puzzle node in your palette
5. Use that new node to solve the next puzzle

**Key Insight**: You're not just solving puzzles - you're building your own toolkit. Each victory is a new capability that compounds with previous victories.

### Tutorial Arc (Levels 1-5): Building Basic Tools
### Tutorial Arc (Levels 1-5): Building Basic Tools
- **Goal**: Teach fundamental nodes while building essential processors
- **Introduces**: Utility node creation (Level 3-4)
- **Example Puzzles**:
  - Level 1: "Build a Rectifier" → Converts negatives to positives
    - Input: Sine wave (-100 to +100)
    - Target: Only positive half (0 to +100)
    - Learn: Mix(Max) node or combining Invert + Mix
  - Level 2: "Build an Amplifier (2×)" → Doubles signal strength
    - Input: Sine wave (-50 to +50)
    - Target: Sine wave (-100 to +100)
    - Learn: Using Mix(Add) or Multiply with constants
  - Level 3: "Build DC Offset (+50)" → Shifts signal upward
    - Input: Sine wave (-50 to +50)
    - Target: Sine wave (0 to +100)
    - Learn: Mix(Add) with constants
    - **Tutorial moment**: "You can create Utility Nodes anytime - try it!"
  - Level 4: "Build a Clipper (±50 limit)" → Limits signal range
    - Input: Sine wave (-100 to +100)
    - Target: Clipped sine (±50)
    - Learn: Mix(Max) and Mix(Min) chaining
  - Level 5: "Build a Square Wave Generator" → Binary conversion
    - Input: Sine wave
    - Target: Square wave
    - Learn: Threshold node

### Signal Shaping Arc (Levels 6-12): Using Your Tools
- **Goal**: Combine puzzle nodes from previous levels, introduce timing
- **Player now has**: Rectifier, Amplifier, DC Offset, Clipper, Square Wave Generator
- **New Concepts**: Delay node, timing synchronization, using Utility Nodes for repeated patterns
- **Example Puzzles**:
  - Level 6: "Build a Low-Pass Filter" → Smooths rapid changes
    - Use: Mix(Average) with Delay to blend signal with delayed version
    - Player's Amplifier node might be useful for tuning
  - Level 7: "Build a Pulse Generator" → Creates spikes at signal changes
    - Use: Mix(Subtract) between signal and delayed signal
    - Player's Rectifier might help clean up output
  - Level 8: "Build an Envelope Follower" → Tracks signal amplitude
    - Use: Rectifier (from Level 1), Low-Pass Filter (from Level 6)
    - First puzzle requiring previous puzzle nodes!
  - Level 9-12: Continue building increasingly complex processors
    - High-Pass Filter, Band-Pass Filter, Gate, Compressor basics
    - Each builds on previous puzzle nodes
    - Utility nodes become essential for managing complexity

### Timing Challenge Arc (Levels 13-20): Multi-Path Synchronization
- **Goal**: Master complex timing, coordinate multiple signal paths
- **Player now has**: 12+ puzzle nodes, various utility nodes
- **New Concepts**: Multi-path processing, phase relationships, precise delay management
- **Example Puzzles**:
  - Level 13: "Build a Phaser Effect" → Combines delayed and original signals
    - Split signal, delay one path, recombine with Mix
    - Learn: Importance of delay subdivision precision
  - Level 14: "Build a Crossfader" → Blend between two inputs based on control
    - Uses: Multiply, Invert, Mix(Add)
    - Three-input processor, complex routing
  - Level 15-20: Advanced multi-stage processors
    - Stereo processors, feedback delay networks (with safeguards)
    - Sequencers, rhythm generators
    - Each puzzle requires sophisticated use of previous puzzle nodes
    - Utility nodes essential for managing 10+ node configurations

### Advanced Synthesis (Levels 21+): Complex Custom Nodes
- **Goal**: Build sophisticated processors using your entire toolkit
- **Player now has**: 20+ puzzle nodes, extensive utility library
- **New Concepts**: Deep nesting (custom nodes within custom nodes), architectural thinking
- **Example Puzzles**:
  - "Build a Parametric EQ" → Uses Band-Pass Filters, Crossfaders
  - "Build a Multi-Band Compressor" → Uses Envelope Followers, Clippers, Mixers
  - "Build a Granular Processor" → Complex timing and amplitude control
- **The Magic Moment**: 
  - Player opens a Level 25 puzzle
  - They use their Level 11 Band-Pass Filter
  - Which internally uses their Level 6 Low-Pass Filter
  - Which internally uses fundamental nodes
  - Three levels deep, abstracting incredible complexity
  - This is when the recursive power becomes visceral

## Example Custom Node Constructions

### Rectifier (Absolute Value)
**Connections**: 1 input (Left-1) → 1 output (Right-1)
```
Left-1 ──┬──→ Mix(Max) ──→ Right-1
         │       ↑
         └→ Invert ──→ ┘
```
**Logic**: max(Input, -Input) = |Input|

### Amplifier (2× with clamp)
**Connections**: 1 input (Left-1) → 1 output (Right-1)
```
Left-1 ──┬──→ Mix(Add) ──→ Right-1 (clamped to ±100)
         └──────┘
```
**Logic**: Input + Input, automatically clamped

### Low-Pass Filter (Signal Smoother)
**Connections**: 1 input (Left-1) → 1 output (Right-1)
```
Left-1 ──┬──→ Mix(Add) ──→ Mix(Average with constant: 0) ──→ Right-1
         │      ↑
         └──→ Delay(1 WTS) ──→ ┘
```
**Logic**: Average current signal with delayed version = smoothing

### Crossfader
**Connections**: 3 inputs (A, B, control) → 1 output
```
Left-1 (A) ──→ Multiply ──→ Mix(Add) ──→ Right-1
                  ↑            ↑
Left-3 (ctrl) ────┘            │
                               │
Left-2 (B) ──→ Multiply ────────┘
                  ↑
Left-3 ──→ Invert ──→ Mix(Add, constant: +100) ──→ ┘
```
**Logic**: When control = +100, output A; when control = -100, output B

### Pulse Generator
**Connections**: 1 input → 1 output
```
Left-1 ──┬──→ Mix(Subtract) ──→ Right-1
         │         ↑
         └──→ Delay(N) ──→ ┘
```
**Logic**: Input - DelayedInput = spike when signal changes

## UI/UX Considerations

### Gameboard Interface (Consistent at Every Level)
- **Full-screen gameboard** with 3×3 connection point grid
- **Node palette** on side showing:
  - **Fundamental Nodes** section (always available)
  - **Puzzle Nodes** section (unlocked through progression)
  - **Utility Nodes** section (player-created, editable/deletable)
  - **"+ Create Custom Node"** button (opens blank gameboard for utility nodes)
- **Wire drawing**: Click output connection point, then input connection point
- **Connection point interaction**:
  - Wired: Has wire attached
  - Constant: Click to open numeric input (-100 to +100)
  - Empty: No wire, no constant (defaults to 0)

### Navigation Elements
- **Breadcrumb trail** at top: Shows nesting depth
  - Example: "Main Puzzle > Low-Pass Filter > Smoother"
  - Click any level to jump back to it
- **"Return to Puzzle" button**: Always visible, zooms back to main puzzle
- **Current context indicator**: Shows whether you're in:
  - A puzzle (with input/output requirements)
  - A utility node (freeform)
  - Editing an existing node

### Puzzle-Specific UI
- **Input preview**: Shows source waveform cycling (left side)
- **Output preview**: Shows current result (right side)
- **Target overlay**: Shows target waveform for comparison
- **Match indicator**: Visual feedback when output approaches target
- **Success state**: Clear celebration when puzzle is solved
- **"Submit" button**: Check if solution passes validation

### Node Editing Flow
**Creating Utility Node:**
1. Click "+ Create Custom Node" in palette
2. Zoom-in animation to blank gameboard
3. Build whatever configuration you want
4. Click "Save", prompted for name
5. Zoom-out animation, node appears in palette

**Editing Existing Node:**
1. Click "Edit" button on any custom node in palette (or right-click → Edit)
2. Zoom-in animation to that node's internal gameboard
3. Modify configuration
4. Click "Done" to zoom out (changes auto-saved)

**Puzzle Completion:**
1. Build solution on puzzle gameboard
2. Click "Submit" or auto-check if real-time validation
3. If correct → Success animation
4. Name and description revealed (puzzle nodes only)
5. Zoom-out animation - gameboard becomes a node
6. New node automatically added to palette
7. Next puzzle loads

### Node Parameters
- **Delay node**: Dropdown menu for subdivision (1/16, 1/8, 1/4, 1/2, 1 WTS)
- **Mix node**: Dropdown menu for mode (Add, Subtract, Average, Max, Min)
- **Threshold node**: Numeric input or slider for threshold value (-100 to +100)
- **All parameters**: Adjustable after node is placed

### Visual Feedback
- **Real-time waveform**: Output updates as player makes changes (puzzle gameboards)
- **Signal animation**: Pulses travel along wires in rhythm (1 WTS per wire)
- **Sync indicators**: Visual highlighting when signals arrive at merge points
- **Out-of-sync warning**: Shows when timing is misaligned
- **Error states**: Highlight disconnected required inputs or invalid configurations

## Technical Considerations

### Signal Propagation
- Signals must travel through wires in discrete time steps (WTS-based)
- Nodes evaluate instantly when all inputs are ready
- Multiple signals at different times handled as separate pulses
- Merge nodes collect and output signals as they arrive

### Waveform Representation
- Store waveforms as arrays of values sampled at appropriate resolution
- Cycle duration should be multiple of WTS for clean looping
- Interpolation for smooth visual display

### Performance
- Optimize for real-time signal processing visualization
- Efficient graph evaluation (topological sort, memoization)
- Canvas/WebGL for smooth waveform animation

### Difficulty Balancing
- **Early game**: Show target waveform continuously, live feedback
- **Mid game**: Show target but validate only on "Submit" button
- **Late game**: Show target briefly, player must remember or deduce

## Success Criteria

**For Puzzle Nodes:**
A puzzle is solved when:
- Output waveform matches target waveform within acceptable tolerance (±5 units)
- Match is sustained for at least 2 full cycles
- All validation test cases pass (multiple input waveforms tested)
- Timing is synchronized (no phase drift for timing-critical puzzles)

**For Utility Nodes:**
No success criteria - player saves whenever they want, with any configuration.

## Summary

This puzzle game creates a recursive, fractal experience where every puzzle builds a tool for future puzzles. The gameboard-centric design with zoom in/out navigation makes the nesting intuitive and visceral. Players build both solutions and their own problem-solving vocabulary.

**Key Pillars:**
1. **Recursive progression**: Every puzzle becomes a node
2. **Two-tier system**: Puzzle nodes (required) + Utility nodes (optional convenience)
3. **Consistent interface**: Same gameboard at every nesting level
4. **Multiple solutions**: Different implementations can pass validation
5. **Musical timing**: Rhythm-based signal flow creates intuitive puzzle mechanics

The combination of signal processing concepts, visual programming, and recursive tool-building creates a unique puzzle experience where understanding compounds with each level.
