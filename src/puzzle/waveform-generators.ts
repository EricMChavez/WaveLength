import type { WaveformDef, WaveformShape } from './types.ts';
import { clamp } from '../shared/math/index.ts';

/**
 * Generate a raw shape value in the range [-1, +1] for a given tick.
 * The shape completes one cycle every `period` ticks, offset by `phase`.
 */
function generateShape(shape: WaveformShape, tick: number, period: number, phase: number): number {
  if (period <= 0) return 0;

  // Normalized position within the cycle [0, 1)
  const t = (((tick + phase) % period) + period) % period / period;

  // Determine if reduced (50% amplitude) and get base shape
  const isReduced = shape.endsWith('-reduced');
  const amplitudeScale = isReduced ? 0.5 : 1;
  const baseShape = isReduced ? shape.replace(/-reduced$/, '') : shape;

  let raw: number;
  switch (baseShape) {
    case 'sine-full':
    case 'sine-half':
    case 'sine-third':
    case 'sine-quarter':
    case 'sine-fifth':
    case 'sine-sixth':
      raw = Math.sin(2 * Math.PI * t);
      break;
    case 'square-full':
    case 'square-half':
    case 'square-third':
    case 'square-quarter':
    case 'square-fifth':
    case 'square-sixth':
      raw = t < 0.5 ? 1 : -1;
      break;
    case 'triangle-full':
    case 'triangle-half':
    case 'triangle-third':
    case 'triangle-quarter':
    case 'triangle-fifth':
    case 'triangle-sixth':
      // Starts at 0, peaks at +1 at t=0.25, crosses 0 at t=0.5, troughs at -1 at t=0.75
      raw = t < 0.25 ? 4 * t : t < 0.75 ? 2 - 4 * t : -4 + 4 * t;
      break;
    case 'sawtooth-full':
    case 'sawtooth-half':
    case 'sawtooth-third':
    case 'sawtooth-quarter':
    case 'sawtooth-fifth':
    case 'sawtooth-sixth':
      // Starts at 0, rises to +1 at t=0.5, jumps to -1, rises back to 0
      raw = t < 0.5 ? 2 * t : -2 + 2 * t;
      break;
    default:
      raw = 0;
  }

  return raw * amplitudeScale;
}

/**
 * Generate a waveform value at a given tick, clamped to [-100, +100].
 * output = clamp(shape(tick) * amplitude + offset)
 *
 * For 'samples' shape, returns samples[tick % samples.length] directly.
 */
export function generateWaveformValue(tick: number, def: WaveformDef): number {
  // Special case: samples shape returns raw sample values
  if (def.shape === 'samples' && def.samples && def.samples.length > 0) {
    const index = ((tick % def.samples.length) + def.samples.length) % def.samples.length;
    return clamp(def.samples[index]);
  }

  const raw = generateShape(def.shape, tick, def.period, def.phase);
  const scaled = raw * def.amplitude + def.offset;
  return clamp(scaled);
}

// ---------------------------------------------------------------------------
// FM (Frequency-Modulated) waveform generation
// ---------------------------------------------------------------------------

type FMBaseShape = 'sine' | 'square' | 'triangle' | 'sawtooth';

/**
 * Map a normalized phase [0,1) to a raw value [-1,+1] for a base shape.
 * Phase wraps via modular arithmetic so any real value is valid.
 */
export function shapeAtPhase(base: FMBaseShape, phase: number): number {
  // Normalize to [0,1)
  const t = ((phase % 1) + 1) % 1;

  switch (base) {
    case 'sine':
      return Math.sin(2 * Math.PI * t);
    case 'square':
      return t < 0.5 ? 1 : -1;
    case 'triangle':
      return t < 0.25 ? 4 * t : t < 0.75 ? 2 - 4 * t : -4 + 4 * t;
    case 'sawtooth':
      return t < 0.5 ? 2 * t : -2 + 2 * t;
    default:
      return 0;
  }
}

/**
 * Generate 256 FM-modulated samples using sinusoidal phase accumulation.
 *
 * phase(t) = N*t - depth/(2π*M) * (cos(2πMt) - 1)
 * output = baseShape(phase mod 1) * amplitude
 *
 * Perfect looping is guaranteed when N and M are integers.
 *
 * @param baseShape  Base waveform shape
 * @param baseCycles Number of base cycles over 256 samples (N)
 * @param modRate    Modulation rate — cycles of the modulator per 256 samples (M)
 * @param depth      Modulation depth (higher = more FM)
 * @param amplitude  Output amplitude (0–100)
 * @returns 256 clamped samples in [-100, +100]
 */
export function generateFMSamples(
  baseShape: FMBaseShape,
  baseCycles: number,
  modRate: number,
  depth: number,
  amplitude: number,
): number[] {
  const NUM_SAMPLES = 256;
  const samples: number[] = new Array(NUM_SAMPLES);
  const twoPi = 2 * Math.PI;

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / NUM_SAMPLES; // normalized time [0, 1)

    let phase: number;
    if (modRate === 0) {
      // No modulation — constant frequency
      phase = baseCycles * t;
    } else {
      // FM: phase(t) = N*t - depth/(2π*M) * (cos(2πMt) - 1)
      phase = baseCycles * t - (depth / (twoPi * modRate)) * (Math.cos(twoPi * modRate * t) - 1);
    }

    const raw = shapeAtPhase(baseShape, phase);
    samples[i] = clamp(raw * amplitude);
  }

  return samples;
}

/**
 * Build a WaveformDef with the canonical period auto-derived from the shape name.
 * Prevents period rounding bugs by never accepting a manual period value.
 * Not usable for 'samples' shape — those need explicit samples arrays.
 */
export function waveform(
  shape: Exclude<WaveformShape, 'samples'>,
  opts?: { amplitude?: number; phase?: number; offset?: number },
): WaveformDef {
  return {
    shape,
    amplitude: opts?.amplitude ?? 100,
    period: getShapePeriod(shape),
    phase: opts?.phase ?? 0,
    offset: opts?.offset ?? 0,
  };
}

/** Get the canonical period for a waveform shape. */
export function getShapePeriod(shape: WaveformShape): number {
  // Strip -reduced suffix for period calculation
  const baseShape = shape.endsWith('-reduced') ? shape.replace(/-reduced$/, '') : shape;
  if (baseShape.endsWith('-full')) return 256;
  if (baseShape.endsWith('-half')) return 128;
  if (baseShape.endsWith('-third')) return 256 / 3;
  if (baseShape.endsWith('-quarter')) return 64;
  if (baseShape.endsWith('-fifth')) return 256 / 5;
  if (baseShape.endsWith('-sixth')) return 256 / 6;
  return 64; // samples fallback
}
