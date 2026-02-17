import { describe, it, expect } from 'vitest';
import { createPlaypointSlice } from './playpoint-slice';
import type { PlaypointSlice } from './playpoint-slice';

/** Create an isolated playpoint slice for testing. */
function createTestSlice(): PlaypointSlice {
  let state: PlaypointSlice;
  const set = (partial: Partial<PlaypointSlice> | ((s: PlaypointSlice) => Partial<PlaypointSlice>)) => {
    if (typeof partial === 'function') {
      Object.assign(state, partial(state));
    } else {
      Object.assign(state, partial);
    }
  };
  const get = () => state;
  state = createPlaypointSlice(set as never, get as never, {} as never);
  return state;
}

describe('playpoint-slice', () => {
  describe('togglePlayMode', () => {
    it('toggles from playing to paused normally', () => {
      const slice = createTestSlice();
      expect(slice.playMode).toBe('playing');
      slice.togglePlayMode();
      expect(slice.playMode).toBe('paused');
    });

    it('toggles from paused to playing normally', () => {
      const slice = createTestSlice();
      slice.togglePlayMode(); // → paused
      slice.togglePlayMode(); // → playing
      expect(slice.playMode).toBe('playing');
    });

    it('is a no-op when playPauseTransitioning is true', () => {
      const slice = createTestSlice();
      expect(slice.playMode).toBe('playing');
      slice.setPlayPauseTransitioning(true);
      slice.togglePlayMode();
      expect(slice.playMode).toBe('playing'); // unchanged
    });

    it('works again after transitioning is cleared', () => {
      const slice = createTestSlice();
      slice.setPlayPauseTransitioning(true);
      slice.togglePlayMode(); // no-op
      expect(slice.playMode).toBe('playing');

      slice.setPlayPauseTransitioning(false);
      slice.togglePlayMode(); // should work now
      expect(slice.playMode).toBe('paused');
    });
  });

  describe('stepPlaypoint', () => {
    it('steps playpoint normally', () => {
      const slice = createTestSlice();
      expect(slice.playpoint).toBe(0);
      slice.stepPlaypoint(5);
      expect(slice.playpoint).toBe(5);
    });

    it('wraps around 256', () => {
      const slice = createTestSlice();
      slice.stepPlaypoint(255);
      slice.stepPlaypoint(2);
      expect(slice.playpoint).toBe(1); // (255+2) % 256 = 1
    });

    it('is a no-op when playPauseTransitioning is true', () => {
      const slice = createTestSlice();
      slice.stepPlaypoint(10);
      expect(slice.playpoint).toBe(10);

      slice.setPlayPauseTransitioning(true);
      slice.stepPlaypoint(5);
      expect(slice.playpoint).toBe(10); // unchanged
    });

    it('works again after transitioning is cleared', () => {
      const slice = createTestSlice();
      slice.setPlayPauseTransitioning(true);
      slice.stepPlaypoint(5); // no-op
      expect(slice.playpoint).toBe(0);

      slice.setPlayPauseTransitioning(false);
      slice.stepPlaypoint(5);
      expect(slice.playpoint).toBe(5);
    });
  });

  describe('setPlayPauseTransitioning', () => {
    it('defaults to false', () => {
      const slice = createTestSlice();
      expect(slice.playPauseTransitioning).toBe(false);
    });

    it('can be set to true and back', () => {
      const slice = createTestSlice();
      slice.setPlayPauseTransitioning(true);
      expect(slice.playPauseTransitioning).toBe(true);
      slice.setPlayPauseTransitioning(false);
      expect(slice.playPauseTransitioning).toBe(false);
    });
  });
});
