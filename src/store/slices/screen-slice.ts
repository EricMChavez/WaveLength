import type { StateCreator } from 'zustand';

export type GizmoTab = 'home' | 'settings' | 'about';

export type ScreenTransition =
  | { type: 'idle' }
  | { type: 'sliding-down' }
  | { type: 'sliding-up' };

export interface ScreenSlice {
  activeScreen: GizmoTab | null;
  screenTransition: ScreenTransition;
  tabSwitchGeneration: number;

  switchTab: (tab: GizmoTab) => void;
  dismissScreen: () => void;
  revealScreen: () => void;
  showScreen: () => void;
  completeScreenTransition: () => void;
}

export const createScreenSlice: StateCreator<ScreenSlice> = (set, get) => ({
  activeScreen: null,
  screenTransition: { type: 'idle' },
  tabSwitchGeneration: 0,

  switchTab: (tab) => {
    const { activeScreen } = get();
    if (activeScreen === tab) return;
    set({
      activeScreen: tab,
      tabSwitchGeneration: get().tabSwitchGeneration + 1,
    });
  },

  showScreen: () => set({
    activeScreen: 'home',
    screenTransition: { type: 'idle' },
  }),

  dismissScreen: () => {
    const { activeScreen } = get();
    if (!activeScreen) return;
    set({ screenTransition: { type: 'sliding-down' } });
  },

  revealScreen: () => {
    const { activeScreen } = get();
    if (activeScreen) return;
    set({
      activeScreen: 'home',
      screenTransition: { type: 'sliding-up' },
    });
  },

  completeScreenTransition: () => {
    const { screenTransition } = get();
    if (screenTransition.type === 'sliding-down') {
      set({ activeScreen: null, screenTransition: { type: 'idle' } });
    } else if (screenTransition.type === 'sliding-up') {
      set({ screenTransition: { type: 'idle' } });
    }
  },
});
