import type { GridPoint } from '../shared/grid/types.ts';

/** Identifiers for the three motherboard sections. */
export type MotherboardSectionId = 'primary' | 'puzzles' | 'custom';

/** A visual section container on the motherboard. */
export interface MotherboardSection {
  id: MotherboardSectionId;
  /** Grid bounds of the section container (position + size). */
  gridBounds: { col: number; row: number; cols: number; rows: number };
}

/** An edge connection point rendered at a section boundary. */
export interface MotherboardEdgeCP {
  /** Menu node this belongs to. */
  chipId: string;
  /** Puzzle slot index (0-5). */
  slotIndex: number;
  /** Side of section boundary. */
  side: 'left' | 'right';
  /** Position on the grid. */
  gridPosition: GridPoint;
  /** Inverse of chip port: chip input -> edge output, chip output -> edge input. */
  direction: 'input' | 'output';
  /** Pre-computed 256-sample waveform array for animation. */
  samples: number[];
  /** Whether this edge CP is visible (unsolved: input-side only; solved: both). */
  visible: boolean;
}

/** Pagination state for the puzzle section. */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

/** Complete motherboard layout alongside the gameboard. */
export interface MotherboardLayout {
  sections: MotherboardSection[];
  edgeCPs: MotherboardEdgeCP[];
  pagination: PaginationState;
}
