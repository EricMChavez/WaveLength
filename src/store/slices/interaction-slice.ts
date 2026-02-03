import type { StateCreator } from 'zustand';
import type { NodeId, PortRef, Vec2 } from '../../shared/types/index.ts';

/** Interaction mode discriminated union */
export type InteractionMode =
  | { type: 'idle' }
  | { type: 'placing-node'; nodeType: string }
  | { type: 'drawing-wire'; fromPort: PortRef; fromPosition: Vec2 };

/** Port currently being edited for a constant value */
export interface EditingPort {
  nodeId: NodeId;
  portIndex: number;
  position: Vec2;
}

export interface InteractionSlice {
  /** Current interaction mode */
  interactionMode: InteractionMode;
  /** Currently selected node (for parameter editing) */
  selectedNodeId: NodeId | null;
  /** Current mouse position on canvas (for wire preview) */
  mousePosition: Vec2 | null;
  /** Port currently open for constant value editing */
  editingPort: EditingPort | null;

  /** Enter placing-node mode */
  startPlacingNode: (nodeType: string) => void;
  /** Cancel placement, return to idle */
  cancelPlacing: () => void;
  /** Select a node on the gameboard */
  selectNode: (nodeId: NodeId) => void;
  /** Clear the current selection */
  clearSelection: () => void;
  /** Start drawing a wire from a port */
  startWireDraw: (fromPort: PortRef, fromPosition: Vec2) => void;
  /** Cancel wire drawing, return to idle */
  cancelWireDraw: () => void;
  /** Update mouse position (for wire preview) */
  setMousePosition: (pos: Vec2 | null) => void;
  /** Open constant value editor for a port */
  startEditingPort: (nodeId: NodeId, portIndex: number, position: Vec2) => void;
  /** Close constant value editor */
  stopEditingPort: () => void;
}

export const createInteractionSlice: StateCreator<InteractionSlice> = (set) => ({
  interactionMode: { type: 'idle' },
  selectedNodeId: null,
  mousePosition: null,
  editingPort: null,

  startPlacingNode: (nodeType) =>
    set({ interactionMode: { type: 'placing-node', nodeType }, selectedNodeId: null }),

  cancelPlacing: () =>
    set({ interactionMode: { type: 'idle' } }),

  selectNode: (nodeId) =>
    set({ selectedNodeId: nodeId, interactionMode: { type: 'idle' } }),

  clearSelection: () =>
    set({ selectedNodeId: null }),

  startWireDraw: (fromPort, fromPosition) =>
    set({
      interactionMode: { type: 'drawing-wire', fromPort, fromPosition },
      selectedNodeId: null,
    }),

  cancelWireDraw: () =>
    set({ interactionMode: { type: 'idle' } }),

  setMousePosition: (pos) =>
    set({ mousePosition: pos }),

  startEditingPort: (nodeId, portIndex, position) =>
    set({ editingPort: { nodeId, portIndex, position } }),

  stopEditingPort: () =>
    set({ editingPort: null }),
});
