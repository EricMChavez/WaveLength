import { defineNode } from '../framework';
import { clamp } from '../../../shared/math';

export type ScaleParams = { factor: number };

export const scaleNode = defineNode<ScaleParams>({
  type: 'scale',
  category: 'math',
  description: 'Multiplies signal strength by a percentage',

  inputs: [
    { name: 'A', gridPosition: 0 },
    { name: 'X', description: 'Scale factor', side: 'bottom', knob: 'factor' },
  ],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  params: [
    { key: 'factor', type: 'number', default: 100, label: 'Factor', min: -100, max: 100, step: 25 },
  ],

  evaluate: ({ inputs }) => {
    const [a, x] = inputs;
    return [clamp(a * x / 100)];
  },

  size: { width: 4, height: 3 },
});
