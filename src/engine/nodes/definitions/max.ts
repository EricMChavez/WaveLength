import { defineNode } from '../framework';

/** Returns the larger of two input signals */
export const maxNode = defineNode({
  type: 'max',
  category: 'math',

  inputs: [
    { name: 'A', gridPosition: 0 },
    { name: 'B', gridPosition: 1 },
  ],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  evaluate: ({ inputs }) => {
    const [a, b] = inputs;
    return [Math.max(a, b)];
  },

  size: { width: 2, height: 2 },
});
