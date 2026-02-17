import type { StateCreator } from 'zustand';
import { PUZZLE_LEVELS } from '../../puzzle/levels/index.ts';

export interface ProgressionSlice {
  /** Set of completed puzzle IDs */
  completedLevels: Set<string>;
  /** Index into PUZZLE_LEVELS for the current level */
  currentLevelIndex: number;

  /** Mark a puzzle as completed and advance to next level */
  completeLevel: (puzzleId: string) => void;
  /** Set the current level index (for replay navigation) */
  setCurrentLevel: (index: number) => void;
  /** Get the set of completed puzzle IDs (same as completedLevels) */
  getUnlockedPuzzleIds: () => Set<string>;
  /** Check if a level index is unlocked (0 always, others require previous completion) */
  isLevelUnlocked: (index: number) => boolean;
}

export const createProgressionSlice: StateCreator<ProgressionSlice> = (set, get) => ({
  completedLevels: new Set<string>(),
  currentLevelIndex: 0,

  completeLevel: (puzzleId) =>
    set((state) => {
      const next = new Set(state.completedLevels);
      next.add(puzzleId);

      if (PUZZLE_LEVELS.length === 0) return { completedLevels: next };

      // Advance currentLevelIndex to the next uncompleted level
      const currentPuzzle = PUZZLE_LEVELS[state.currentLevelIndex];
      if (currentPuzzle && currentPuzzle.id === puzzleId) {
        // Only advance if completing the current level (not a replay)
        const nextIndex = Math.min(state.currentLevelIndex + 1, PUZZLE_LEVELS.length - 1);
        return { completedLevels: next, currentLevelIndex: nextIndex };
      }

      return { completedLevels: next };
    }),

  setCurrentLevel: (index) =>
    set(() => {
      if (PUZZLE_LEVELS.length === 0) return { currentLevelIndex: 0 };
      return { currentLevelIndex: Math.max(0, Math.min(index, PUZZLE_LEVELS.length - 1)) };
    }),

  getUnlockedPuzzleIds: () => get().completedLevels,

  isLevelUnlocked: (index) => {
    if (index === 0) return true;
    if (PUZZLE_LEVELS.length === 0) return false;
    if (index < 0 || index >= PUZZLE_LEVELS.length) return false;
    const previousPuzzle = PUZZLE_LEVELS[index - 1];
    return get().completedLevels.has(previousPuzzle.id);
  },
});
