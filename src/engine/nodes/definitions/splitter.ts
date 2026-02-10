import { defineNode } from '../framework';

/** Duplicates the input to two outputs */
export const splitterNode = defineNode({
  type: 'splitter',
  category: 'routing',

  inputs: [
    { name: 'A', side: 'left', gridPosition: 1 },
  ],
  outputs: [
    { name: 'X', side: 'right', gridPosition: 0 },
    { name: 'Y', side: 'right', gridPosition: 2 },
  ],

  evaluate: ({ inputs }) => {
    const [a] = inputs;
    const y = a;
    const z = a;
    return [y, z];
  },

  size: { width: 2, height: 2
   },
});