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
      // Rises from -1 to +1 in the first half, falls from +1 to -1 in the second
      raw = t < 0.5 ? -1 + 4 * t : 3 - 4 * t;
      break;
    case 'sawtooth-full':
    case 'sawtooth-half':
    case 'sawtooth-third':
    case 'sawtooth-quarter':
    case 'sawtooth-fifth':
    case 'sawtooth-sixth':
      // Rises from -1 to +1 over the period
      raw = -1 + 2 * t;
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
