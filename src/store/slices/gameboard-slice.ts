import type { StateCreator } from 'zustand';
import type { GameboardId, GameboardState, NodeId, NodeState, Wire } from '../../shared/types/index.ts';

export interface GameboardSlice {
  /** The currently active gameboard */
  activeBoard: GameboardState | null;
  /** ID of the active gameboard */
  activeBoardId: GameboardId | null;
  /** Constant values for unconnected input ports. Key: "nodeId:portIndex" */
  portConstants: Map<string, number>;
  /** Incremented on structural graph mutations (add/remove node/wire, param change) */
  graphVersion: number;

  /** Set the active gameboard */
  setActiveBoard: (board: GameboardState) => void;
  /** Add a node to the active gameboard */
  addNode: (node: NodeState) => void;
  /** Remove a node from the active gameboard */
  removeNode: (nodeId: NodeId) => void;
  /** Add a wire to the active gameboard */
  addWire: (wire: Wire) => void;
  /** Remove a wire from the active gameboard */
  removeWire: (wireId: string) => void;
  /** Update parameters on an existing node */
  updateNodeParams: (nodeId: NodeId, params: Record<string, number | string>) => void;
  /** Replace wire array on the active board (preserves portConstants) */
  updateWires: (wires: Wire[]) => void;
  /** Set a constant value for an unconnected input port */
  setPortConstant: (nodeId: NodeId, portIndex: number, value: number) => void;
  /** Restore a board and its port constants (used by navigation zoom-out) */
  restoreBoard: (board: GameboardState, portConstants: Map<string, number>) => void;
}

export const createGameboardSlice: StateCreator<GameboardSlice> = (set) => ({
  activeBoard: null,
  activeBoardId: null,
  portConstants: new Map<string, number>(),
  graphVersion: 0,

  setActiveBoard: (board) =>
    set({ activeBoard: board, activeBoardId: board.id, portConstants: new Map() }),

  addNode: (node) =>
    set((state) => {
      if (!state.activeBoard) return state;
      const nodes = new Map(state.activeBoard.nodes);
      nodes.set(node.id, node);
      return {
        activeBoard: { ...state.activeBoard, nodes },
        graphVersion: state.graphVersion + 1,
      };
    }),

  removeNode: (nodeId) =>
    set((state) => {
      if (!state.activeBoard) return state;
      const nodes = new Map(state.activeBoard.nodes);
      nodes.delete(nodeId);
      return {
        activeBoard: { ...state.activeBoard, nodes },
        graphVersion: state.graphVersion + 1,
      };
    }),

  addWire: (wire) =>
    set((state) => {
      if (!state.activeBoard) return state;
      return {
        activeBoard: {
          ...state.activeBoard,
          wires: [...state.activeBoard.wires, wire],
        },
        graphVersion: state.graphVersion + 1,
      };
    }),

  removeWire: (wireId) =>
    set((state) => {
      if (!state.activeBoard) return state;
      return {
        activeBoard: {
          ...state.activeBoard,
          wires: state.activeBoard.wires.filter((w) => w.id !== wireId),
        },
        graphVersion: state.graphVersion + 1,
      };
    }),

  updateNodeParams: (nodeId, params) =>
    set((state) => {
      if (!state.activeBoard) return state;
      const node = state.activeBoard.nodes.get(nodeId);
      if (!node) return state;
      const nodes = new Map(state.activeBoard.nodes);
      nodes.set(nodeId, { ...node, params: { ...node.params, ...params } });
      return {
        activeBoard: { ...state.activeBoard, nodes },
        graphVersion: state.graphVersion + 1,
      };
    }),

  updateWires: (wires) =>
    set((state) => {
      if (!state.activeBoard) return state;
      return {
        activeBoard: { ...state.activeBoard, wires },
      };
    }),

  setPortConstant: (nodeId, portIndex, value) =>
    set((state) => {
      const key = `${nodeId}:${portIndex}`;
      const portConstants = new Map(state.portConstants);
      portConstants.set(key, value);
      return { portConstants, graphVersion: state.graphVersion + 1 };
    }),

  restoreBoard: (board, portConstants) =>
    set({ activeBoard: board, activeBoardId: board.id, portConstants }),
});
