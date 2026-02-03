import { describe, it, expect } from 'vitest';
import { evaluateMix } from './mix.ts';

describe('evaluateMix', () => {
  describe('Add mode', () => {
    it('adds two values', () => {
      expect(evaluateMix(30, 20, 'Add')).toBe(50);
    });

    it('clamps positive overflow', () => {
      expect(evaluateMix(80, 80, 'Add')).toBe(100);
    });

    it('clamps negative overflow', () => {
      expect(evaluateMix(-80, -80, 'Add')).toBe(-100);
    });

    it('handles zero inputs', () => {
      expect(evaluateMix(0, 0, 'Add')).toBe(0);
    });

    it('handles edge values -100 and +100', () => {
      expect(evaluateMix(-100, 100, 'Add')).toBe(0);
      expect(evaluateMix(100, 100, 'Add')).toBe(100);
      expect(evaluateMix(-100, -100, 'Add')).toBe(-100);
    });
  });

  describe('Subtract mode', () => {
    it('subtracts B from A', () => {
      expect(evaluateMix(50, 20, 'Subtract')).toBe(30);
    });

    it('clamps positive overflow', () => {
      expect(evaluateMix(100, -100, 'Subtract')).toBe(100);
    });

    it('clamps negative overflow', () => {
      expect(evaluateMix(-100, 100, 'Subtract')).toBe(-100);
    });

    it('handles zero inputs', () => {
      expect(evaluateMix(0, 0, 'Subtract')).toBe(0);
    });

    it('handles edge values', () => {
      expect(evaluateMix(-100, -100, 'Subtract')).toBe(0);
      expect(evaluateMix(100, 100, 'Subtract')).toBe(0);
    });
  });

  describe('Average mode', () => {
    it('averages two values', () => {
      expect(evaluateMix(60, 40, 'Average')).toBe(50);
    });

    it('averages extreme values', () => {
      expect(evaluateMix(100, -100, 'Average')).toBe(0);
    });

    it('averages same values', () => {
      expect(evaluateMix(100, 100, 'Average')).toBe(100);
      expect(evaluateMix(-100, -100, 'Average')).toBe(-100);
    });

    it('handles zero inputs', () => {
      expect(evaluateMix(0, 0, 'Average')).toBe(0);
    });
  });

  describe('Max mode', () => {
    it('returns the larger value', () => {
      expect(evaluateMix(30, 70, 'Max')).toBe(70);
    });

    it('handles equal values', () => {
      expect(evaluateMix(50, 50, 'Max')).toBe(50);
    });

    it('handles negative values', () => {
      expect(evaluateMix(-80, -20, 'Max')).toBe(-20);
    });

    it('handles edge values', () => {
      expect(evaluateMix(-100, 100, 'Max')).toBe(100);
      expect(evaluateMix(0, -100, 'Max')).toBe(0);
    });
  });

  describe('Min mode', () => {
    it('returns the smaller value', () => {
      expect(evaluateMix(30, 70, 'Min')).toBe(30);
    });

    it('handles equal values', () => {
      expect(evaluateMix(50, 50, 'Min')).toBe(50);
    });

    it('handles negative values', () => {
      expect(evaluateMix(-80, -20, 'Min')).toBe(-80);
    });

    it('handles edge values', () => {
      expect(evaluateMix(-100, 100, 'Min')).toBe(-100);
      expect(evaluateMix(0, 100, 'Min')).toBe(0);
    });
  });
});
