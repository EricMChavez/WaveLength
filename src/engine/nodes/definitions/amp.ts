import { defineNode } from '../framework';
import { clamp } from '../../../shared/math';

export type AmpParams = { gain: number };

export const ampNode = defineNode<AmpParams>({
  type: 'amp',
  category: 'math',

  inputs: [
    { name: 'A', gridPosition: 0 },
    { name: 'X', description: 'Gain control', side: 'bottom', knob: 'gain' },
  ],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  params: [
    { key: 'gain', type: 'number', default: 0, label: 'Gain', min: -100, max: 100, step: 25 },
  ],

  evaluate: ({ inputs }) => {
    const [a, x] = inputs;
    return [clamp(a * (1 + x / 100))];
  },

  size: { width: 4, height: 3 },
});
