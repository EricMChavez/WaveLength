/**
 * Pure escape-key handler.
 * Escape always toggles the main menu screen. If an active interaction or
 * dismissible overlay exists, it cancels that first AND opens the menu in
 * one action.
 *
 * Priority:
 * 1. Retro screen is active → close it ('close-menu')
 * 2. Zoom animation playing → block ('noop')
 * 3. Ceremony active (victory-screen) → block ('noop')
 * 4. Non-dismissible overlay → block ('noop')
 * 5. Dismissible overlay / active interaction → cancel + open menu ('cancel-and-menu')
 * 6. Nothing active → open menu ('open-menu')
 */

export type EscapeAction =
  | 'open-menu'
  | 'close-menu'
  | 'cancel-and-menu'
  | 'close-drawer'
  | 'end-tutorial'
  | 'noop';

/** Minimal state interface for escape handler — avoids importing full GameStore */
export interface EscapeHandlerState {
  activeScreen: string | null;
  revealScreen: () => void;
  dismissScreen: () => void;
  hasActiveOverlay: () => boolean;
  isOverlayEscapeDismissible: () => boolean;
  closeOverlay: () => void;
  interactionMode: { type: string };
  cancelWireDraw: () => void;
  cancelPlacing: () => void;
  cancelKeyboardWiring: () => void;
  commitKnobAdjust: () => void;
  selectedNodeId: string | null;
  clearSelection: () => void;
  zoomTransitionType: string;
  ceremonyType: string;
  isTutorialActive: boolean;
  endTutorial: () => void;
  isDrawerOpen?: boolean;
}

/**
 * Determine which escape action to take without executing it.
 * Pure function — no side effects.
 */
export function getEscapeAction(state: EscapeHandlerState): EscapeAction {
  // 1. Screen active → close it (handled by RetroPageHost capture-phase listener)
  if (state.activeScreen !== null) return 'close-menu';

  // 1.5 Drawer open → close it
  if (state.isDrawerOpen) return 'close-drawer';

  // 2. Tutorial active → end tutorial
  if (state.isTutorialActive && !state.hasActiveOverlay()) return 'end-tutorial';

  // 3. Zoom animation playing → block
  if (state.zoomTransitionType !== 'idle') return 'noop';

  // 3. Ceremony active → block
  if (state.ceremonyType === 'victory-screen' || state.ceremonyType === 'it-works') return 'noop';

  // 4. Non-dismissible overlay → block
  if (state.hasActiveOverlay() && !state.isOverlayEscapeDismissible()) return 'noop';

  // 5. Dismissible overlay or active interaction → cancel + open menu
  if (state.hasActiveOverlay() && state.isOverlayEscapeDismissible()) return 'cancel-and-menu';
  if (state.interactionMode.type === 'drawing-wire' || state.interactionMode.type === 'keyboard-wiring') return 'cancel-and-menu';
  if (state.interactionMode.type === 'adjusting-knob') return 'cancel-and-menu';
  if (state.interactionMode.type === 'placing-node') return 'cancel-and-menu';
  if (state.selectedNodeId !== null) return 'cancel-and-menu';

  // 6. Nothing active → open menu
  return 'open-menu';
}

/**
 * Execute a previously determined escape action.
 */
export function executeEscapeAction(state: EscapeHandlerState, action: EscapeAction): void {
  switch (action) {
    case 'close-menu':
      state.dismissScreen();
      break;

    case 'end-tutorial':
      state.endTutorial();
      break;

    case 'close-drawer':
      // Drawer close is handled externally (module-level function)
      break;

    case 'open-menu':
      state.revealScreen();
      break;

    case 'cancel-and-menu': {
      // Cancel whatever is active
      if (state.hasActiveOverlay()) {
        state.closeOverlay();
      } else if (state.interactionMode.type === 'keyboard-wiring') {
        state.cancelKeyboardWiring();
      } else if (state.interactionMode.type === 'drawing-wire') {
        state.cancelWireDraw();
      } else if (state.interactionMode.type === 'placing-node') {
        state.cancelPlacing();
      } else if (state.interactionMode.type === 'adjusting-knob') {
        state.commitKnobAdjust();
      } else if (state.selectedNodeId !== null) {
        state.clearSelection();
      }
      // Then open menu
      state.revealScreen();
      break;
    }
  }
}

/**
 * Determine and execute the escape action in one call.
 * Convenience wrapper over getEscapeAction + executeEscapeAction.
 */
export function handleEscape(state: EscapeHandlerState): EscapeAction {
  const action = getEscapeAction(state);
  executeEscapeAction(state, action);
  return action;
}
