import { defineNode } from '../framework';

/** Flips the polarity of the input signal: output = -input */
export const negateNode = defineNode({
  type: 'negate',
  category: 'math',

  inputs: [{ name: 'A', gridPosition: 0 }],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  evaluate: ({ inputs }) => {
    const [a] = inputs;
    return [-a];
  },

  size: { width: 3, height: 1 },
});
