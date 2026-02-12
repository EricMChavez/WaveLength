import type { StateCreator } from 'zustand';
import type { GameStore } from '../index.ts';
import type { GameboardState } from '../../shared/types/index.ts';

const MAX_HISTORY = 50;

export interface BoardSnapshot {
  board: GameboardState;
  portConstants: Map<string, number>;
}

export interface HistorySlice {
  undoStack: BoardSnapshot[];
  redoStack: BoardSnapshot[];

  /** Undo the last edit — restore previous board state */
  undo: () => void;
  /** Redo the last undone edit — restore next board state */
  redo: () => void;
  /** Clear all undo/redo history */
  clearHistory: () => void;
}

/** Module-level flag to prevent undo/redo restores from triggering snapshot capture */
let isRestoring = false;

export const createHistorySlice: StateCreator<GameStore, [], [], HistorySlice> = (set, get) => ({
  undoStack: [],
  redoStack: [],

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0 || !state.activeBoard) return;

    const currentSnapshot: BoardSnapshot = {
      board: state.activeBoard,
      portConstants: state.portConstants,
    };

    const newUndoStack = state.undoStack.slice(0, -1);
    const restored = state.undoStack[state.undoStack.length - 1];

    isRestoring = true;
    set({
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, currentSnapshot],
      activeBoard: restored.board,
      portConstants: restored.portConstants,
      graphVersion: state.graphVersion + 1,
      routingVersion: state.routingVersion + 1,
    });
    isRestoring = false;
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0 || !state.activeBoard) return;

    const currentSnapshot: BoardSnapshot = {
      board: state.activeBoard,
      portConstants: state.portConstants,
    };

    const newRedoStack = state.redoStack.slice(0, -1);
    const restored = state.redoStack[state.redoStack.length - 1];

    isRestoring = true;
    set({
      redoStack: newRedoStack,
      undoStack: [...state.undoStack, currentSnapshot],
      activeBoard: restored.board,
      portConstants: restored.portConstants,
      graphVersion: state.graphVersion + 1,
      routingVersion: state.routingVersion + 1,
    });
    isRestoring = false;
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),
});

/** Set up auto-capture of history snapshots when graphVersion changes */
export function initHistory(store: {
  getState(): GameStore;
  setState(partial: Partial<GameStore>): void;
  subscribe(listener: (state: GameStore, prev: GameStore) => void): () => void;
}): void {
  store.subscribe((state, prev) => {
    // Skip during undo/redo restore
    if (isRestoring) return;

    // Clear history on board switch
    if (state.activeBoardId !== prev.activeBoardId) {
      store.setState({ undoStack: [], redoStack: [] });
      return;
    }

    // Suppress history during knob drag (final value captured on commit)
    if (state.interactionMode.type === 'adjusting-knob') return;

    // Auto-capture snapshot when graph is mutated
    if (state.graphVersion !== prev.graphVersion && prev.activeBoard) {
      const snapshot: BoardSnapshot = {
        board: prev.activeBoard,
        portConstants: prev.portConstants,
      };
      store.setState({
        undoStack: [...state.undoStack, snapshot].slice(-MAX_HISTORY),
        redoStack: [],
      });
    }
  });
}
