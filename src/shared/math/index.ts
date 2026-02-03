/** Clamp a value to the range [min, max]. Defaults to signal range [-100, 100]. */
export function clamp(value: number, min = -100, max = 100): number {
  if (value < min) return min;
  if (value > max) return max;
  return value || 0; // normalize -0 to 0
}
