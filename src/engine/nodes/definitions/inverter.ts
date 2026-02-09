import { defineNode } from '../framework';
import { clamp } from '../../../shared/math';

export const inverterNode = defineNode({
  type: 'inverter',
  category: 'math',

  inputs: [{ name: 'A', gridPosition: 0 }],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  evaluate: ({ inputs }) => [clamp(-inputs[0])],

  size: { width: 3, height: 2 },
});
