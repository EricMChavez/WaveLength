import type { WaveformDef } from '../types.ts';

// =============================================================================
// Reusable waveform definitions (used by tutorial puzzle and future levels)
// =============================================================================

export const SINE_FULL_100: WaveformDef = {
  shape: 'sine-full', amplitude: 100, period: 256, phase: 0, offset: 0,
};

export const SINE_HALF_50: WaveformDef = {
  shape: 'sine-half', amplitude: 50, period: 128, phase: 0, offset: 0,
};

export const TRIANGLE_FULL_100: WaveformDef = {
  shape: 'triangle-full', amplitude: 100, period: 256, phase: 0, offset: 0,
};
