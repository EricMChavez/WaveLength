import type { StateCreator } from 'zustand';
import type { GameStore } from '../index.ts';

/**
 * Lid animation state machine for clamshell zoom transitions.
 *
 * Opening: parent board snapshot splits vertically, halves compress toward edges,
 *   revealing child board behind. Used for zoom-in.
 * Closing: child board snapshot shrinks from center toward edges,
 *   revealing parent board behind. Used for zoom-out.
 *
 * progress: 0→1, advanced by rAF loop using (now - startTime) / duration.
 * snapshot: OffscreenCanvas captured before the board switch.
 */
export type LidAnimationState =
  | { type: 'idle' }
  | { type: 'opening'; progress: number; snapshot: OffscreenCanvas; startTime: number }
  | { type: 'closing'; progress: number; snapshot: OffscreenCanvas; startTime: number };

export interface AnimationSlice {
  lidAnimation: LidAnimationState;

  /** Start opening animation (zoom-in). Snapshot is the parent board. */
  startLidOpen: (snapshot: OffscreenCanvas) => void;

  /** Start closing animation (zoom-out). Snapshot is the child board. */
  startLidClose: (snapshot: OffscreenCanvas) => void;

  /** Update progress. Returns true if animation just completed. */
  setLidProgress: (progress: number) => void;

  /** End the animation, returning to idle. */
  endLidAnimation: () => void;
}

export const createAnimationSlice: StateCreator<GameStore, [], [], AnimationSlice> = (
  set,
  get,
) => ({
  lidAnimation: { type: 'idle' },

  startLidOpen: (snapshot) => {
    const current = get().lidAnimation;
    if (current.type !== 'idle') return;
    set({
      lidAnimation: {
        type: 'opening',
        progress: 0,
        snapshot,
        startTime: performance.now(),
      },
    });
  },

  startLidClose: (snapshot) => {
    const current = get().lidAnimation;
    if (current.type !== 'idle') return;
    set({
      lidAnimation: {
        type: 'closing',
        progress: 0,
        snapshot,
        startTime: performance.now(),
      },
    });
  },

  setLidProgress: (progress) => {
    const current = get().lidAnimation;
    if (current.type === 'idle') return;
    set({
      lidAnimation: { ...current, progress: Math.min(progress, 1) },
    });
  },

  endLidAnimation: () => {
    set({ lidAnimation: { type: 'idle' } });
  },
});
