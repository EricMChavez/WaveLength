import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createProgressionSlice } from './progression-slice.ts';
import type { ProgressionSlice } from './progression-slice.ts';
import { PUZZLE_LEVELS } from '../../puzzle/levels/index.ts';

function createTestStore() {
  return create<ProgressionSlice>()((...a) => createProgressionSlice(...a));
}

describe('progression-slice', () => {
  describe('initial state', () => {
    it('starts with empty completedLevels and currentLevelIndex 0', () => {
      const store = createTestStore();
      const s = store.getState();
      expect(s.completedLevels.size).toBe(0);
      expect(s.currentLevelIndex).toBe(0);
    });
  });

  describe('completeLevel', () => {
    it('adds puzzleId to completedLevels', () => {
      const store = createTestStore();
      const firstId = PUZZLE_LEVELS[0].id;
      store.getState().completeLevel(firstId);
      expect(store.getState().completedLevels.has(firstId)).toBe(true);
      expect(store.getState().completedLevels.size).toBe(1);
    });

    it('advances currentLevelIndex when completing current level', () => {
      const store = createTestStore();
      expect(store.getState().currentLevelIndex).toBe(0);
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      expect(store.getState().currentLevelIndex).toBe(1);
    });

    it('does not advance currentLevelIndex when completing a replay (non-current level)', () => {
      const store = createTestStore();
      // Complete level 0 to advance to 1
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      expect(store.getState().currentLevelIndex).toBe(1);

      // Re-complete level 0 (replay) — should not change currentLevelIndex
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      expect(store.getState().currentLevelIndex).toBe(1);
    });

    it('does not advance past last level', () => {
      const store = createTestStore();
      const lastIndex = PUZZLE_LEVELS.length - 1;
      // Set to last level
      store.getState().setCurrentLevel(lastIndex);

      store.getState().completeLevel(PUZZLE_LEVELS[lastIndex].id);
      expect(store.getState().currentLevelIndex).toBe(lastIndex);
    });

    it('completing multiple levels in sequence advances correctly', () => {
      const store = createTestStore();
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      expect(store.getState().currentLevelIndex).toBe(1);
      store.getState().completeLevel(PUZZLE_LEVELS[1].id);
      expect(store.getState().currentLevelIndex).toBe(2);
      expect(store.getState().completedLevels.size).toBe(2);
    });
  });

  describe('setCurrentLevel', () => {
    it('sets currentLevelIndex within bounds', () => {
      const store = createTestStore();
      store.getState().setCurrentLevel(5);
      expect(store.getState().currentLevelIndex).toBe(5);
    });

    it('clamps to 0 for negative values', () => {
      const store = createTestStore();
      store.getState().setCurrentLevel(-1);
      expect(store.getState().currentLevelIndex).toBe(0);
    });

    it('clamps to max index for overflow', () => {
      const store = createTestStore();
      store.getState().setCurrentLevel(999);
      expect(store.getState().currentLevelIndex).toBe(PUZZLE_LEVELS.length - 1);
    });
  });

  describe('getUnlockedPuzzleIds', () => {
    it('returns empty set when nothing completed', () => {
      const store = createTestStore();
      expect(store.getState().getUnlockedPuzzleIds().size).toBe(0);
    });

    it('returns completed puzzle IDs', () => {
      const store = createTestStore();
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      store.getState().completeLevel(PUZZLE_LEVELS[1].id);
      const ids = store.getState().getUnlockedPuzzleIds();
      expect(ids.has(PUZZLE_LEVELS[0].id)).toBe(true);
      expect(ids.has(PUZZLE_LEVELS[1].id)).toBe(true);
      expect(ids.size).toBe(2);
    });
  });

  describe('isLevelUnlocked', () => {
    it('level 0 is always unlocked', () => {
      const store = createTestStore();
      expect(store.getState().isLevelUnlocked(0)).toBe(true);
    });

    it('level 1 is locked when level 0 not completed', () => {
      const store = createTestStore();
      expect(store.getState().isLevelUnlocked(1)).toBe(false);
    });

    it('level 1 is unlocked when level 0 is completed', () => {
      const store = createTestStore();
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      expect(store.getState().isLevelUnlocked(1)).toBe(true);
    });

    it('returns false for out-of-bounds indices', () => {
      const store = createTestStore();
      expect(store.getState().isLevelUnlocked(-1)).toBe(false);
      expect(store.getState().isLevelUnlocked(PUZZLE_LEVELS.length)).toBe(false);
    });

    it('sequential unlock chain works', () => {
      const store = createTestStore();
      // Complete levels 0, 1, 2
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      store.getState().completeLevel(PUZZLE_LEVELS[1].id);
      store.getState().completeLevel(PUZZLE_LEVELS[2].id);

      expect(store.getState().isLevelUnlocked(0)).toBe(true);
      expect(store.getState().isLevelUnlocked(1)).toBe(true);
      expect(store.getState().isLevelUnlocked(2)).toBe(true);
      expect(store.getState().isLevelUnlocked(3)).toBe(true);
      expect(store.getState().isLevelUnlocked(4)).toBe(false);
    });
  });

  describe('level selection state transitions', () => {
    it('selecting an unlocked level updates currentLevelIndex', () => {
      const store = createTestStore();
      // Complete level 0 to unlock level 1
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      expect(store.getState().isLevelUnlocked(1)).toBe(true);

      // Select level 1
      store.getState().setCurrentLevel(1);
      expect(store.getState().currentLevelIndex).toBe(1);
    });

    it('selecting level 0 is always valid', () => {
      const store = createTestStore();
      store.getState().setCurrentLevel(0);
      expect(store.getState().currentLevelIndex).toBe(0);
      expect(store.getState().isLevelUnlocked(0)).toBe(true);
    });

    it('level selection resolves correct puzzle from PUZZLE_LEVELS', () => {
      const store = createTestStore();
      store.getState().setCurrentLevel(3);
      const puzzle = PUZZLE_LEVELS[store.getState().currentLevelIndex];
      expect(puzzle).toBeDefined();
      expect(puzzle.id).toBe(PUZZLE_LEVELS[3].id);
    });

    it('selecting a locked level should be prevented by isLevelUnlocked', () => {
      const store = createTestStore();
      // Level 2 is locked (level 1 not completed)
      expect(store.getState().isLevelUnlocked(2)).toBe(false);
      // The guard prevents selection — caller checks isLevelUnlocked before setCurrentLevel
    });
  });

  describe('app initialization from progression state', () => {
    it('default state loads first puzzle (index 0)', () => {
      const store = createTestStore();
      const levelIndex = store.getState().currentLevelIndex;
      expect(levelIndex).toBe(0);
      const puzzle = PUZZLE_LEVELS[levelIndex];
      expect(puzzle).toBeDefined();
      expect(puzzle.id).toBe(PUZZLE_LEVELS[0].id);
    });

    it('after completing level 0, currentLevelIndex points to level 1', () => {
      const store = createTestStore();
      store.getState().completeLevel(PUZZLE_LEVELS[0].id);
      const levelIndex = store.getState().currentLevelIndex;
      expect(levelIndex).toBe(1);
      const puzzle = PUZZLE_LEVELS[levelIndex];
      expect(puzzle).toBeDefined();
      expect(puzzle.id).toBe(PUZZLE_LEVELS[1].id);
    });

    it('after completing multiple levels, currentLevelIndex reflects progress', () => {
      const store = createTestStore();
      for (let i = 0; i < 5; i++) {
        store.getState().completeLevel(PUZZLE_LEVELS[i].id);
      }
      const levelIndex = store.getState().currentLevelIndex;
      expect(levelIndex).toBe(5);
      const puzzle = PUZZLE_LEVELS[levelIndex];
      expect(puzzle).toBeDefined();
      expect(puzzle.id).toBe(PUZZLE_LEVELS[5].id);
    });

    it('fallback to PUZZLE_LEVELS[0] when index exceeds array', () => {
      const store = createTestStore();
      // Even with setCurrentLevel at max, PUZZLE_LEVELS[index] resolves
      store.getState().setCurrentLevel(999);
      const levelIndex = store.getState().currentLevelIndex;
      const puzzle = PUZZLE_LEVELS[levelIndex] ?? PUZZLE_LEVELS[0];
      expect(puzzle).toBeDefined();
    });
  });
});
