import { defineNode } from '../framework';
import { clamp } from '../../../shared/math';

export const polarizerNode = defineNode({
  type: 'polarizer',
  category: 'math',

  inputs: [{ name: 'A', gridPosition: 0 }],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  evaluate: ({ inputs }) => {
    const a = inputs[0];
    return [clamp(a > 0 ? 100 : a < 0 ? -100 : 0)];
  },

  size: { width: 3, height: 2 },
});
