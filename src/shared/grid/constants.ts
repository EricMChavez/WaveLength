/** Total grid columns (expanded from 64 to 66 for more playable area) */
export const GRID_COLS = 66;

/** Total grid rows (doubled density) */
export const GRID_ROWS = 36;

/** Minimum cell size in pixels before showing "viewport too small" warning */
export const MIN_CELL_SIZE = 16;

/** Left meter zone: columns 0-9 (10 columns for analog meters) */
export const METER_LEFT_START = 0;
export const METER_LEFT_END = 9;

/** Playable area: columns 10-55 (46 columns for nodes and wires) */
export const PLAYABLE_START = 10;
export const PLAYABLE_END = 55;

/** Right meter zone: columns 56-65 (10 columns for analog meters) */
export const METER_RIGHT_START = 56;
export const METER_RIGHT_END = 65;

/** Motherboard playable area (no meters, 2-col margin each side) */
export const MOTHERBOARD_PLAYABLE_START = 2;
export const MOTHERBOARD_PLAYABLE_END = 63;
