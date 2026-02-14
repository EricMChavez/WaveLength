/**
 * Module-level singleton for canvas snapshot capture.
 * Matches the keyboard-focus.ts pattern: register a capture function from the
 * component that owns the canvas, call it from anywhere.
 */

let _capture: (() => OffscreenCanvas | null) | null = null;

/** Register the snapshot capture function. Called from GameboardCanvas effect setup. */
export function registerSnapshotCapture(fn: () => OffscreenCanvas | null): void {
  _capture = fn;
}

/** Unregister the snapshot capture function. Called on cleanup. */
export function unregisterSnapshotCapture(): void {
  _capture = null;
}

/** Capture a snapshot of the current grid area. Returns null if not registered or capture fails. */
export function captureGridSnapshot(): OffscreenCanvas | null {
  return _capture ? _capture() : null;
}
