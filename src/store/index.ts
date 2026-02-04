import { create } from 'zustand';
import { createGameboardSlice } from './slices/gameboard-slice.ts';
import type { GameboardSlice } from './slices/gameboard-slice.ts';
import { createInteractionSlice } from './slices/interaction-slice.ts';
import type { InteractionSlice } from './slices/interaction-slice.ts';
import { createSimulationSlice } from './slices/simulation-slice.ts';
import type { SimulationSlice } from './slices/simulation-slice.ts';
import { createPuzzleSlice } from './slices/puzzle-slice.ts';
import type { PuzzleSlice } from './slices/puzzle-slice.ts';
import { createPaletteSlice } from './slices/palette-slice.ts';
import type { PaletteSlice } from './slices/palette-slice.ts';
import { createCeremonySlice } from './slices/ceremony-slice.ts';
import type { CeremonySlice } from './slices/ceremony-slice.ts';
import { createNavigationSlice } from './slices/navigation-slice.ts';
import type { NavigationSlice } from './slices/navigation-slice.ts';
import { createProgressionSlice } from './slices/progression-slice.ts';
import type { ProgressionSlice } from './slices/progression-slice.ts';
import { createHistorySlice, initHistory } from './slices/history-slice.ts';
import type { HistorySlice } from './slices/history-slice.ts';
import { initPersistence } from './persistence.ts';

export type GameStore = GameboardSlice & InteractionSlice & SimulationSlice & PuzzleSlice & PaletteSlice & CeremonySlice & NavigationSlice & ProgressionSlice & HistorySlice;

export const useGameStore = create<GameStore>()((...a) => ({
  ...createGameboardSlice(...a),
  ...createInteractionSlice(...a),
  ...createSimulationSlice(...a),
  ...createPuzzleSlice(...a),
  ...createPaletteSlice(...a),
  ...createCeremonySlice(...a),
  ...createNavigationSlice(...a),
  ...createProgressionSlice(...a),
  ...createHistorySlice(...a),
}));

// Set up undo/redo auto-capture via graphVersion subscriber
initHistory(useGameStore);

// Hydrate saved state from localStorage and set up auto-save
initPersistence(useGameStore);
