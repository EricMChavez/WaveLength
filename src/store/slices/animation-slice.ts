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
 *
 * Flow:
 *   idle -> capturing (startZoomCapture)
 *   capturing -> animating (finalizeZoomCapture, called by render loop)
 *   animating -> idle (endZoomTransition, when animation completes)
 */
export type ZoomTransitionState =
  | { type: 'idle' }
  | {
      type: 'capturing';
      firstSnapshot: OffscreenCanvas;
      targetRect: GridRect;
      direction: 'in' | 'out';
    }
  | {
      type: 'animating';
      outerSnapshot: OffscreenCanvas;
      innerSnapshot: OffscreenCanvas;
      targetRect: GridRect;
      direction: 'in' | 'out';
      startTime: number;
    };

export interface AnimationSlice {
  zoomTransitionState: ZoomTransitionState;

  /**
   * Start a zoom transition capture. Captures the current board as firstSnapshot,
   * then the caller switches the board. The render loop will capture the second
   * snapshot on the next frame and transition to 'animating'.
   */
  startZoomCapture: (firstSnapshot: OffscreenCanvas, targetRect: GridRect, direction: 'in' | 'out') => void;

  /**
   * Called by the render loop after rendering the new board to capture the second
   * snapshot and begin the animation. Only valid in 'capturing' state.
   */
  finalizeZoomCapture: (secondSnapshot: OffscreenCanvas) => void;

  /**
   * End the animation, returning to idle. Called when animation progress >= 1.
   */
  endZoomTransition: () => void;
}

export const createAnimationSlice: StateCreator<GameStore, [], [], AnimationSlice> = (
  set,
  get,
) => ({
  zoomTransitionState: { type: 'idle' },

  startZoomCapture: (firstSnapshot, targetRect, direction) => {
    const current = get().zoomTransitionState;
    if (current.type !== 'idle') return;
    set({
      zoomTransitionState: {
        type: 'capturing',
        firstSnapshot,
        targetRect,
        direction,
      },
    });
  },

  finalizeZoomCapture: (secondSnapshot) => {
    const current = get().zoomTransitionState;
    if (current.type !== 'capturing') return;

    const { firstSnapshot, targetRect, direction } = current;

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
      },
    });
  },

  endZoomTransition: () => {
    set({ zoomTransitionState: { type: 'idle' } });
  },
});
