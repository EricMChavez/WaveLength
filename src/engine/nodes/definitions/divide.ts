import { defineNode } from '../framework';

/** Splits the input 50/50 across two outputs */
export const divideNode = defineNode({
  type: 'divide',
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
    return [a / 2, a / 2];
  },

  size: { width: 3, height: 1 },
});
