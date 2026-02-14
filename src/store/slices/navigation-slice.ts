import type { StateCreator } from 'zustand';
import type { GameStore } from '../index.ts';
import type { GameboardState, NodeId, NodeState } from '../../shared/types/index.ts';
import { gameboardFromBakeMetadata } from '../../puzzle/gameboard-from-metadata.ts';
import { recomputeOccupancy } from '../../shared/grid/index.ts';
import { createDefaultMeterSlots } from './meter-slice.ts';
import type { MeterKey, MeterMode, MeterSlotState } from '../../gameboard/meters/meter-types.ts';
import { meterKey } from '../../gameboard/meters/meter-types.ts';
import { TOTAL_SLOTS } from '../../shared/grid/slot-helpers.ts';
import {
  isUtilitySlotNode,
  getUtilitySlotIndex,
  isBidirectionalCpNode,
  getBidirectionalCpIndex,
  utilitySlotId,
  createUtilitySlotNode,
} from '../../puzzle/connection-point-nodes.ts';
import type { PuzzleNodeEntry, UtilityNodeEntry } from './palette-slice.ts';
import type { PuzzleDefinition } from '../../puzzle/types.ts';

export function computeBreadcrumbs(
  boardStack: BoardStackEntry[],
  puzzleNodes: Map<string, PuzzleNodeEntry>,
  activePuzzle: PuzzleDefinition | null,
  utilityNodes?: Map<string, UtilityNodeEntry>,
): string[] {
  const root = activePuzzle?.title ?? 'Sandbox';
  const segments = [root];

  for (const entry of boardStack) {
    const node = entry.board.nodes.get(entry.nodeIdInParent);
    if (node && node.type === 'custom-blank') {
      segments.push('New Custom Node');
    } else if (node && node.type.startsWith('puzzle:')) {
      const puzzleId = node.type.slice('puzzle:'.length);
      const title = puzzleNodes.get(puzzleId)?.title ?? puzzleId;
      segments.push(title);
    } else if (node && node.type.startsWith('utility:') && utilityNodes) {
      const utilityId = node.type.slice('utility:'.length);
      const title = utilityNodes.get(utilityId)?.title ?? utilityId;
      segments.push(title);
    } else if (entry.nodeIdInParent) {
      segments.push(entry.nodeIdInParent);
    }
  }

  return segments;
}

export interface BoardStackEntry {
  board: GameboardState;
  portConstants: Map<string, number>;
  nodeIdInParent: NodeId;
  readOnly: boolean;
  meterSlots: Map<MeterKey, MeterSlotState>;
}

export interface ZoomTransition {
  direction: 'in' | 'out';
  snapshot: string;
}

export interface NodeSwap {
  nodeId: NodeId;
  newType: string;
  inputCount: number;
  outputCount: number;
  cpLayout?: ('input' | 'output' | 'off')[];
}

export interface NavigationSlice {
  boardStack: BoardStackEntry[];
  activeBoardReadOnly: boolean;
  navigationDepth: number;
  zoomTransition: ZoomTransition | null;
  editingUtilityId: string | null;
  editingNodeIdInParent: NodeId | null;

  zoomIntoNode: (nodeId: NodeId) => void;
  zoomOut: () => void;
  startZoomTransition: (direction: 'in' | 'out', snapshot: string) => void;
  endZoomTransition: () => void;
  startEditingUtility: (utilityId: string, board: GameboardState, nodeIdInParent?: NodeId) => void;
  finishEditingUtility: (nodeSwap?: NodeSwap) => void;
}

/**
 * Derive meter slots for utility editing from the board's utility slot nodes.
 * Each slot gets mode = 'input' | 'output' | 'off' based on the board nodes.
 */
function deriveUtilityMeterSlots(board: GameboardState): Map<MeterKey, MeterSlotState> {
  const slots = new Map<MeterKey, MeterSlotState>();

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const nodeId = utilitySlotId(i);
    let mode: MeterMode = 'off';
    if (board.nodes.has(nodeId)) {
      const node = board.nodes.get(nodeId)!;
      mode = node.type === 'connection-input' ? 'input' : 'output';
    }
    slots.set(meterKey(i), { mode });
  }

  return slots;
}

/**
 * Migrate a board from old bidir CPs (__cp_bidir_N__) to new utility slots (__cp_utility_N__).
 * If no bidir CPs exist, returns the board unchanged.
 */
function migrateOldBidirCps(board: GameboardState): GameboardState {
  // Check if any old bidir CPs exist
  let hasBidir = false;
  for (const nodeId of board.nodes.keys()) {
    if (isBidirectionalCpNode(nodeId)) {
      hasBidir = true;
      break;
    }
  }
  if (!hasBidir) return board;

  const nodes = new Map<string, NodeState>();

  // Build ID mapping for wire remapping
  const idMap = new Map<string, string>();

  for (const [id, node] of board.nodes) {
    if (isBidirectionalCpNode(id)) {
      const cpIndex = getBidirectionalCpIndex(id);
      // Bidir CPs: infer direction from wiring.
      // Output port used (wires source from it) → 'input' (feeds signal into board)
      // Input port used (wires target it) → 'output' (receives signal from board)
      const hasOutgoing = board.wires.some(w => w.source.nodeId === id);
      const hasIncoming = board.wires.some(w => w.target.nodeId === id);

      let dir: 'input' | 'output';
      if (hasOutgoing) {
        dir = 'input';
      } else if (hasIncoming) {
        dir = 'output';
      } else {
        // Default: left=input, right=output
        dir = cpIndex < 3 ? 'input' : 'output';
      }

      const newNode = createUtilitySlotNode(cpIndex, dir);
      const newNodeId = utilitySlotId(cpIndex);
      idMap.set(id, newNodeId);
      nodes.set(newNodeId, newNode);
    } else {
      nodes.set(id, node);
    }
  }

  // Remap wire references
  const wires = board.wires.map(w => {
    let source = w.source;
    let target = w.target;

    if (idMap.has(w.source.nodeId)) {
      source = { ...source, nodeId: idMap.get(w.source.nodeId)! };
    }
    if (idMap.has(w.target.nodeId)) {
      target = { ...target, nodeId: idMap.get(w.target.nodeId)! };
    }

    return { ...w, source, target };
  });

  return { ...board, nodes, wires };
}

export const createNavigationSlice: StateCreator<GameStore, [], [], NavigationSlice> = (
  set,
  get,
) => ({
  boardStack: [],
  activeBoardReadOnly: false,
  navigationDepth: 0,
  zoomTransition: null,
  editingUtilityId: null,
  editingNodeIdInParent: null,

  startZoomTransition: (direction, snapshot) => {
    set({ zoomTransition: { direction, snapshot } });
  },

  endZoomTransition: () => {
    set({ zoomTransition: null });
  },

  zoomIntoNode: (nodeId) => {
    const state = get();
    if (!state.activeBoard) return;

    const node = state.activeBoard.nodes.get(nodeId);
    if (!node) return;

    let childBoard: GameboardState | null = null;

    if (node.type.startsWith('puzzle:')) {
      const puzzleId = node.type.slice('puzzle:'.length);
      const entry = state.puzzleNodes.get(puzzleId);
      if (!entry) return;
      childBoard = gameboardFromBakeMetadata(puzzleId, entry.bakeMetadata);
    } else if (node.type.startsWith('utility:')) {
      const utilityId = node.type.slice('utility:'.length);
      const entry = state.utilityNodes.get(utilityId);
      if (!entry) return;
      childBoard = gameboardFromBakeMetadata(utilityId, entry.bakeMetadata);
    } else {
      return;
    }

    const stackEntry: BoardStackEntry = {
      board: state.activeBoard,
      portConstants: state.portConstants,
      nodeIdInParent: nodeId,
      readOnly: state.activeBoardReadOnly,
      meterSlots: state.meterSlots,
    };

    const newStack = [...state.boardStack, stackEntry];

    set({
      boardStack: newStack,
      activeBoard: childBoard,
      activeBoardId: childBoard.id,
      portConstants: new Map(),
      activeBoardReadOnly: true,
      navigationDepth: newStack.length,
      selectedNodeId: null,
      occupancy: recomputeOccupancy(childBoard.nodes),
      meterSlots: createDefaultMeterSlots(),
    });
  },

  zoomOut: () => {
    const state = get();
    if (state.boardStack.length === 0) return;

    const newStack = state.boardStack.slice(0, -1);
    const entry = state.boardStack[state.boardStack.length - 1];

    set({
      boardStack: newStack,
      activeBoard: entry.board,
      activeBoardId: entry.board.id,
      portConstants: entry.portConstants,
      activeBoardReadOnly: entry.readOnly,
      navigationDepth: newStack.length,
      selectedNodeId: null,
      occupancy: recomputeOccupancy(entry.board.nodes),
      meterSlots: entry.meterSlots,
    });
  },

  startEditingUtility: (utilityId, board, nodeIdInParent?) => {
    const state = get();
    if (!state.activeBoard) return;

    const stackEntry: BoardStackEntry = {
      board: state.activeBoard,
      portConstants: state.portConstants,
      nodeIdInParent: (nodeIdInParent ?? '') as NodeId,
      readOnly: state.activeBoardReadOnly,
      meterSlots: state.meterSlots,
    };

    const newStack = [...state.boardStack, stackEntry];

    // Migrate old bidir CPs to utility slot nodes if needed
    const migratedBoard = migrateOldBidirCps(board);

    // Derive meter slots from utility slot nodes on the board
    const utilityMeterSlots = deriveUtilityMeterSlots(migratedBoard);

    set({
      boardStack: newStack,
      activeBoard: migratedBoard,
      activeBoardId: migratedBoard.id,
      portConstants: new Map(),
      activeBoardReadOnly: false,
      navigationDepth: newStack.length,
      selectedNodeId: null,
      editingUtilityId: utilityId,
      editingNodeIdInParent: (nodeIdInParent ?? null) as NodeId | null,
      occupancy: recomputeOccupancy(migratedBoard.nodes),
      meterSlots: utilityMeterSlots,
    });
  },

  finishEditingUtility: (nodeSwap?) => {
    const state = get();
    if (state.boardStack.length === 0) return;

    const newStack = state.boardStack.slice(0, -1);
    const entry = state.boardStack[state.boardStack.length - 1];

    let parentBoard = entry.board;

    // Apply node swap if provided (e.g., custom-blank → utility:id)
    if (nodeSwap) {
      const nodes = new Map(parentBoard.nodes);
      const existing = nodes.get(nodeSwap.nodeId);
      if (existing) {
        nodes.set(nodeSwap.nodeId, {
          ...existing,
          type: nodeSwap.newType,
          inputCount: nodeSwap.inputCount,
          outputCount: nodeSwap.outputCount,
          params: { ...existing.params, ...(nodeSwap.cpLayout ? { cpLayout: nodeSwap.cpLayout } : {}) },
        });
        parentBoard = { ...parentBoard, nodes };
      }
    }

    set({
      boardStack: newStack,
      activeBoard: parentBoard,
      activeBoardId: parentBoard.id,
      portConstants: entry.portConstants,
      activeBoardReadOnly: entry.readOnly,
      navigationDepth: newStack.length,
      selectedNodeId: null,
      editingUtilityId: null,
      editingNodeIdInParent: null,
      occupancy: recomputeOccupancy(parentBoard.nodes),
      meterSlots: entry.meterSlots,
    });
  },
});
