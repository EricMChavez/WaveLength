import type { StateCreator } from 'zustand';
import type { GameboardState } from '../../shared/types/index.ts';
import type { WaveformDef, WaveformShape } from '../../puzzle/types.ts';
import { getShapePeriod } from '../../puzzle/waveform-generators.ts';

/** Number of creative mode slots (3 left + 3 right) */
export const CREATIVE_SLOT_COUNT = 6;

/** Default waveform when a slot becomes an input */
const DEFAULT_INPUT_WAVEFORM: WaveformDef = {
  shape: 'sine-quarter',
  amplitude: 100,
  period: 64,
  phase: 0,
  offset: 0,
};

/** State for a single creative mode slot */
export interface CreativeSlotState {
  direction: 'input' | 'output' | 'off';
  /** Waveform definition (only used when direction is 'input') */
  waveform: WaveformDef;
}

/** Create default slot state (all off — fresh creative mode starts empty) */
function createDefaultSlots(): CreativeSlotState[] {
  return Array.from({ length: CREATIVE_SLOT_COUNT }, () => ({
    direction: 'off' as const,
    waveform: { ...DEFAULT_INPUT_WAVEFORM },
  }));
}

/** Saved creative mode state for persistence across puzzle loads */
export interface SavedCreativeState {
  board: GameboardState;
  slots: CreativeSlotState[];
  portConstants: Map<string, number>;
}

export interface CreativeSlice {
  /** Whether creative mode is active */
  isCreativeMode: boolean;
  /** State for all 6 slots (0-2 = left side, 3-5 = right side) */
  creativeSlots: CreativeSlotState[];
  /** Saved creative mode state (preserved when switching to puzzle mode) */
  savedCreativeState: SavedCreativeState | null;

  /** Enter creative mode */
  enterCreativeMode: () => void;
  /** Exit creative mode (saves current state for later restoration) */
  exitCreativeMode: () => void;
  /** Set slot direction (returns true if direction changed) */
  setCreativeSlotDirection: (slotIndex: number, direction: 'input' | 'output' | 'off') => boolean;
  /** Set a complete waveform definition for a slot */
  setCreativeSlotWaveform: (slotIndex: number, waveform: WaveformDef) => void;
  /** Set just the shape of a slot's waveform (keeps other params) */
  setCreativeSlotWaveformShape: (slotIndex: number, shape: WaveformShape) => void;
  /** @deprecated Use slotIndex directly — no conversion needed */
  getCreativeSlotIndex: (side: 'left' | 'right', index: number) => number;
  /** Clear saved creative state (for "New Creative" action) */
  clearSavedCreativeState: () => void;
}

/** @deprecated Use sideToSlot() from shared/grid/slot-helpers.ts instead */
export function meterToSlotIndex(side: 'left' | 'right', index: number): number {
  return side === 'left' ? index : index + 3;
}

/** @deprecated Use slotSide()/slotPerSideIndex() from shared/grid/slot-helpers.ts instead */
export function slotToMeterInfo(slotIndex: number): { side: 'left' | 'right'; index: number } {
  if (slotIndex < 3) {
    return { side: 'left', index: slotIndex };
  }
  return { side: 'right', index: slotIndex - 3 };
}

export const createCreativeSlice: StateCreator<CreativeSlice> = (set, get) => ({
  isCreativeMode: false,
  creativeSlots: createDefaultSlots(),
  savedCreativeState: null,

  enterCreativeMode: () => {
    const { savedCreativeState } = get();
    if (savedCreativeState) {
      // Restore saved slots
      set({ isCreativeMode: true, creativeSlots: savedCreativeState.slots });
    } else {
      set({ isCreativeMode: true });
    }
  },

  exitCreativeMode: () => {
    // Snapshot current state before leaving creative mode
    const fullStore = get() as unknown as {
      activeBoard: GameboardState | null;
      creativeSlots: CreativeSlotState[];
      portConstants: Map<string, number>;
    };
    const saved: SavedCreativeState | null = fullStore.activeBoard
      ? {
          board: fullStore.activeBoard,
          slots: [...fullStore.creativeSlots],
          portConstants: new Map(fullStore.portConstants),
        }
      : null;
    set({
      isCreativeMode: false,
      savedCreativeState: saved,
    });
  },

  setCreativeSlotDirection: (slotIndex, direction) => {
    const state = get();
    if (slotIndex < 0 || slotIndex >= CREATIVE_SLOT_COUNT) return false;
    const currentDirection = state.creativeSlots[slotIndex].direction;
    if (currentDirection === direction) return false;

    const newSlots = [...state.creativeSlots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      direction,
      // Reset waveform to default when switching to input
      waveform: direction === 'input' ? { ...DEFAULT_INPUT_WAVEFORM } : newSlots[slotIndex].waveform,
    };
    set({ creativeSlots: newSlots });
    return true;
  },

  setCreativeSlotWaveform: (slotIndex, waveform) =>
    set((state) => {
      if (slotIndex < 0 || slotIndex >= CREATIVE_SLOT_COUNT) return state;
      const newSlots = [...state.creativeSlots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], waveform };
      return { creativeSlots: newSlots };
    }),

  setCreativeSlotWaveformShape: (slotIndex, shape) =>
    set((state) => {
      if (slotIndex < 0 || slotIndex >= CREATIVE_SLOT_COUNT) return state;
      const newSlots = [...state.creativeSlots];
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        waveform: { ...newSlots[slotIndex].waveform, shape, period: getShapePeriod(shape) },
      };
      return { creativeSlots: newSlots };
    }),

  getCreativeSlotIndex: (side, index) => meterToSlotIndex(side, index),

  clearSavedCreativeState: () => set({
    savedCreativeState: null,
    creativeSlots: createDefaultSlots(),
  }),
});
