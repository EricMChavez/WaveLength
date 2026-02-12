/** Gameboard layout styling */
export const GAMEBOARD_STYLE = {
  /** Corner radius ratio (multiplied by cellSize at render time) */
  CORNER_RADIUS_RATIO: 0,
} as const;

/** Ratio-based node styling (multiplied by cellSize at render time) */
export const NODE_STYLE = {
  BORDER_RADIUS_RATIO: 0.1,
  PORT_RADIUS_RATIO: 0.25,
  LABEL_FONT_RATIO: 0.40,
  PARAM_FONT_RATIO: 0.22,
  LABEL_FONT_FAMILY: "'Inter', 'Segoe UI', system-ui, sans-serif",
  PARAM_FONT_FAMILY: "'Consolas', 'JetBrains Mono', monospace",
  SHADOW_BLUR_RATIO: 0.29,
  SHADOW_OFFSET_Y_RATIO: 0.12,
  FOCUS_RING_WIDTH: 2,
  SELECTION_PAD: 3,
  /** Half-cell offset so ports sit on grid lines while body is offset */
  BODY_OFFSET: 0.5,
} as const;

/** Connection point rendering (gameboard I/O) */
export const CONNECTION_POINT_CONFIG = {
  /** Number of input connection points (left side) */
  INPUT_COUNT: 3,
  /** Number of output connection points (right side) */
  OUTPUT_COUNT: 3,
  /** Radius of connection point circles */
  RADIUS: 8,
} as const;

/** Signal processing constants */
export const SIGNAL_CONFIG = {
  MIN_VALUE: -100,
  MAX_VALUE: 100,
  MATCH_TOLERANCE: 0,
} as const;

/** Validation constants */
export const VALIDATION_CONFIG = {
  MATCH_TOLERANCE: 2,
} as const;

/** Color palette for rendering */
export const COLORS = {
  BACKGROUND: '#1a1a2e',
  NODE_FILL: '#44484e',
  NODE_STROKE: '#4a4a6a',
  NODE_LABEL: '#e0e0f0',
  NODE_PARAM: '#9090b0',
  PORT_FILL: '#3a7bd5',
  PORT_STROKE: '#5a9bf5',
  PORT_CONNECTED: '#50c878',
  WIRE: '#5a9bf5',
  WIRE_SIGNAL: '#50c878',
  CONNECTION_POINT_FILL: '#ff9200',
  CONNECTION_POINT_STROKE: '#f0c868',
  CONNECTION_POINT_LABEL: '#ff9200',
  GRID_LINE: '#16161a',
  TARGET_WAVEFORM: '#c8c8d8',
} as const;

/** Highlight streak (diagonal light band) configuration */
export const HIGHLIGHT_STREAK = {
  /** Angle in degrees from vertical (tilted right) */
  ANGLE_DEG: 10,
  /** Opacity of the white band (0-1) */
  OPACITY: 0.04,
  /** Width of the streak band as a fraction of the gradient span */
  BAND_WIDTH_RATIO: 0.08,
  /** Position of streak center along the gradient span (0 = start, 1 = end) */
  CENTER_POSITION: 0.35,
} as const;

/** Tutorial text rendering configuration */
export const TUTORIAL_TEXT = {
  /** Font size as a ratio of cellSize */
  FONT_SIZE_RATIO: 0.55,
  /** Opacity of the tutorial text (subtle, engraved look) */
  OPACITY: 0.08,
  /** Vertical center as fraction of total gameboard height */
  VERTICAL_CENTER: 0.5,
  /** Maximum width as fraction of playable area width */
  MAX_WIDTH_RATIO: 0.7,
  /** Line height multiplier */
  LINE_HEIGHT: 1.4,
} as const;

/** Display labels for node types (derived from registry for v2 nodes) */
export const NODE_TYPE_LABELS: Record<string, string> = {
  add: 'Add',
  scale: 'Scale',
  threshold: 'Threshold',
  max: 'Max',
  min: 'Min',
  split: 'Split',
  memory: 'Memory',
  // Custom blank (unsaved utility node)
  'custom-blank': 'Custom',
};
