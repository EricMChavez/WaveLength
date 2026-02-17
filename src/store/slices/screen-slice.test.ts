import { describe, it, expect } from 'vitest';
import { createScreenSlice } from './screen-slice.ts';
import type { ScreenSlice } from './screen-slice.ts';

function createTestStore() {
  const container = { state: {} as ScreenSlice };
  const set = (partial: Partial<ScreenSlice>) => {
    Object.assign(container.state, partial);
  };
  const get = () => container.state;
  container.state = createScreenSlice(set as never, get as never, {} as never);
  return container;
}

describe('screen-slice', () => {
  describe('initial state', () => {
    it('starts with null activeScreen, idle transition, and generation 0', () => {
      const { state } = createTestStore();
      expect(state.activeScreen).toBe(null);
      expect(state.screenTransition).toEqual({ type: 'idle' });
      expect(state.tabSwitchGeneration).toBe(0);
    });
  });

  describe('showScreen', () => {
    it('sets activeScreen to home with idle transition', () => {
      const { state } = createTestStore();
      state.showScreen();
      expect(state.activeScreen).toBe('home');
      expect(state.screenTransition).toEqual({ type: 'idle' });
    });
  });

  describe('switchTab', () => {
    it('switches to a different tab and bumps generation', () => {
      const { state } = createTestStore();
      state.showScreen();
      state.switchTab('settings');
      expect(state.activeScreen).toBe('settings');
      expect(state.tabSwitchGeneration).toBe(1);
    });

    it('does nothing when switching to the same tab', () => {
      const { state } = createTestStore();
      state.showScreen();
      state.switchTab('home');
      expect(state.activeScreen).toBe('home');
      expect(state.tabSwitchGeneration).toBe(0);
    });

    it('increments generation on each switch', () => {
      const { state } = createTestStore();
      state.showScreen();
      state.switchTab('settings');
      state.switchTab('about');
      state.switchTab('home');
      expect(state.tabSwitchGeneration).toBe(3);
    });
  });

  describe('dismissScreen', () => {
    it('starts sliding-down transition', () => {
      const { state } = createTestStore();
      state.showScreen();
      state.dismissScreen();
      expect(state.screenTransition).toEqual({ type: 'sliding-down' });
    });

    it('does nothing when no active screen', () => {
      const { state } = createTestStore();
      state.dismissScreen();
      expect(state.screenTransition).toEqual({ type: 'idle' });
    });
  });

  describe('revealScreen', () => {
    it('starts sliding-up transition and sets activeScreen to home', () => {
      const { state } = createTestStore();
      state.revealScreen();
      expect(state.activeScreen).toBe('home');
      expect(state.screenTransition).toEqual({ type: 'sliding-up' });
    });

    it('does nothing when a screen is already active', () => {
      const { state } = createTestStore();
      state.showScreen();
      state.switchTab('settings');
      state.revealScreen();
      expect(state.activeScreen).toBe('settings');
      expect(state.screenTransition).toEqual({ type: 'idle' });
    });
  });

  describe('completeScreenTransition', () => {
    it('completes sliding-down: clears activeScreen', () => {
      const { state } = createTestStore();
      state.showScreen();
      state.dismissScreen();
      state.completeScreenTransition();
      expect(state.activeScreen).toBe(null);
      expect(state.screenTransition).toEqual({ type: 'idle' });
    });

    it('completes sliding-up: keeps activeScreen, clears transition', () => {
      const { state } = createTestStore();
      state.revealScreen();
      state.completeScreenTransition();
      expect(state.activeScreen).toBe('home');
      expect(state.screenTransition).toEqual({ type: 'idle' });
    });

    it('does nothing on idle', () => {
      const { state } = createTestStore();
      state.completeScreenTransition();
      expect(state.activeScreen).toBe(null);
      expect(state.screenTransition).toEqual({ type: 'idle' });
    });
  });
});
