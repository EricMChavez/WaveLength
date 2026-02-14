import { describe, it, expect } from 'vitest';
import { slotSide, slotPerSideIndex, sideToSlot, SLOTS_PER_SIDE, TOTAL_SLOTS } from './slot-helpers';
import {
  buildSlotConfig,
  buildSlotConfigFromDirections,
  directionIndexToSlot,
  slotToDirectionIndex,
  slotConfigToDirections,
} from '../../puzzle/types';

describe('slot-helpers', () => {
  describe('slotSide', () => {
    it('returns left for slots 0-2', () => {
      expect(slotSide(0)).toBe('left');
      expect(slotSide(1)).toBe('left');
      expect(slotSide(2)).toBe('left');
    });
    it('returns right for slots 3-5', () => {
      expect(slotSide(3)).toBe('right');
      expect(slotSide(4)).toBe('right');
      expect(slotSide(5)).toBe('right');
    });
  });

  describe('slotPerSideIndex', () => {
    it('returns 0-2 for left slots', () => {
      expect(slotPerSideIndex(0)).toBe(0);
      expect(slotPerSideIndex(1)).toBe(1);
      expect(slotPerSideIndex(2)).toBe(2);
    });
    it('returns 0-2 for right slots', () => {
      expect(slotPerSideIndex(3)).toBe(0);
      expect(slotPerSideIndex(4)).toBe(1);
      expect(slotPerSideIndex(5)).toBe(2);
    });
  });

  describe('sideToSlot', () => {
    it('maps left side to 0-2', () => {
      expect(sideToSlot('left', 0)).toBe(0);
      expect(sideToSlot('left', 1)).toBe(1);
      expect(sideToSlot('left', 2)).toBe(2);
    });
    it('maps right side to 3-5', () => {
      expect(sideToSlot('right', 0)).toBe(3);
      expect(sideToSlot('right', 1)).toBe(4);
      expect(sideToSlot('right', 2)).toBe(5);
    });
  });

  describe('roundtrip', () => {
    it('sideToSlot → slotSide/slotPerSideIndex roundtrips for all slots', () => {
      for (const side of ['left', 'right'] as const) {
        for (let idx = 0; idx < SLOTS_PER_SIDE; idx++) {
          const slot = sideToSlot(side, idx);
          expect(slotSide(slot)).toBe(side);
          expect(slotPerSideIndex(slot)).toBe(idx);
        }
      }
    });
  });

  describe('constants', () => {
    it('SLOTS_PER_SIDE is 3', () => {
      expect(SLOTS_PER_SIDE).toBe(3);
    });
    it('TOTAL_SLOTS is 6', () => {
      expect(TOTAL_SLOTS).toBe(6);
    });
  });
});

describe('SlotConfig builders', () => {
  describe('buildSlotConfig', () => {
    it('builds standard 1-in 1-out config', () => {
      const config = buildSlotConfig(1, 1);
      expect(config[0]).toEqual({ active: true, direction: 'input' });
      expect(config[1]).toEqual({ active: false, direction: 'input' });
      expect(config[2]).toEqual({ active: false, direction: 'input' });
      expect(config[3]).toEqual({ active: true, direction: 'output' });
      expect(config[4]).toEqual({ active: false, direction: 'output' });
      expect(config[5]).toEqual({ active: false, direction: 'output' });
    });

    it('builds 3-in 3-out config', () => {
      const config = buildSlotConfig(3, 3);
      for (let i = 0; i < 6; i++) {
        expect(config[i].active).toBe(true);
      }
    });

    it('builds 2-in 1-out config', () => {
      const config = buildSlotConfig(2, 1);
      expect(config[0].active).toBe(true);
      expect(config[1].active).toBe(true);
      expect(config[2].active).toBe(false);
      expect(config[3].active).toBe(true);
      expect(config[4].active).toBe(false);
      expect(config[5].active).toBe(false);
    });
  });

  describe('buildSlotConfigFromDirections', () => {
    it('builds from input/output/off array', () => {
      const config = buildSlotConfigFromDirections(['input', 'off', 'output', 'off', 'output', 'input']);
      expect(config[0]).toEqual({ active: true, direction: 'input' });
      expect(config[1]).toEqual({ active: false, direction: 'input' });
      expect(config[2]).toEqual({ active: true, direction: 'output' });
      expect(config[3]).toEqual({ active: false, direction: 'output' });
      expect(config[4]).toEqual({ active: true, direction: 'output' });
      expect(config[5]).toEqual({ active: true, direction: 'input' });
    });
  });

  describe('directionIndexToSlot', () => {
    it('maps 1st input to slot 0 in standard config', () => {
      const config = buildSlotConfig(2, 2);
      expect(directionIndexToSlot(config, 'input', 0)).toBe(0);
      expect(directionIndexToSlot(config, 'input', 1)).toBe(1);
      expect(directionIndexToSlot(config, 'output', 0)).toBe(3);
      expect(directionIndexToSlot(config, 'output', 1)).toBe(4);
    });

    it('returns -1 for out-of-range direction index', () => {
      const config = buildSlotConfig(1, 1);
      expect(directionIndexToSlot(config, 'input', 1)).toBe(-1);
      expect(directionIndexToSlot(config, 'output', 1)).toBe(-1);
    });

    it('handles non-standard layouts (outputs on left)', () => {
      const config = buildSlotConfigFromDirections(['output', 'input', 'off', 'off', 'output', 'off']);
      expect(directionIndexToSlot(config, 'output', 0)).toBe(0);
      expect(directionIndexToSlot(config, 'input', 0)).toBe(1);
      expect(directionIndexToSlot(config, 'output', 1)).toBe(4);
    });
  });

  describe('slotToDirectionIndex', () => {
    it('maps slot 0 to input index 0 in standard config', () => {
      const config = buildSlotConfig(2, 2);
      expect(slotToDirectionIndex(config, 0)).toBe(0);
      expect(slotToDirectionIndex(config, 1)).toBe(1);
      expect(slotToDirectionIndex(config, 3)).toBe(0);
      expect(slotToDirectionIndex(config, 4)).toBe(1);
    });

    it('returns -1 for inactive slots', () => {
      const config = buildSlotConfig(1, 1);
      expect(slotToDirectionIndex(config, 1)).toBe(-1);
      expect(slotToDirectionIndex(config, 4)).toBe(-1);
    });
  });

  describe('slotConfigToDirections', () => {
    it('converts config to directions array', () => {
      const config = buildSlotConfig(1, 1);
      const dirs = slotConfigToDirections(config);
      expect(dirs).toEqual(['input', 'off', 'off', 'output', 'off', 'off']);
    });
  });

  describe('directionIndexToSlot / slotToDirectionIndex roundtrip', () => {
    it('roundtrips for all active slots', () => {
      const config = buildSlotConfig(2, 3);
      for (let i = 0; i < 6; i++) {
        if (!config[i].active) continue;
        const dirIdx = slotToDirectionIndex(config, i);
        const backToSlot = directionIndexToSlot(config, config[i].direction, dirIdx);
        expect(backToSlot).toBe(i);
      }
    });
  });
});
