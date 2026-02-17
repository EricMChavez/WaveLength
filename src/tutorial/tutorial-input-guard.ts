/**
 * Lightweight tutorial guard.
 *
 * Instead of blocking all input, we only prevent specific game actions
 * that haven't been introduced yet (e.g., opening the palette before
 * the tutorial teaches it). All other input passes through normally
 * so browser hotkeys and general exploration still work.
 */
import type { TutorialStep } from '../store/slices/tutorial-slice.ts';

/**
 * Returns true if the palette should NOT be opened during this tutorial step.
 * The palette is blocked until a step with `allowOverlays` is reached.
 */
export function isTutorialPaletteBlocked(step: TutorialStep): boolean {
  return !step.allowOverlays;
}
