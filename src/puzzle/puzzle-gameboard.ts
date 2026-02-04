import type { GameboardState, NodeState } from '../shared/types/index.ts';
import type { PuzzleDefinition } from './types.ts';
import { createConnectionPointNode } from './connection-point-nodes.ts';

/** Create a gameboard pre-populated with virtual CP nodes for the given puzzle */
export function createPuzzleGameboard(puzzle: PuzzleDefinition): GameboardState {
  const nodes = new Map<string, NodeState>();

  for (let i = 0; i < puzzle.activeInputs; i++) {
    const node = createConnectionPointNode('input', i);
    nodes.set(node.id, node);
  }
  for (let i = 0; i < puzzle.activeOutputs; i++) {
    const node = createConnectionPointNode('output', i);
    nodes.set(node.id, node);
  }

  return { id: `puzzle-${puzzle.id}`, nodes, wires: [] };
}
