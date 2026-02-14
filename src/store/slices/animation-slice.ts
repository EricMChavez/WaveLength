import type { StateCreator } from 'zustand';
import type { GameStore } from '../index.ts';
import type { GridRect } from '../../shared/grid/types.ts';

/**
 * Zoom transition state machine for portal-based zoom transitions.
 *
 * idle: No transition active.
 * capturing: One-frame transient state. firstSnapshot captured, waiting for
 *   next rAF to capture the new board as secondSnapshot.
 * animating: Both snapshots captured, animation is playing.
 * revealing: Curtain slides down (600ms) before showing unsaved-changes dialog.
 * reveal-paused: Curtain fully covers viewport, dialog is shown on top.
 *
 * Flow (combined zoom-in/out):
 *   idle -> capturing (startZoomCapture)
 *   capturing -> animating (finalizeZoomCapture, called by render loop)
 *   animating -> idle (endZoomTransition, when animation completes)
 *
 * Flow (two-part zoom-out for utility editing):
 *   idle -> revealing (startReveal)
 *   revealing -> reveal-paused (completeReveal, when reveal progress >= 1)
 *   reveal-paused -> capturing (confirmRevealAndZoom, after Save/Discard)
 *   reveal-paused -> idle (cancelReveal, "Keep Editing")
 */
export type ZoomTransitionState =
  | { type: 'idle' }
  | {
      type: 'capturing';
      firstSnapshot: OffscreenCanvas;
      targetRect: GridRect;
      direction: 'in' | 'out';
      zoomedCrop?: OffscreenCanvas;
      phase: 'combined' | 'zoom-only';
    }
  | {
      type: 'animating';
      outerSnapshot: OffscreenCanvas;
      innerSnapshot: OffscreenCanvas;
      targetRect: GridRect;
      direction: 'in' | 'out';
      startTime: number;
      zoomedCrop?: OffscreenCanvas;
      phase: 'combined' | 'zoom-only';
    }
  | {
      type: 'revealing';
      zoomedCrop: OffscreenCanvas;
      targetRect: GridRect;
      startTime: number;
    }
  | {
      type: 'reveal-paused';
      zoomedCrop: OffscreenCanvas;
      targetRect: GridRect;
    };

export interface AnimationSlice {
  zoomTransitionState: ZoomTransitionState;

  /**
   * Start a zoom transition capture. Captures the current board as firstSnapshot,
   * then the caller switches the board. The render loop will capture the second
   * snapshot on the next frame and transition to 'animating'.
   */
  startZoomCapture: (firstSnapshot: OffscreenCanvas, targetRect: GridRect, direction: 'in' | 'out', zoomedCrop?: OffscreenCanvas, phase?: 'combined' | 'zoom-only') => void;

  /**
   * Called by the render loop after rendering the new board to capture the second
   * snapshot and begin the animation. Only valid in 'capturing' state.
   */
  finalizeZoomCapture: (secondSnapshot: OffscreenCanvas) => void;

  /**
   * End the animation, returning to idle. Called when animation progress >= 1.
   */
  endZoomTransition: () => void;

  /**
   * Start a reveal-only curtain animation (600ms slide-down).
   * Used for the first phase of two-part zoom-out when editing a utility.
   */
  startReveal: (crop: OffscreenCanvas, targetRect: GridRect) => void;

  /**
   * Called by the render loop when reveal progress >= 1.
   * Transitions to reveal-paused and opens the unsaved-changes overlay.
   */
  completeReveal: () => void;

  /**
   * Cancel the reveal (user chose "Keep Editing"). Returns to idle.
   */
  cancelReveal: () => void;

  /**
   * After Save/Discard, start the zoom-out phase.
   * Transitions from reveal-paused to capturing with phase='zoom-only'.
   */
  confirmRevealAndZoom: () => void;
}

export const createAnimationSlice: StateCreator<GameStore, [], [], AnimationSlice> = (
  set,
  get,
) => ({
  zoomTransitionState: { type: 'idle' },

  startZoomCapture: (firstSnapshot, targetRect, direction, zoomedCrop?, phase = 'combined') => {
    const current = get().zoomTransitionState;
    if (current.type !== 'idle') return;
    set({
      zoomTransitionState: {
        type: 'capturing',
        firstSnapshot,
        targetRect,
        direction,
        zoomedCrop,
        phase,
      },
    });
  },

  finalizeZoomCapture: (secondSnapshot) => {
    const current = get().zoomTransitionState;
    if (current.type !== 'capturing') return;

    const { firstSnapshot, targetRect, direction, zoomedCrop, phase } = current;

    // For zoom-in: outer = first (parent), inner = second (child)
    // For zoom-out: outer = second (parent), inner = first (child)
    const outerSnapshot = direction === 'in' ? firstSnapshot : secondSnapshot;
    const innerSnapshot = direction === 'in' ? secondSnapshot : firstSnapshot;

    set({
      zoomTransitionState: {
        type: 'animating',
        outerSnapshot,
        innerSnapshot,
        targetRect,
        direction,
        startTime: performance.now(),
        zoomedCrop,
        phase,
      },
    });
  },

  endZoomTransition: () => {
    set({ zoomTransitionState: { type: 'idle' } });
  },

  startReveal: (crop, targetRect) => {
    const current = get().zoomTransitionState;
    if (current.type !== 'idle') return;
    set({
      zoomTransitionState: {
        type: 'revealing',
        zoomedCrop: crop,
        targetRect,
        startTime: performance.now(),
      },
    });
  },

  completeReveal: () => {
    const current = get().zoomTransitionState;
    if (current.type !== 'revealing') return;
    set({
      zoomTransitionState: {
        type: 'reveal-paused',
        zoomedCrop: current.zoomedCrop,
        targetRect: current.targetRect,
      },
    });
    // Open unsaved-changes overlay as side effect
    get().openOverlay({ type: 'unsaved-changes' });
  },

  cancelReveal: () => {
    const current = get().zoomTransitionState;
    if (current.type !== 'reveal-paused') return;
    set({ zoomTransitionState: { type: 'idle' } });
  },

  confirmRevealAndZoom: () => {
    const current = get().zoomTransitionState;
    if (current.type !== 'reveal-paused') return;
    // Create a 1×1 empty OffscreenCanvas as firstSnapshot (won't be used since portal is disabled for zoom-only)
    const emptySnapshot = new OffscreenCanvas(1, 1);
    set({
      zoomTransitionState: {
        type: 'capturing',
        firstSnapshot: emptySnapshot,
        targetRect: current.targetRect,
        direction: 'out',
        zoomedCrop: current.zoomedCrop,
        phase: 'zoom-only',
      },
    });
  },
});
