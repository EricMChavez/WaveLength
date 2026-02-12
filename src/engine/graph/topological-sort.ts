import type { NodeId, Wire } from '../../shared/types/index.ts';
import type { Result } from '../../shared/result/index.ts';
import { ok, err } from '../../shared/result/index.ts';

export interface CycleError {
  message: string;
  /** Node IDs forming the cycle */
  cyclePath: NodeId[];
}

export interface TopologicalResult {
  order: NodeId[];
  /** Longest path from any root (zero in-degree node) to each node */
  depths: Map<NodeId, number>;
  /** Maximum depth across all nodes */
  maxDepth: number;
}

/**
 * Topological sort using Kahn's algorithm.
 * Returns nodes ordered so every node evaluates after its dependencies,
 * or an error with the cycle path if a cycle exists.
 * Disconnected nodes (no edges) are included in the output.
 */
export function topologicalSort(
  nodeIds: NodeId[],
  wires: Wire[],
): Result<NodeId[], CycleError> {
  // Build adjacency list and in-degree map
  const inDegree = new Map<NodeId, number>();
  const adjacency = new Map<NodeId, NodeId[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const wire of wires) {
    const from = wire.source.nodeId;
    const to = wire.target.nodeId;
    adjacency.get(from)!.push(to);
    inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
  }

  // Seed queue with nodes that have zero in-degree
  const queue: NodeId[] = [];
  for (const id of nodeIds) {
    if (inDegree.get(id) === 0) {
      queue.push(id);
    }
  }

  const sorted: NodeId[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    for (const neighbor of adjacency.get(node)!) {
      const deg = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not all nodes were processed, a cycle exists
  if (sorted.length !== nodeIds.length) {
    const cyclePath = findCycle(nodeIds, wires, sorted);
    return err({
      message: `Cycle detected: ${cyclePath.join(' → ')}`,
      cyclePath,
    });
  }

  return ok(sorted);
}

/**
 * Topological sort with depth tracking.
 *
 * Returns the same topological order as `topologicalSort`, plus a depth map
 * where depth = longest path from any root (zero in-degree node) to each node.
 * Nodes with no predecessors have depth 0.
 */
export function topologicalSortWithDepths(
  nodeIds: NodeId[],
  wires: Wire[],
): Result<TopologicalResult, CycleError> {
  const sortResult = topologicalSort(nodeIds, wires);
  if (!sortResult.ok) return sortResult;

  const order = sortResult.value;

  // Build reverse adjacency: for each node, which nodes feed into it
  const predecessors = new Map<NodeId, NodeId[]>();
  for (const id of nodeIds) {
    predecessors.set(id, []);
  }
  for (const wire of wires) {
    predecessors.get(wire.target.nodeId)!.push(wire.source.nodeId);
  }

  // Compute depths in topological order (predecessors already processed)
  const depths = new Map<NodeId, number>();
  let maxDepth = 0;

  for (const nodeId of order) {
    const preds = predecessors.get(nodeId)!;
    let depth = 0;
    for (const pred of preds) {
      const predDepth = depths.get(pred);
      if (predDepth !== undefined && predDepth + 1 > depth) {
        depth = predDepth + 1;
      }
    }
    depths.set(nodeId, depth);
    if (depth > maxDepth) maxDepth = depth;
  }

  return ok({ order, depths, maxDepth });
}

/**
 * Find one cycle among the unprocessed nodes using DFS.
 */
function findCycle(
  nodeIds: NodeId[],
  wires: Wire[],
  processed: NodeId[],
): NodeId[] {
  const processedSet = new Set(processed);
  const remaining = nodeIds.filter((id) => !processedSet.has(id));

  // Build adjacency restricted to remaining nodes
  const adjacency = new Map<NodeId, NodeId[]>();
  const remainingSet = new Set(remaining);
  for (const id of remaining) {
    adjacency.set(id, []);
  }
  for (const wire of wires) {
    if (remainingSet.has(wire.source.nodeId) && remainingSet.has(wire.target.nodeId)) {
      adjacency.get(wire.source.nodeId)!.push(wire.target.nodeId);
    }
  }

  // DFS to find cycle
  const visited = new Set<NodeId>();
  const onStack = new Set<NodeId>();
  const parent = new Map<NodeId, NodeId>();

  for (const start of remaining) {
    if (visited.has(start)) continue;
    const cycle = dfs(start, adjacency, visited, onStack, parent);
    if (cycle) return cycle;
  }

  // Fallback: return remaining nodes (should not happen if called correctly)
  return remaining;
}

function dfs(
  node: NodeId,
  adjacency: Map<NodeId, NodeId[]>,
  visited: Set<NodeId>,
  onStack: Set<NodeId>,
  parent: Map<NodeId, NodeId>,
): NodeId[] | null {
  visited.add(node);
  onStack.add(node);

  for (const neighbor of adjacency.get(node) ?? []) {
    if (!visited.has(neighbor)) {
      parent.set(neighbor, node);
      const cycle = dfs(neighbor, adjacency, visited, onStack, parent);
      if (cycle) return cycle;
    } else if (onStack.has(neighbor)) {
      // Found cycle — reconstruct path
      const path: NodeId[] = [neighbor];
      let current = node;
      while (current !== neighbor) {
        path.push(current);
        current = parent.get(current)!;
      }
      path.push(neighbor);
      path.reverse();
      return path;
    }
  }

  onStack.delete(node);
  return null;
}
