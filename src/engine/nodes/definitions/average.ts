import { defineChip } from '../framework';
import { clamp } from '../../../shared/math';

/** Averages two input signals */
export const averageChip = defineChip({
  type: 'average',
  category: 'math',
  description: 'Averages two signals',

  sockets: [
    { name: 'A', gridPosition: 0 },
    { name: 'B', gridPosition: 1 },
  ],
  plugs: [{ name: 'Out', gridPosition: 0 }],

  evaluate: ({ inputs }) => {
    const [a, b] = inputs;
    return [clamp((a + b) / 2)];
  },

  size: { width: 2, height: 2 },
});
