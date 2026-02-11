import type { StateCreator } from 'zustand';

/** Authoring workflow phase */
export type AuthoringPhase = 'idle' | 'saving';

export interface AuthoringSlice {
  /** Current authoring workflow phase */
  authoringPhase: AuthoringPhase;
  /** Begin saving as puzzle (transitions to 'saving' phase) */
  beginSaveAsPuzzle: () => void;
  /** Cancel authoring workflow */
  cancelAuthoring: () => void;
}

export const createAuthoringSlice: StateCreator<AuthoringSlice> = (set) => ({
  authoringPhase: 'idle',

  beginSaveAsPuzzle: () => set({ authoringPhase: 'saving' }),

  cancelAuthoring: () => set({ authoringPhase: 'idle' }),
});
