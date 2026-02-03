/**
 * Threshold node: outputs +100 if A > threshold, else -100.
 * Output is always exactly +100 or -100 (no clamping needed).
 */
export function evaluateThreshold(a: number, threshold: number): number {
  return a > threshold ? 100 : -100;
}
