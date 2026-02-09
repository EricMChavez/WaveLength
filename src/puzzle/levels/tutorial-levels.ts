import type { PuzzleDefinition } from '../types.ts';

export const INVERTER: PuzzleDefinition = {
  id: 'inverter',
  title: 'Inverter',
  description: 'Flip the signal\'s polarity',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: null,
  testCases: [
    {
      name: 'Inverter',
      inputs: [
        {
          shape: 'dual-wave',
          amplitude: 100,
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
          samples: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 0, -6.25, -12.5, -18.75, -25, -31.25, -37.5, -43.75, -50, -56.25, -62.5, -68.75, -75, -81.25, -87.5, -93.75, -100, -93.75, -87.5, -81.25, -75, -68.75, -62.5, -56.25, -50, -43.75, -37.5, -31.25, -25, -18.75, -12.5, -6.25, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 0, -6.25, -12.5, -18.75, -25, -31.25, -37.5, -43.75, -50, -56.25, -62.5, -68.75, -75, -81.25, -87.5, -93.75, -100, -93.75, -87.5, -81.25, -75, -68.75, -62.5, -56.25, -50, -43.75, -37.5, -31.25, -25, -18.75, -12.5, -6.25, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 0, -6.25, -12.5, -18.75, -25, -31.25, -37.5, -43.75, -50, -56.25, -62.5, -68.75, -75, -81.25, -87.5, -93.75, -100, -93.75, -87.5, -81.25, -75, -68.75, -62.5, -56.25, -50, -43.75, -37.5, -31.25, -25, -18.75, -12.5, -6.25, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 0, -6.25, -12.5, -18.75, -25, -31.25, -37.5, -43.75, -50, -56.25, -62.5, -68.75, -75, -81.25, -87.5, -93.75, -100, -93.75, -87.5, -81.25, -75, -68.75, -62.5, -56.25, -50, -43.75, -37.5, -31.25, -25, -18.75, -12.5, -6.25, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        }
      ],
    },
  ],
  connectionPoints: {
    left: [
      { active: false, direction: 'input' },
      { active: true, direction: 'input', cpIndex: 0 },
      { active: false, direction: 'input' },
    ],
    right: [
      { active: false, direction: 'input' },
      { active: true, direction: 'output', cpIndex: 0 },
      { active: false, direction: 'input' },
    ],
  },
};


export const POLARIZER: PuzzleDefinition = {
  id: 'polarizer',
  title: 'Polarizer',
  description: 'Transform a sine wave into a square wave',
  activeInputs: 1,
  activeOutputs: 1,
  allowedNodes: null,
  testCases: [
    {
      name: 'Polarizer',
      inputs: [
        {
          shape: 'sine',
          amplitude: 100,
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
          samples: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        }
      ],
    },
  ],
  connectionPoints: {
    left: [
      { active: false, direction: 'input' },
      { active: true, direction: 'input', cpIndex: 0 },
      { active: false, direction: 'input' },
    ],
    right: [
      { active: false, direction: 'input' },
      { active: true, direction: 'output', cpIndex: 0 },
      { active: false, direction: 'input' },
    ],
  },
};

// =============================================================================
// TUTORIAL LEVELS
// Created via Creative Mode > Export
// =============================================================================

// Paste exported tutorial level definitions below.
// Each level should be a named export of type PuzzleDefinition.
//
// Example format:
//
// export const TUTORIAL_EXAMPLE: PuzzleDefinition = {
//   id: 'tutorial-example',
//   title: 'Example',
//   description: 'Description of what the player needs to do.',
//   activeInputs: 1,
//   activeOutputs: 1,
//   allowedNodes: null,  // or ['mix', 'multiply', ...] to restrict
//   testCases: [
//     {
//       name: 'Test Case 1',
//       inputs: [
//         { shape: 'sine', amplitude: 100, period: 64, phase: 0, offset: 0 },
//       ],
//       expectedOutputs: [
//         {
//           shape: 'samples',
//           amplitude: 100,
//           period: 256,
//           phase: 0,
//           offset: 0,
//           samples: [/* ... paste sample array here ... */],
//         },
//       ],
//     },
//   ],
//   // Optional: custom connection point layout
//   // connectionPoints: {
//   //   left: [
//   //     { active: false, direction: 'input' },
//   //     { active: true, direction: 'input', cpIndex: 0 },
//   //     { active: false, direction: 'input' },
//   //   ],
//   //   right: [
//   //     { active: false, direction: 'input' },
//   //     { active: true, direction: 'output', cpIndex: 0 },
//   //     { active: false, direction: 'input' },
//   //   ],
//   // },
// };
