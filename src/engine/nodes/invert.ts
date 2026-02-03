import { clamp } from '../../shared/math/index.ts';

/**
 * Invert node: outputs -A.
 */
export function evaluateInvert(a: number): number {
  return clamp(-a);
}
