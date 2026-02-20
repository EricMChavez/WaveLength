/**
 * Pause-mode wire animation timing computation.
 *
 * When paused, signal "blips" travel along wires in topological evaluation order.
 * This module computes per-wire timing (depart/arrive phases) from the processing order.
 */

import type { Path } from '../../shared/types/index.ts';
import type { CycleResults } from '../../engine/evaluation/index.ts';

// =============================================================================
// Types
// =============================================================================

export interface WireBlipTiming {
  wireId: string;
  /** Phase (0-1) at which the blip departs the source end */
  departPhase: number;
  /** Phase (0-1) at which the blip arrives at the target end */
  arrivePhase: number;
  /** Signal value at the frozen playpoint */
  signalValue: number;
}

export interface WireAnimationCache {
  timings: ReadonlyMap<string, WireBlipTiming>;
}

// =============================================================================
// Computation
// =============================================================================

/**
 * Compute per-wire blip timing from cycle results and playpoint.
 *
 * Timing algorithm (depth-based wavefront):
 * - Phase for each node = depth / maxDepth (nodes at same depth fire simultaneously)
 * - CP source wires (depth 0) depart at phase 0
 * - CP target wires arrive at phase 1
 * - Cross-cycle feedback (arrive <= depart) wraps arrive to 1
 * - Minimum gap enforced for visibility
 */
export function computeWireAnimationCache(
  wires: ReadonlyArray<Path>,
  _nodes: ReadonlyMap<string, unknown>,
  cycleResults: CycleResults,
  playpoint: number,
): WireAnimationCache {
  const { chipDepths, maxDepth } = cycleResults;
  const safeDenom = Math.max(maxDepth, 1);

  const timings = new Map<string, WireBlipTiming>();

  for (const wire of wires) {
    const sourceNodeId = wire.source.chipId;
    const targetNodeId = wire.target.chipId;

    // Determine depart phase from source node depth
    const srcDepth = chipDepths.get(sourceNodeId);
    const departPhase = srcDepth !== undefined ? srcDepth / safeDenom : 0;

    // Determine arrive phase from target node depth
    const tgtDepth = chipDepths.get(targetNodeId);
    let arrivePhase = tgtDepth !== undefined ? tgtDepth / safeDenom : 1;

    // Cross-cycle feedback: if arrive <= depart, wrap to end
    if (arrivePhase <= departPhase) {
      arrivePhase = 1;
    }

    // Enforce minimum gap for visibility
    const minGap = 1 / safeDenom;
    if (arrivePhase - departPhase < minGap) {
      arrivePhase = Math.min(departPhase + minGap, 1);
    }

    const signalValue = cycleResults.pathValues.get(wire.id)?.[playpoint] ?? 0;

    timings.set(wire.id, {
      wireId: wire.id,
      departPhase,
      arrivePhase,
      signalValue,
    });
  }

  return { timings };
}

/**
 * Compute the set of port keys where a blip is currently "holding" (at source or target).
 *
 * A source port holds a blip when globalProgress < departPhase (blip hasn't left yet).
 * A target port holds a blip when globalProgress >= arrivePhase (blip has arrived).
 *
 * Port key format matches computePortSignals:
 *   `${chipId}:plug:${portIndex}` for source ports
 *   `${chipId}:socket:${portIndex}` for target ports
 */
export function computeBlipPortKeys(
  cache: WireAnimationCache,
  wires: ReadonlyArray<Path>,
  globalProgress: number,
): Set<string> {
  const holding = new Set<string>();

  for (const wire of wires) {
    const timing = cache.timings.get(wire.id);
    if (!timing) continue;

    // Source port holds blip before it departs
    if (globalProgress < timing.departPhase) {
      holding.add(`${wire.source.chipId}:plug:${wire.source.portIndex}`);
    }

    // Target port holds blip after it arrives
    if (globalProgress >= timing.arrivePhase) {
      holding.add(`${wire.target.chipId}:socket:${wire.target.portIndex}`);
    }
  }

  return holding;
}
