import { defineNode } from '../framework';

/** Duplicates the input to two outputs */
export const splitNode = defineNode({
  type: 'split',
  category: 'routing',

  inputs: [
    { name: 'A', side: 'left', gridPosition: 1 },
  ],
  outputs: [
    { name: 'X', side: 'right', gridPosition: 0 },
    { name: 'Y', side: 'right', gridPosition: 1 },
  ],

  evaluate: ({ inputs }) => {
    const [a] = inputs;
    return [a, a];
  },

  size: { width: 3, height:1},
});
