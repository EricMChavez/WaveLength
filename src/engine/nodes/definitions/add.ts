import { defineNode } from '../framework';
import { clamp } from '../../../shared/math';

/** Adds two input signals together */
export const addNode = defineNode({
  type: 'add',
  category: 'math',

  inputs: [
    { name: 'A', gridPosition: 0 },
    { name: 'B', gridPosition: 1 },
  ],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  evaluate: ({ inputs }) => {
    const [a, b] = inputs;
    return [clamp(a + b)];
  },

  size: { width: 2, height: 2 },
});
