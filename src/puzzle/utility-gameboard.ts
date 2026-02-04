import type { GameboardState } from '../shared/types/index.ts';
import { createConnectionPointNode } from './connection-point-nodes.ts';
import { CONNECTION_POINT_CONFIG } from '../shared/constants/index.ts';

/**
 * Create a blank gameboard for editing a utility node.
 * Includes 3 input + 3 output connection point nodes (matching standard gameboard layout).
 */
export function createUtilityGameboard(utilityId: string): GameboardState {
  const nodes = new Map<string, import('../shared/types/index.ts').NodeState>();

  for (let i = 0; i < CONNECTION_POINT_CONFIG.INPUT_COUNT; i++) {
    const cp = createConnectionPointNode('input', i);
    nodes.set(cp.id, cp);
  }

  for (let i = 0; i < CONNECTION_POINT_CONFIG.OUTPUT_COUNT; i++) {
    const cp = createConnectionPointNode('output', i);
    nodes.set(cp.id, cp);
  }

  return {
    id: `utility-${utilityId}`,
    nodes,
    wires: [],
  };
}
