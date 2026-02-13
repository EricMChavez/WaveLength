import { describe, it, expect } from 'vitest';
import { drawMeter } from './render-meter.ts';
import type { RenderMeterState } from './render-meter.ts';
import type { MeterSlotState } from './meter-types.ts';
import type { ThemeTokens } from '../../shared/tokens/token-types.ts';
import type { PixelRect } from '../../shared/grid/types.ts';

// Minimal mock tokens
const mockTokens: ThemeTokens = {
  pageBackground: '#000',
  gameboardSurface: '#111',
  gridArea: '#222',
  meterHousing: '#333',
  meterInterior: '#444',
  surfaceNode: '#555',
  surfaceNodeBottom: '#556',
  signalPositive: '#0f0',
  signalNegative: '#f00',
  signalZero: '#ddd',
  colorNeutral: '#888',
  colorTarget: '#0ff',
  colorValidationMatch: '#0a0',
  colorError: '#f00',
  meterNeedle: '#fff',
  meterBorder: '#666',
  boardBorder: '#555',
  depthRaised: '#aaa',
  depthSunken: '#222',
  textPrimary: '#fff',
  textSecondary: '#ccc',
  colorSelection: '#00f',
  wireWidthBase: '2',
  portFill: '#36b',
  portStroke: '#59f',
  portConnected: '#5c8',
  gridLine: '#16161a',
  animZoomDuration: '500ms',
  animNodeScaleDuration: '300ms',
  animWireDrawDuration: '200ms',
  animEasingDefault: 'ease',
  animEasingBounce: 'ease-out',
  animCeremonyBurstDuration: '500ms',
  animCeremonyRevealDuration: '300ms',
};

const testRect: PixelRect = { x: 0, y: 0, width: 96, height: 192 };

function createMockCtx() {
  const calls: string[] = [];
  const gradientStub = { addColorStop: () => {} };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === '_calls') return calls;
      if (prop === 'createLinearGradient') {
        return (...args: unknown[]) => {
          calls.push(`createLinearGradient(${args.map((a) => JSON.stringify(a)).join(',')})`);
          return gradientStub;
        };
      }
      if (typeof prop === 'string') {
        return (...args: unknown[]) => {
          calls.push(`${prop}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        };
      }
    },
    set(_target, prop, value) {
      calls.push(`set:${String(prop)}=${JSON.stringify(value)}`);
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D & { _calls: string[] };
}

describe('drawMeter', () => {
  it('hidden state makes no canvas calls', () => {
    const ctx = createMockCtx();
    const slot: MeterSlotState = { side: 'left', index: 0, visualState: 'hidden', direction: 'input' };
    const state: RenderMeterState = { slot, signalValues: null, targetValues: null, playpoint: 0, isConnected: false };
    drawMeter(ctx, mockTokens, state, testRect);
    expect(ctx._calls).toHaveLength(0);
  });

  it('dimmed state draws interior and overlay only (no channels)', () => {
    const ctx = createMockCtx();
    const slot: MeterSlotState = { side: 'left', index: 0, visualState: 'dimmed', direction: 'input' };
    const state: RenderMeterState = { slot, signalValues: null, targetValues: null, playpoint: 0, isConnected: false };
    drawMeter(ctx, mockTokens, state, testRect);

    // Housing + interior use roundRect+fill; two-layer streak + dimmed overlay use fillRect
    const fillRectCalls = ctx._calls.filter((c) => c.startsWith('fillRect'));
    expect(fillRectCalls.length).toBe(3); // soft wash + hard band + dimmed overlay
    const roundRectCalls = ctx._calls.filter((c) => c.startsWith('roundRect'));
    expect(roundRectCalls.length).toBe(4); // shadow + housing + interior + highlight streak clip
    const beginPathCalls = ctx._calls.filter((c) => c.startsWith('beginPath'));
    expect(beginPathCalls.length).toBeGreaterThanOrEqual(3); // housing + interior cutout clip + interior fill
  });

  it('active state draws interior, centerline, and channels', () => {
    const ctx = createMockCtx();
    const slot: MeterSlotState = { side: 'right', index: 0, visualState: 'active', direction: 'output' };
    const state: RenderMeterState = { slot, signalValues: [50, -30], targetValues: null, playpoint: 0, isConnected: true };
    drawMeter(ctx, mockTokens, state, testRect);

    // Housing + interior + level bar use roundRect+fill; streak uses fillRect
    const fillRectCalls = ctx._calls.filter((c) => c.startsWith('fillRect'));
    expect(fillRectCalls.length).toBeGreaterThanOrEqual(1); // streak fills
    const roundRectCalls = ctx._calls.filter((c) => c.startsWith('roundRect'));
    expect(roundRectCalls.length).toBeGreaterThanOrEqual(3); // housing + interior + level bar
    const beginPathCalls = ctx._calls.filter((c) => c.startsWith('beginPath'));
    expect(beginPathCalls.length).toBeGreaterThanOrEqual(3); // housing + interior cutout + interior fill + channels
  });

  it('does not import useGameStore or COLORS', async () => {
    // Contract test: read the source files
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const meterDir = resolve(import.meta.dirname ?? '.');
    const renderFiles = [
      'render-meter.ts',
      'render-waveform-channel.ts',
      'render-level-bar.ts',
      'render-needle.ts',
      'render-target-overlay.ts',
    ];
    for (const file of renderFiles) {
      const content = readFileSync(resolve(meterDir, file), 'utf-8');
      expect(content).not.toMatch(/useGameStore/);
      expect(content).not.toMatch(/\bCOLORS\b/);
    }
  });

  it('all meter render files accept ThemeTokens', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const meterDir = resolve(import.meta.dirname ?? '.');
    const renderFiles = [
      'render-meter.ts',
      'render-waveform-channel.ts',
      'render-level-bar.ts',
      'render-needle.ts',
      'render-target-overlay.ts',
    ];
    for (const file of renderFiles) {
      const content = readFileSync(resolve(meterDir, file), 'utf-8');
      expect(content).toMatch(/ThemeTokens/);
    }
  });
});
