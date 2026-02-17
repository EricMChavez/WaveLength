import { describe, it, expect } from 'vitest';
import { PUZZLE_LEVELS } from './index';

describe('Puzzle levels', () => {
  it('starts with an empty puzzle library', () => {
    expect(PUZZLE_LEVELS).toEqual([]);
  });
});
