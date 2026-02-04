import type { GameboardState, NodeState, Wire } from '../shared/types/index.ts';
import type { BakeMetadata } from '../engine/baking/index.ts';
import { createConnectionPointNode } from './connection-point-nodes.ts';
import { NODE_CONFIG } from '../shared/constants/index.ts';
import { isConnectionPointNode } from './connection-point-nodes.ts';

const COL_SPACING = NODE_CONFIG.WIDTH + 60;
const ROW_SPACING = NODE_CONFIG.HEIGHT + 30;
const LEFT_MARGIN = 120;
const TOP_MARGIN = 80;

/**
 * Reconstruct a read-only GameboardState from bake metadata.
 * Used for viewing puzzle node internals.
 *
 * Layout strategy:
 * - Input CPs: left column
 * - Processing nodes: topological order across middle columns
 * - Output CPs: right column
 */
export function gameboardFromBakeMetadata(
  puzzleId: string,
  metadata: BakeMetadata,
): GameboardState {
  const nodes = new Map<string, NodeState>();

  // Create input CP nodes
  for (let i = 0; i < metadata.inputCount; i++) {
    const cp = createConnectionPointNode('input', i);
    nodes.set(cp.id, cp);
  }

  // Create output CP nodes
  for (let i = 0; i < metadata.outputCount; i++) {
    const cp = createConnectionPointNode('output', i);
    nodes.set(cp.id, cp);
  }

  // Create processing nodes from nodeConfigs, laid out in topo order
  const processingConfigs = metadata.nodeConfigs.filter(
    (cfg) => !isConnectionPointNode(cfg.id),
  );

  // Determine columns: spread processing nodes across columns
  const nodesPerColumn = Math.max(1, Math.ceil(Math.sqrt(processingConfigs.length)));
  for (let i = 0; i < processingConfigs.length; i++) {
    const cfg = processingConfigs[i];
    const col = Math.floor(i / nodesPerColumn);
    const row = i % nodesPerColumn;

    const node: NodeState = {
      id: cfg.id,
      type: cfg.type,
      position: {
        x: LEFT_MARGIN + (col + 1) * COL_SPACING,
        y: TOP_MARGIN + row * ROW_SPACING,
      },
      params: { ...cfg.params },
      inputCount: cfg.inputCount,
      outputCount: cfg.outputCount,
    };
    nodes.set(cfg.id, node);
  }

  // Build wires from edges
  const wires: Wire[] = metadata.edges.map((edge, i) => ({
    id: `viewer-wire-${i}`,
    from: { nodeId: edge.fromNodeId, portIndex: edge.fromPort, side: 'output' as const },
    to: { nodeId: edge.toNodeId, portIndex: edge.toPort, side: 'input' as const },
    wtsDelay: edge.wtsDelay,
    signals: [],
  }));

  return {
    id: `viewer-puzzle:${puzzleId}`,
    nodes,
    wires,
  };
}
