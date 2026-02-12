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
}

export interface MeterStyleOverrides {
  needleGlow: number;
}

export interface ColorOverrides {
  // Page background (GameboardCanvas.tsx)
  pageBackground: string;
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
  colors: ColorOverrides;
}

/** Default values matching current dark theme + hardcoded render defaults */
export const DEFAULT_DEV_OVERRIDES: DevOverrides = {
  enabled: false,
  nodeStyle: {
    shadowBlur: 0.29,
    shadowOffsetY: 0.12,
    borderRadius: 0.1,
    gradientIntensity: 1.0,
    hoverBrightness: 0.15,
    borderWidth: 0,
    portRadius: 0.25,
  },
  wireStyle: {
    baseWidth: 6,
    baseOpacity: 1,
    glowThreshold: 75,
    glowMaxRadius: 30,
    colorRampEnd: 100,
  },
  gridStyle: {
    lineOpacity: 0.8,
    showGridLabels: false,
  },
  meterStyle: {
    needleGlow: 10,
  },
  colors: {
    // Page background (flat color in GameboardCanvas.tsx)
    pageBackground: '#121216',
    // Grid
    gridLine: '#16161a',
    boardBorder: '#3d3e42',
    // Nodes
    surfaceNode: '#44484e',
    surfaceNodeBottom: '#2a2a2a',
    // Signal polarity
    signalPositive: '#ff9200',
    signalNegative: '#0782e0',
    signalZero: '#d0d0d8',
    colorNeutral: '#242424',
    // Meters
    meterInterior: '#000000',
    meterBorder: '#6c6666',
    meterNeedle: '#f5f5f5',
    meterZero: '#d0d0d8',
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

export function setColorOverrides(overrides: Partial<ColorOverrides>): void {
  _devOverrides.colors = { ..._devOverrides.colors, ...overrides };
}

export function resetDevOverrides(): void {
  _devOverrides = { ...DEFAULT_DEV_OVERRIDES };
}
