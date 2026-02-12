import { defineNode } from '../framework';
import { clamp } from '../../../shared/math';

export type AddParams = { amount: number };

export const addNode = defineNode<AddParams>({
  type: 'add',
  category: 'math',

  inputs: [
    { name: 'A' },
    { name: 'X', description: 'Add amount', side: 'bottom', knob: 'amount' },
  ],
  outputs: [{ name: 'Out' }],

  params: [
    { key: 'amount', type: 'number', default: 0, label: 'Amount', min: -100, max: 100, step: 25 },
  ],

  evaluate: ({ inputs }) => {
    const [a, x] = inputs;
    return [clamp(a + x)];
  },

  size: { width: 4, height: 3 },
});
