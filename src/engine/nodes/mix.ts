import { clamp } from '../../shared/math/index.ts';

export type MixMode = 'Add' | 'Subtract' | 'Average' | 'Max' | 'Min';

/**
 * Mix node: combines two inputs using the selected mode.
 * All outputs clamped to [-100, 100].
 */
export function evaluateMix(a: number, b: number, mode: MixMode): number {
  switch (mode) {
    case 'Add':
      return clamp(a + b);
    case 'Subtract':
      return clamp(a - b);
    case 'Average':
      return clamp((a + b) / 2);
    case 'Max':
      return clamp(Math.max(a, b));
    case 'Min':
      return clamp(Math.min(a, b));
  }
}
