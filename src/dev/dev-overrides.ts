/**
 * Visual override parameters controllable via Leva dev tools.
 * These override the theme tokens at render time for experimentation.
 *
 * Only includes overrides that are actually consumed by render functions.
 */

export interface NodeStyleOverrides {
  shadowBlur: number;
  shadowOffsetY: number;
  borderRadius: number;
  gradientIntensity: number;
  hoverBrightness: number;
  borderWidth: number;
  portRadius: number;
  lightEdgeOpacity: number;
}

export interface WireStyleOverrides {
  baseWidth: number;
  baseOpacity: number;
  glowThreshold: number;
  glowMaxRadius: number;
  colorRampEnd: number;
}

export interface GridStyleOverrides {
  lineOpacity: number;
  showGridLabels: boolean;
  noiseOpacity: number;
  noiseTileSize: number;
}

export interface MeterStyleOverrides {
  needleGlow: number;
  shadowBlurRatio: number;
  shadowOffsetRatio: number;
  lightEdgeOpacity: number;
  knobShadowBlur: number;
  knobHighlightOpacity: number;
}

export interface HighlightStyleOverrides {
  /** Angle in degrees from vertical (tilted right) */
  angle: number;
  /** Width of the hard band as fraction of gradient span */
  hardBandWidth: number;
  /** Width of the soft wash as fraction of gradient span */
  softBandWidth: number;
  /** Per-surface hard band opacity */
  pageHard: number;
  gameboardHard: number;
  nodeHard: number;
  meterHard: number;
  /** Per-surface soft wash opacity */
  pageSoft: number;
  gameboardSoft: number;
  nodeSoft: number;
  meterSoft: number;
  /** Use canvas blend modes for more integrated lighting */
  useBlendModes: boolean;
  /** Warm tint hex color (parsed to RGB at usage site) */
  warmTint: string;
  /** Vertical fade ratio — fraction of height that fades to transparent at top/bottom (0 = no fade) */
  verticalFadeRatio: number;
}

export interface DepthStyleOverrides {
  gameboardInsetEnabled: boolean;
  darkBlur: number;
  darkOffset: number;
  darkColor: string;
  lightBlur: number;
  lightOffset: number;
  lightOpacity: number;
}

export interface ColorOverrides {
  // Page background (GameboardCanvas.tsx)
  pageBackground: string;
  // Gameboard background (render-grid.ts playable area fill)
  gameboardBackground: string;
  // Grid (render-grid.ts)
  gridLine: string;
  boardBorder: string;
  // Nodes (render-nodes.ts)
  surfaceNode: string;
  surfaceNodeBottom: string;
  // Signal polarity (render-wires.ts, render-level-bar.ts, render-waveform-channel.ts)
  signalPositive: string;
  signalNegative: string;
  signalZero: string;
  colorNeutral: string;
  // Meters (render-meter.ts, render-needle.ts, render-level-bar.ts, render-waveform-channel.ts)
  meterInterior: string;
  meterBorder: string;
  meterNeedle: string;
  meterZero: string;
}

export interface DevOverrides {
  enabled: boolean;
  nodeStyle: NodeStyleOverrides;
  wireStyle: WireStyleOverrides;
  gridStyle: GridStyleOverrides;
  meterStyle: MeterStyleOverrides;
  highlightStyle: HighlightStyleOverrides;
  depthStyle: DepthStyleOverrides;
  colors: ColorOverrides;
}

/** Default values matching current dark theme + hardcoded render defaults */
export const DEFAULT_DEV_OVERRIDES: DevOverrides = {
  enabled: false,
  nodeStyle: {
    shadowBlur: 0.29,
    shadowOffsetY: 0.12,
    borderRadius: 0,
    gradientIntensity: 1,
    hoverBrightness: 0.15,
    borderWidth: 0,
    portRadius: 0.25,
    lightEdgeOpacity: 0.3,
  },
  wireStyle: {
    baseWidth: 6,
    baseOpacity: 1,
    glowThreshold: 75,
    glowMaxRadius: 30,
    colorRampEnd: 100,
  },
  gridStyle: {
    lineOpacity: 0.3,
    showGridLabels: false,
    noiseOpacity: 0.045,
    noiseTileSize: 2,
  },
  meterStyle: {
    needleGlow: 0,
    shadowBlurRatio: 0.075,
    shadowOffsetRatio: 0.015,
    lightEdgeOpacity: 0.3,
    knobShadowBlur: 0.5,
    knobHighlightOpacity: 0.3,
  },
  highlightStyle: {
    angle: 50,
    hardBandWidth: 0.05,
    softBandWidth: 1.5,
    pageHard: 0.035,
    gameboardHard: 0.04,
    nodeHard: 0.06,
    meterHard: 0.05,
    pageSoft: 0.2,
    gameboardSoft: 0.025,
    nodeSoft: 0.0375,
    meterSoft: 0.03,
    useBlendModes: true,
    warmTint: '#fff8f0',
    verticalFadeRatio: 0.3,
  },
  depthStyle: {
    gameboardInsetEnabled: true,
    darkBlur: 12,
    darkOffset: 4,
    darkColor: 'rgba(0,0,0,0.5)',
    lightBlur: 8,
    lightOffset: 3,
    lightOpacity: 0.03,
  },
  colors: {
    pageBackground: '#0d0f14',
    gameboardBackground: '#06382f',
    gridLine: '#318373',
    boardBorder: '#ff00dc',
    surfaceNode: '#212121',
    surfaceNodeBottom: '#171717',
    signalPositive: '#f0a202',
    signalNegative: '#3c91e6',
    signalZero: '#9a9a9a',
    colorNeutral: '#242424',
    meterInterior: '#000000',
    meterBorder: '#5f5f5f',
    meterNeedle: '#c1c1c1',
    meterZero: '#1d1d1d',
  },
};

/** Global mutable state for dev overrides (accessed by render functions) */
let _devOverrides: DevOverrides = { ...DEFAULT_DEV_OVERRIDES };

export function getDevOverrides(): DevOverrides {
  return _devOverrides;
}

export function setDevOverrides(overrides: Partial<DevOverrides>): void {
  _devOverrides = { ..._devOverrides, ...overrides };
}

export function setNodeStyleOverrides(overrides: Partial<NodeStyleOverrides>): void {
  _devOverrides.nodeStyle = { ..._devOverrides.nodeStyle, ...overrides };
}

export function setWireStyleOverrides(overrides: Partial<WireStyleOverrides>): void {
  _devOverrides.wireStyle = { ..._devOverrides.wireStyle, ...overrides };
}

export function setGridStyleOverrides(overrides: Partial<GridStyleOverrides>): void {
  _devOverrides.gridStyle = { ..._devOverrides.gridStyle, ...overrides };
}

export function setMeterStyleOverrides(overrides: Partial<MeterStyleOverrides>): void {
  _devOverrides.meterStyle = { ..._devOverrides.meterStyle, ...overrides };
}

export function setHighlightStyleOverrides(overrides: Partial<HighlightStyleOverrides>): void {
  _devOverrides.highlightStyle = { ..._devOverrides.highlightStyle, ...overrides };
}

export function setDepthStyleOverrides(overrides: Partial<DepthStyleOverrides>): void {
  _devOverrides.depthStyle = { ..._devOverrides.depthStyle, ...overrides };
}

export function setColorOverrides(overrides: Partial<ColorOverrides>): void {
  _devOverrides.colors = { ..._devOverrides.colors, ...overrides };
}

export function resetDevOverrides(): void {
  _devOverrides = { ...DEFAULT_DEV_OVERRIDES };
}
