import type { TutorialStep } from '../store/slices/tutorial-slice.ts';

/**
 * Tutorial steps for the interactive tutorial.
 *
 * Phase 1 (steps 0-4): Wiring & meters — passthrough puzzle
 * Phase 2 (steps 5-11): Chips & knobs — offset +50 puzzle
 *
 * Grid reference (puzzle board):
 *   Left meters: cols 0-9
 *   Playable area: cols 10-55
 *   Right meters: cols 56-65
 *   Input CP (middle slot): ~col 10, row 18
 *   Output CP (middle slot): ~col 55, row 18
 */

export const TUTORIAL_STEPS: TutorialStep[] = [
  // =========================================================================
  // Phase 1: Wiring & Meters (passthrough test case)
  // =========================================================================

  // Step 0: Welcome
  {
    id: 'welcome',
    text: 'Welcome! Match the input signal to the target output.',
    subtext: 'Click anywhere to continue.',
    highlight: { type: 'none' },
    tooltipPosition: 'center',
    advanceOn: { type: 'click-anywhere' },
  },

  // Step 1: Input meters
  {
    id: 'input-meters',
    text: 'This is your input signal.',
    subtext: 'The waveform shows what enters the board.',
    highlight: { type: 'meter-zone', side: 'left', slotIndex: 1 },
    tooltipPosition: 'right',
    advanceOn: { type: 'click-anywhere' },
  },

  // Step 2: Output meters
  {
    id: 'output-meters',
    text: 'This is your target output (dashed line).',
    subtext: 'Match your output to this shape to win.',
    highlight: { type: 'meter-zone', side: 'right', slotIndex: 1 },
    tooltipPosition: 'left',
    advanceOn: { type: 'click-anywhere' },
  },

  // Step 3: Draw wire
  {
    id: 'draw-wire',
    text: 'Click the input port, then the output port to draw a wire.',
    highlight: { type: 'full-board' },
    tooltipPosition: 'above',
    cursor: {
      path: [
        { col: 11, row: 18 },
        { col: 33, row: 18 },
        { col: 54, row: 18 },
      ],
      clickAtEnd: true,
      durationMs: 2000,
      delayMs: 500,
      loop: true,
    },
    advanceOn: { type: 'wire-created' },
  },

  // Step 4: Success!
  {
    id: 'phase1-success',
    text: 'The output matches! You solved it.',
    subtext: 'Click anywhere to continue.',
    highlight: { type: 'meter-zone', side: 'right', slotIndex: 1 },
    tooltipPosition: 'left',
    advanceOn: { type: 'click-anywhere' },
  },

  // =========================================================================
  // Phase 2: Chips & Knobs (offset +50 test case)
  // =========================================================================

  // Step 5: Setup — undo the wire
  {
    id: 'undo-wire',
    text: "Now let's try something harder. Press Ctrl+Z to undo.",
    highlight: { type: 'full-board' },
    tooltipPosition: 'center',
    advanceOn: { type: 'wire-removed' },
  },

  // Step 6: Open palette
  {
    id: 'open-palette',
    text: 'Press N to open the chip palette.',
    highlight: { type: 'full-board' },
    tooltipPosition: 'center',
    advanceOn: { type: 'overlay-opened', overlayType: 'palette' },
    allowOverlays: true,
  },

  // Step 7: Place offset chip
  {
    id: 'place-chip',
    text: 'Select the Offset chip and place it on the board.',
    highlight: { type: 'full-board' },
    tooltipPosition: 'above',
    advanceOn: { type: 'node-placed', nodeType: 'offset' },
    allowOverlays: true,
    hideWhileOverlay: true,
  },

  // Step 8: Wire input → chip
  {
    id: 'wire-input-to-chip',
    text: 'Wire the input port to the chip.',
    highlight: { type: 'full-board' },
    tooltipPosition: 'above',
    cursor: {
      path: [
        { col: 11, row: 18 },
        { col: 25, row: 18 },
      ],
      clickAtEnd: true,
      durationMs: 1500,
      delayMs: 500,
      loop: true,
    },
    advanceOn: { type: 'wire-created' },
  },

  // Step 9: Wire chip → output
  {
    id: 'wire-chip-to-output',
    text: "Wire the chip's output to the board output.",
    highlight: { type: 'full-board' },
    tooltipPosition: 'above',
    cursor: {
      path: [
        { col: 40, row: 18 },
        { col: 54, row: 18 },
      ],
      clickAtEnd: true,
      durationMs: 1500,
      delayMs: 500,
      loop: true,
    },
    advanceOn: { type: 'wire-created' },
  },

  // Step 10: Adjust knob
  {
    id: 'adjust-knob',
    text: 'Select the chip and press Enter to adjust the knob. Set it to +50.',
    highlight: { type: 'full-board' },
    tooltipPosition: 'above',
    advanceOn: { type: 'validation-pass' },
    allowOverlays: true,
    hideWhileOverlay: true,
  },

  // Step 11: Complete!
  {
    id: 'complete',
    text: "You're ready! Click to return to the main board.",
    subtext: 'Every puzzle you solve becomes a reusable chip.',
    highlight: { type: 'none' },
    tooltipPosition: 'center',
    advanceOn: { type: 'click-anywhere' },
  },
];
