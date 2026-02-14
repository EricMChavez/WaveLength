/** Number of meter/CP slots per side (left / right) */
export const SLOTS_PER_SIDE = 3;

/** Total number of meter/CP slots across both sides */
export const TOTAL_SLOTS = 6;

/** Get the physical side for a slot index. 0-2 = left, 3-5 = right. */
export function slotSide(slot: number): 'left' | 'right' {
  return slot < SLOTS_PER_SIDE ? 'left' : 'right';
}

/** Get the per-side index (0-2) for a slot index. */
export function slotPerSideIndex(slot: number): number {
  return slot % SLOTS_PER_SIDE;
}

/** Convert a physical side and per-side index to a flat slot index. */
export function sideToSlot(side: 'left' | 'right', idx: number): number {
  return side === 'left' ? idx : idx + SLOTS_PER_SIDE;
}
