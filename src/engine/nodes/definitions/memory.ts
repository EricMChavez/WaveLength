import { defineNode } from '../framework';
import type { NodeRuntimeState } from '../framework';

export interface MemoryState extends NodeRuntimeState {
  previousValue: number;
}

export function createMemoryState(): MemoryState {
  return { previousValue: 0 };
}

/**
 * Memory node: 1-cycle delay.
 * Outputs the previous cycle's input value.
 * On cycle 0, outputs 0 (initial state).
 */
export const memoryNode = defineNode({
  type: 'memory',
  category: 'timing',

  inputs: [{ name: 'A', gridPosition: 0 }],
  outputs: [{ name: 'Out', gridPosition: 0 }],

  createState: createMemoryState,

  evaluate: ({ inputs, state }) => {
    const s = state as MemoryState;
    const output = s.previousValue;
    s.previousValue = inputs[0];
    return [output];
  },

  size: { width: 3, height: 2 },
});
