import { clamp } from '../../shared/math/index.ts';

/**
 * Multiply node: (A * B) / 100
 * Division by 100 keeps results in signal range when both inputs are in [-100, 100].
 */
export function evaluateMultiply(a: number, b: number): number {
  return clamp((a * b) / 100);
}
