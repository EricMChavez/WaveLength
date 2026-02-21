import type { GridPoint } from '../grid/types';

/** Unique identifier for a chip instance */
export type ChipId = string;

/** Valid rotation angles for chips (degrees clockwise) */
export type ChipRotation = 0 | 90 | 180 | 270;

/** Unique identifier for a gameboard */
export type GameboardId = string;

/** 2D pixel position vector (used at render time only) */
export interface Vec2 {
  x: number;
  y: number;
}

/** Reference to a specific port on a chip */
export interface PortRef {
  chipId: ChipId;
  portIndex: number;
  side: 'socket' | 'plug';
}

/** A path connecting two ports */
export interface Path {
  id: string;
  source: PortRef;
  target: PortRef;
  /** Auto-routed path through the grid */
  route: GridPoint[];
}

/** The type of a fundamental chip */
export type FundamentalChipType =
  | 'offset'
  | 'scale'
  | 'threshold'
  | 'add'
  | 'max'
  | 'min'
  | 'memory'
  | 'duplicate'
  | 'divide'
  | 'negate'
  | 'amp'
  | 'average';

/** State of a single chip on a gameboard */
export interface ChipState {
  id: ChipId;
  type: string;
  position: GridPoint;
  params: Record<string, number | string | boolean | string[]>;
  /** Number of socket (input) ports */
  socketCount: number;
  /** Number of plug (output) ports */
  plugCount: number;
  /** Version hash from the library entry at placement time */
  libraryVersionHash?: string;
  /** Chip rotation (0, 90, 180, or 270 degrees). Default 0. */
  rotation?: ChipRotation;
  /** If true, chip cannot be deleted (used for starting chips in custom puzzles) */
  locked?: boolean;
}

/** Complete state of a gameboard */
export interface GameboardState {
  id: GameboardId;
  chips: Map<ChipId, ChipState>;
  paths: Path[];
}

/** Captured parent-board signals for "live X-ray" utility editing. */
export interface ParentSignalContext {
  /** Per slot (0-5): 256-cycle signal array if externally connected, null otherwise */
  slotSignals: (readonly number[] | null)[];
  /** Slot indices (0-5) that have external path connections (for locking toggles) */
  connectedSlots: ReadonlySet<number>;
}

/** Creates a new path */
export function createPath(
  id: string,
  source: PortRef,
  target: PortRef,
): Path {
  return {
    id,
    source,
    target,
    route: [],
  };
}
