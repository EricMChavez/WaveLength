import { clamp } from '../../shared/math/index.ts';

/**
 * Delay node state: circular buffer that stores inputs and emits them
 * after a specified number of subdivisions (0-16).
 */
export interface DelayState {
  /** Circular buffer pre-filled with 0 */
  buffer: number[];
  /** Current write position in the buffer */
  writeIndex: number;
}

/**
 * Create initial delay state for a given subdivision count.
 * Buffer size = subdivisions + 1 (to hold current + delayed values).
 * A delay of 0 means pass-through (buffer size 1).
 */
export function createDelayState(subdivisions: number): DelayState {
  const size = Math.max(1, subdivisions + 1);
  return {
    buffer: new Array<number>(size).fill(0),
    writeIndex: 0,
  };
}

/**
 * Delay node: stores input and emits the value from `subdivisions` ticks ago.
 * Mutates the DelayState buffer in place and returns the delayed output.
 */
export function evaluateDelay(input: number, state: DelayState): number {
  const size = state.buffer.length;
  // Write current input at write position
  state.buffer[state.writeIndex] = input;
  // Read position is one ahead of write (oldest value in circular buffer)
  const readIndex = (state.writeIndex + 1) % size;
  const output = state.buffer[readIndex];
  // Advance write position
  state.writeIndex = (state.writeIndex + 1) % size;
  return clamp(output);
}
