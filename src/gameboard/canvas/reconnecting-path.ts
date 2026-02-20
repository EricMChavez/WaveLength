/**
 * Module-level transient state for path reconnection drag.
 * When a player drags an existing path endpoint, the original path is hidden
 * in the render loop while a new preview is drawn. Not in Zustand because it's
 * purely visual feedback tied to the drag lifecycle.
 */

let reconnectingPathId: string | null = null;

/** Set the path ID being reconnected (or null to clear). */
export function setReconnectingPathId(id: string | null): void {
  reconnectingPathId = id;
}

/** Get the currently reconnecting path ID (null if none). */
export function getReconnectingPathId(): string | null {
  return reconnectingPathId;
}
