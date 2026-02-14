import type { PuzzleDefinition, WaveformDef, ConnectionPointConfig, SlotConfig } from '../types.ts';
import { generateWaveformValue } from '../waveform-generators.ts';

// =============================================================================
// Reusable waveform definitions
// =============================================================================

const SINE_FULL_100: WaveformDef = {
  shape: 'sine-full', amplitude: 100, period: 256, phase: 0, offset: 0,
};

const SINE_HALF_50: WaveformDef = {
  shape: 'sine-half', amplitude: 50, period: 128, phase: 0, offset: 0,
};

const TRIANGLE_FULL_100: WaveformDef = {
  shape: 'triangle-full', amplitude: 100, period: 256, phase: 0, offset: 0,
};

// =============================================================================
// Computed sample arrays for nonlinear transforms
// =============================================================================

/** Level 4: Half-wave rectified sine — max(sine, 0) */
const RECTIFIED_SAMPLES: number[] = Array.from({ length: 256 }, (_, i) => {
  const v = generateWaveformValue(i, SINE_FULL_100);
  return Math.round(Math.max(0, v) * 100) / 100;
});

/** Level 5: Square wave via threshold at 0 — sine >= 0 ? +100 : -100 */
const THRESHOLD_SQUARE_SAMPLES: number[] = Array.from({ length: 256 }, (_, i) => {
  const v = generateWaveformValue(i, SINE_FULL_100);
  return v >= 0 ? 100 : -100;
});

// =============================================================================
// Connection point layouts
// =============================================================================

/** 1 centered input, 1 centered output */
const CP_1IN_1OUT_CENTERED: ConnectionPointConfig = {
  left: [
    { active: false, direction: 'input' },
    { active: true, direction: 'input', cpIndex: 0 },
    { active: false, direction: 'input' },
  ],
  right: [
    { active: false, direction: 'output' },
    { active: true, direction: 'output', cpIndex: 0 },
    { active: false, direction: 'output' },
  ],
};

/** 1 centered input, 2 outputs (top + bottom) */
const CP_1IN_2OUT: ConnectionPointConfig = {
  left: [
    { active: false, direction: 'input' },
    { active: true, direction: 'input', cpIndex: 0 },
    { active: false, direction: 'input' },
  ],
  right: [
    { active: true, direction: 'output', cpIndex: 0 },
    { active: false, direction: 'output' },
    { active: true, direction: 'output', cpIndex: 1 },
  ],
};

// =============================================================================
// Slot configs (flat 0-5 index)
// =============================================================================

/** 1 centered input (slot 1), 1 centered output (slot 4) */
const SLOT_1IN_1OUT_CENTERED: SlotConfig = [
  { active: false, direction: 'input' },
  { active: true, direction: 'input' },
  { active: false, direction: 'input' },
  { active: false, direction: 'output' },
  { active: true, direction: 'output' },
  { active: false, direction: 'output' },
];

/** 1 centered input (slot 1), 2 outputs (slots 3 + 5) */
const SLOT_1IN_2OUT: SlotConfig = [
  { active: false, direction: 'input' },
  { active: true, direction: 'input' },
  { active: false, direction: 'input' },
  { active: true, direction: 'output' },
  { active: false, direction: 'output' },
  { active: true, direction: 'output' },
];

export const DEVORCE: PuzzleDefinition = {
  id: 'devorce',
  title: 'Devorce',
  description: 'Join the two waves then split them',
  activeInputs: 2,
  activeOutputs: 2,
  allowedNodes: { offset: 1, scale: 0, threshold: 0, max: 1, min: 1, split: 1, memory: 0, custom: 0 },
  testCases: [
    {
      name: 'Devorce',
      inputs: [
        {
          shape: 'square-half',
          amplitude: 50,
          period: 128,
          phase: 0,
          offset: 0,
        },
        {
          shape: 'sine-quarter',
          amplitude: 50,
          period: 64,
          phase: 0,
          offset: 0,
        }
      ],
      expectedOutputs: [
        {
          shape: 'samples',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
          samples: [50, 54.9, 59.75, 64.51, 69.13, 73.57, 77.78, 81.72, 85.36, 88.65, 91.57, 94.1, 96.19, 97.85, 99.04, 99.76, 100, 99.76, 99.04, 97.85, 96.19, 94.1, 91.57, 88.65, 85.36, 81.72, 77.78, 73.57, 69.13, 64.51, 59.75, 54.9, 50, 45.1, 40.25, 35.49, 30.87, 26.43, 22.22, 18.28, 14.64, 11.35, 8.43, 5.9, 3.81, 2.15, 0.96, 0.24, 0, 0.24, 0.96, 2.15, 3.81, 5.9, 8.43, 11.35, 14.64, 18.28, 22.22, 26.43, 30.87, 35.49, 40.25, 45.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 54.9, 59.75, 64.51, 69.13, 73.57, 77.78, 81.72, 85.36, 88.65, 91.57, 94.1, 96.19, 97.85, 99.04, 99.76, 100, 99.76, 99.04, 97.85, 96.19, 94.1, 91.57, 88.65, 85.36, 81.72, 77.78, 73.57, 69.13, 64.51, 59.75, 54.9, 50, 45.1, 40.25, 35.49, 30.87, 26.43, 22.22, 18.28, 14.64, 11.35, 8.43, 5.9, 3.81, 2.15, 0.96, 0.24, 0, 0.24, 0.96, 2.15, 3.81, 5.9, 8.43, 11.35, 14.64, 18.28, 22.22, 26.43, 30.87, 35.49, 40.25, 45.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        {
          shape: 'samples',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
          samples: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -50, -45.1, -40.25, -35.49, -30.87, -26.43, -22.22, -18.28, -14.64, -11.35, -8.43, -5.9, -3.81, -2.15, -0.96, -0.24, 0, -0.24, -0.96, -2.15, -3.81, -5.9, -8.43, -11.35, -14.64, -18.28, -22.22, -26.43, -30.87, -35.49, -40.25, -45.1, -50, -54.9, -59.75, -64.51, -69.13, -73.57, -77.78, -81.72, -85.36, -88.65, -91.57, -94.1, -96.19, -97.85, -99.04, -99.76, -100, -99.76, -99.04, -97.85, -96.19, -94.1, -91.57, -88.65, -85.36, -81.72, -77.78, -73.57, -69.13, -64.51, -59.75, -54.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -50, -45.1, -40.25, -35.49, -30.87, -26.43, -22.22, -18.28, -14.64, -11.35, -8.43, -5.9, -3.81, -2.15, -0.96, -0.24, 0, -0.24, -0.96, -2.15, -3.81, -5.9, -8.43, -11.35, -14.64, -18.28, -22.22, -26.43, -30.87, -35.49, -40.25, -45.1, -50, -54.9, -59.75, -64.51, -69.13, -73.57, -77.78, -81.72, -85.36, -88.65, -91.57, -94.1, -96.19, -97.85, -99.04, -99.76, -100, -99.76, -99.04, -97.85, -96.19, -94.1, -91.57, -88.65, -85.36, -81.72, -77.78, -73.57, -69.13, -64.51, -59.75, -54.9],
        }
      ],
    },
  ],
  slotConfig: [
    { active: true, direction: 'input' },
    { active: false, direction: 'input' },
    { active: true, direction: 'input' },
    { active: true, direction: 'output' },
    { active: false, direction: 'input' },
    { active: true, direction: 'output' },
  ],
  connectionPoints: {
    left: [
      { active: true, direction: 'input', cpIndex: 0 },
      { active: false, direction: 'input' },
      { active: true, direction: 'input', cpIndex: 1 },
    ],
    right: [
      { active: true, direction: 'output', cpIndex: 0 },
      { active: false, direction: 'input' },
      { active: true, direction: 'output', cpIndex: 1 },
    ],
  },
  tutorialTitle: 'Divorce',
  tutorialMessage: 'Join the two waves then split them',
};

export const JOLT: PuzzleDefinition = {
  id: 'jolt',
  title: 'Jolt',
  description: 'Sawtooths are for cutting',
  activeInputs: 2,
  activeOutputs: 2,
  allowedNodes: { offset: 1, scale: 2, threshold: 1, max: 0, min: 0, split: 1, memory: 0, custom: 0 },
  testCases: [
    {
      name: 'Jolt',
      inputs: [
        {
          shape: 'sine-full',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
        },
        {
          shape: 'sawtooth-sixth',
          amplitude: 25,
          period: 42.67,
          phase: 0,
          offset: 0,
        }
      ],
      expectedOutputs: [
        {
          shape: 'samples',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
          samples: [0, -2.45, -4.91, -7.36, -9.8, -12.24, -14.67, -17.1, -19.51, -21.91, -24.3, -26.67, -29.03, -31.37, -33.69, -35.99, -38.27, -40.52, -42.76, -44.96, -47.14, -49.29, -51.41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -88.19, -89.32, -90.4, -91.42, -92.39, -93.3, -94.15, -94.95, -95.69, -96.38, -97, -97.57, -98.08, -98.53, -98.92, -99.25, -99.52, -99.73, -99.88, -99.97, -100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -84.49, -83.15, -81.76, -80.32, -78.83, -77.3, -75.72, -74.1, -72.42, -70.71, -68.95, -67.16, -65.32, -63.44, -61.52, -59.57, -57.58, -55.56, -53.5, -51.41, -49.29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.45, 4.91, 7.36, 9.8, 12.24, 14.67, 17.1, 19.51, 21.91, 24.3, 26.67, 29.03, 31.37, 33.69, 35.99, 38.27, 40.52, 42.76, 44.96, 47.14, 49.29, 51.41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88.19, 89.32, 90.4, 91.42, 92.39, 93.3, 94.15, 94.95, 95.69, 96.38, 97, 97.57, 98.08, 98.53, 98.92, 99.25, 99.52, 99.73, 99.88, 99.97, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84.49, 83.15, 81.76, 80.32, 78.83, 77.3, 75.72, 74.1, 72.42, 70.71, 68.95, 67.16, 65.32, 63.44, 61.52, 59.57, 57.58, 55.56, 53.5, 51.41, 49.29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        {
          shape: 'samples',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
          samples: [0, 2.45, 4.91, 7.36, 9.8, 12.24, 14.67, 17.1, 19.51, 21.91, 24.3, 26.67, 29.03, 31.37, 33.69, 35.99, 38.27, 40.52, 42.76, 44.96, 47.14, 49.29, 51.41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88.19, 89.32, 90.4, 91.42, 92.39, 93.3, 94.15, 94.95, 95.69, 96.38, 97, 97.57, 98.08, 98.53, 98.92, 99.25, 99.52, 99.73, 99.88, 99.97, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84.49, 83.15, 81.76, 80.32, 78.83, 77.3, 75.72, 74.1, 72.42, 70.71, 68.95, 67.16, 65.32, 63.44, 61.52, 59.57, 57.58, 55.56, 53.5, 51.41, 49.29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2.45, -4.91, -7.36, -9.8, -12.24, -14.67, -17.1, -19.51, -21.91, -24.3, -26.67, -29.03, -31.37, -33.69, -35.99, -38.27, -40.52, -42.76, -44.96, -47.14, -49.29, -51.41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -88.19, -89.32, -90.4, -91.42, -92.39, -93.3, -94.15, -94.95, -95.69, -96.38, -97, -97.57, -98.08, -98.53, -98.92, -99.25, -99.52, -99.73, -99.88, -99.97, -100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -84.49, -83.15, -81.76, -80.32, -78.83, -77.3, -75.72, -74.1, -72.42, -70.71, -68.95, -67.16, -65.32, -63.44, -61.52, -59.57, -57.58, -55.56, -53.5, -51.41, -49.29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }
      ],
    },
  ],
  slotConfig: [
    { active: true, direction: 'input' },
    { active: true, direction: 'input' },
    { active: false, direction: 'input' },
    { active: false, direction: 'input' },
    { active: true, direction: 'output' },
    { active: true, direction: 'output' },
  ],
  connectionPoints: {
    left: [
      { active: true, direction: 'input', cpIndex: 0 },
      { active: true, direction: 'input', cpIndex: 1 },
      { active: false, direction: 'input' },
    ],
    right: [
      { active: false, direction: 'input' },
      { active: true, direction: 'output', cpIndex: 0 },
      { active: true, direction: 'output', cpIndex: 1 },
    ],
  },
  tutorialTitle: 'YOU GOT THIS',
  tutorialMessage: '♡ I believe in you! ♡',
};


// =============================================================================
// TUTORIAL LEVELS
// =============================================================================

// Level 1: Direct wiring — connect input to output
export const TUTORIAL_01: PuzzleDefinition = {
  id: 'tutorial-01',
  title: 'First Signal',
  description: 'Connect the input directly to the output.',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: {},
  testCases: [
    {
      name: 'Pass-through',
      inputs: [SINE_FULL_100],
      expectedOutputs: [SINE_FULL_100],
    },
  ],
  slotConfig: SLOT_1IN_1OUT_CENTERED,
  connectionPoints: CP_1IN_1OUT_CENTERED,
  tutorialTitle: 'First Signal',
  tutorialMessage: 'Connect the input to the output. Click a port on the left, then click the port on the right to draw a wire.',
};

// Level 2: Offset node + parameter adjustment (node pre-placed)
export const TUTORIAL_02: PuzzleDefinition = {
  id: 'tutorial-02',
  title: 'Shift',
  description: 'Use the Offset node to shift the signal up by 50.',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: {},
  testCases: [
    {
      name: 'Offset +50',
      inputs: [SINE_HALF_50],
      expectedOutputs: [
        { shape: 'sine-half', amplitude: 50, period: 128, phase: 0, offset: 50 },
      ],
    },
  ],
  slotConfig: SLOT_1IN_1OUT_CENTERED,
  connectionPoints: CP_1IN_1OUT_CENTERED,
  initialNodes: [
    {
      id: 'b1e2f3a4-5678-9abc-def0-111111111111',
      type: 'offset',
      position: { col: 30, row: 16 },
      params: {},
      inputCount: 2,
      outputCount: 1,
    },
  ],
  tutorialTitle: 'Shift',
  tutorialMessage: 'The Offset node adds a constant to the signal. Wire the input through the node to the output. Select the node and press Enter to adjust its knob.',
};

// Level 3: Scale node from palette
export const TUTORIAL_03: PuzzleDefinition = {
  id: 'tutorial-03',
  title: 'Attenuator',
  description: 'Reduce the signal to half strength using a Scale node.',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: { scale: 1 },
  testCases: [
    {
      name: 'Half strength',
      inputs: [TRIANGLE_FULL_100],
      expectedOutputs: [
        { shape: 'triangle-full', amplitude: 50, period: 256, phase: 0, offset: 0 },
      ],
    },
  ],
  slotConfig: SLOT_1IN_1OUT_CENTERED,
  connectionPoints: CP_1IN_1OUT_CENTERED,
  tutorialTitle: 'Attenuator',
  tutorialMessage: 'Press N to open the node palette. Place a Scale node and wire it between input and output. The Scale knob controls signal strength as a percentage.',
};

// Level 4: Max node — half-wave rectifier (node pre-placed)
export const TUTORIAL_04: PuzzleDefinition = {
  id: 'tutorial-04',
  title: 'Rectifier',
  description: 'Clip the negative half of the signal using the Max node.',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: {},
  testCases: [
    {
      name: 'Half-wave rectify',
      inputs: [SINE_FULL_100],
      expectedOutputs: [
        {
          shape: 'samples',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
          samples: RECTIFIED_SAMPLES,
        },
      ],
    },
  ],
  slotConfig: SLOT_1IN_1OUT_CENTERED,
  connectionPoints: CP_1IN_1OUT_CENTERED,
  initialNodes: [
    {
      id: 'c2d3e4f5-6789-abcd-ef01-222222222222',
      type: 'max',
      position: { col: 31, row: 17 },
      params: {},
      inputCount: 2,
      outputCount: 1,
    },
  ],
  tutorialTitle: 'Rectifier',
  tutorialMessage: 'The Max node outputs the larger of two inputs. Unconnected inputs default to zero. Use this to clip the negative half of the signal.',
};

// Level 5: Threshold node — square wave from palette
export const TUTORIAL_05: PuzzleDefinition = {
  id: 'tutorial-05',
  title: 'Square Wave',
  description: 'Convert a sine wave to a square wave using a Threshold node.',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: { threshold: 1 },
  testCases: [
    {
      name: 'Threshold at 0',
      inputs: [SINE_FULL_100],
      expectedOutputs: [
        {
          shape: 'samples',
          amplitude: 100,
          period: 256,
          phase: 0,
          offset: 0,
          samples: THRESHOLD_SQUARE_SAMPLES,
        },
      ],
    },
  ],
  slotConfig: SLOT_1IN_1OUT_CENTERED,
  connectionPoints: CP_1IN_1OUT_CENTERED,
  tutorialTitle: 'Square Wave',
  tutorialMessage: 'The Threshold node outputs +100 when the signal is at or above the threshold level, and -100 when below.',
};

// Level 6: Split node + scale for inversion (capstone)
export const TUTORIAL_06: PuzzleDefinition = {
  id: 'tutorial-06',
  title: 'Two Paths',
  description: 'Split a signal and send an inverted copy to the second output.',
  activeInputs: 1,
  activeOutputs: 2,
  allowedNodes: { scale: 1 },
  testCases: [
    {
      name: 'Split and invert',
      inputs: [SINE_FULL_100],
      expectedOutputs: [
        SINE_FULL_100,
        { shape: 'sine-full', amplitude: 100, period: 256, phase: 128, offset: 0 },
      ],
    },
  ],
  slotConfig: SLOT_1IN_2OUT,
  connectionPoints: CP_1IN_2OUT,
  initialNodes: [
    {
      id: 'd3e4f5a6-789a-bcde-f012-333333333333',
      type: 'split',
      position: { col: 25, row: 17 },
      params: {},
      inputCount: 1,
      outputCount: 2,
    },
  ],
  tutorialTitle: 'Two Paths',
  tutorialMessage: 'The Split node duplicates a signal to two outputs. Send the original to one output and an inverted copy to the other.',
};
