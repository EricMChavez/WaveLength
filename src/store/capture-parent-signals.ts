import type { GameboardState, ChipId, ParentSignalContext } from '../shared/types/index.ts';
import type { CycleResults } from '../engine/evaluation/index.ts';
import { buildSlotConfigFromDirections, directionIndexToSlot } from '../puzzle/types.ts';

/**
 * Capture parent-board signals at zoom-in time for "live X-ray" utility editing.
 *
 * For each externally-connected socket port on the utility chip, captures the
 * 256-cycle signal array from the parent's cycle results. For unconnected sockets
 * with port constants (e.g. knob values), creates a flat 256-sample array.
 * Plug ports are only tracked for toggle-locking (no signal capture).
 *
 * Returns null if the chip has no external connections and no port constants.
 */
export function captureParentSignals(
  parentBoard: GameboardState,
  cycleResults: CycleResults,
  portConstants: ReadonlyMap<string, number>,
  chipId: ChipId,
  cpLayout: readonly ('input' | 'output' | 'off')[],
): ParentSignalContext | null {
  const chip = parentBoard.chips.get(chipId);
  if (!chip) return null;

  const slotConfig = buildSlotConfigFromDirections(cpLayout);
  const slotSignals: (readonly number[] | null)[] = [null, null, null, null, null, null];
  const connectedSlots = new Set<number>();

  // Build path lookup for this chip's socket ports (paths targeting this chip)
  const socketPathsByPort = new Map<number, string>(); // portIndex → pathId
  // Build path lookup for this chip's plug ports (paths sourcing from this chip)
  const plugPathsByPort = new Map<number, string>(); // portIndex → pathId

  for (const path of parentBoard.paths) {
    if (path.target.chipId === chipId) {
      socketPathsByPort.set(path.target.portIndex, path.id);
    }
    if (path.source.chipId === chipId) {
      plugPathsByPort.set(path.source.portIndex, path.id);
    }
  }

  // Capture socket (input) port signals
  for (let portIdx = 0; portIdx < chip.socketCount; portIdx++) {
    const slotIdx = directionIndexToSlot(slotConfig, 'input', portIdx);
    if (slotIdx < 0) continue;

    const pathId = socketPathsByPort.get(portIdx);
    if (pathId) {
      // Externally wired: capture the 256-cycle signal from pathValues
      const samples = cycleResults.pathValues.get(pathId);
      if (samples) {
        slotSignals[slotIdx] = samples;
        connectedSlots.add(slotIdx);
      }
    } else {
      // Not wired — check for port constant (e.g. knob value)
      const constVal = portConstants.get(`${chipId}:${portIdx}`);
      if (constVal !== undefined && constVal !== 0) {
        const flat = new Array(256).fill(constVal) as number[];
        slotSignals[slotIdx] = flat;
        // Note: unconnected ports with constants are NOT in connectedSlots
        // (the player can still toggle them)
      }
    }
  }

  // Track plug (output) port connections for toggle-locking
  for (let portIdx = 0; portIdx < chip.plugCount; portIdx++) {
    const slotIdx = directionIndexToSlot(slotConfig, 'output', portIdx);
    if (slotIdx < 0) continue;

    if (plugPathsByPort.has(portIdx)) {
      connectedSlots.add(slotIdx);
    }
  }

  // Return null if nothing to capture
  if (connectedSlots.size === 0 && slotSignals.every(s => s === null)) {
    return null;
  }

  return { slotSignals, connectedSlots };
}
