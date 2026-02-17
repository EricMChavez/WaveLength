import { describe, it, expect, beforeEach } from 'vitest';
import {
  hitTestRecordButton,
  getHoveredRecordButton,
  setHoveredRecordButton,
  isRecordButtonDisabled,
  setRecordButtonDisabled,
  drawRecordButton,
} from './render-record-button.ts';
import { RECORD_BUTTON } from '../../shared/constants/index.ts';

const CELL_SIZE = 20;

const BTN_LEFT = RECORD_BUTTON.COL_START * CELL_SIZE;
const BTN_RIGHT = (RECORD_BUTTON.COL_END + 1) * CELL_SIZE;
const BTN_TOP = RECORD_BUTTON.ROW_START * CELL_SIZE;
const BTN_BOTTOM = (RECORD_BUTTON.ROW_END + 1) * CELL_SIZE;

describe('hitTestRecordButton', () => {
  it('returns true for coordinates inside the button', () => {
    const cx = (BTN_LEFT + BTN_RIGHT) / 2;
    const cy = (BTN_TOP + BTN_BOTTOM) / 2;
    expect(hitTestRecordButton(cx, cy, CELL_SIZE)).toBe(true);
  });

  it('returns true for top-left corner', () => {
    expect(hitTestRecordButton(BTN_LEFT, BTN_TOP, CELL_SIZE)).toBe(true);
  });

  it('returns true for bottom-right corner', () => {
    expect(hitTestRecordButton(BTN_RIGHT, BTN_BOTTOM, CELL_SIZE)).toBe(true);
  });

  it('returns false for coordinates above the button', () => {
    expect(hitTestRecordButton(BTN_LEFT + 10, BTN_TOP - 1, CELL_SIZE)).toBe(false);
  });

  it('returns false for coordinates below the button', () => {
    expect(hitTestRecordButton(BTN_LEFT + 10, BTN_BOTTOM + 1, CELL_SIZE)).toBe(false);
  });

  it('returns false for coordinates left of the button', () => {
    expect(hitTestRecordButton(BTN_LEFT - 1, BTN_TOP + 10, CELL_SIZE)).toBe(false);
  });

  it('returns false for coordinates right of the button', () => {
    expect(hitTestRecordButton(BTN_RIGHT + 1, BTN_TOP + 10, CELL_SIZE)).toBe(false);
  });
});

describe('hover state', () => {
  beforeEach(() => {
    setHoveredRecordButton(false);
  });

  it('defaults to false', () => {
    expect(getHoveredRecordButton()).toBe(false);
  });

  it('can be set to true', () => {
    setHoveredRecordButton(true);
    expect(getHoveredRecordButton()).toBe(true);
  });

  it('can be cleared', () => {
    setHoveredRecordButton(true);
    setHoveredRecordButton(false);
    expect(getHoveredRecordButton()).toBe(false);
  });
});

describe('disabled state', () => {
  beforeEach(() => {
    setRecordButtonDisabled(false);
  });

  it('defaults to false', () => {
    expect(isRecordButtonDisabled()).toBe(false);
  });

  it('can be set to true', () => {
    setRecordButtonDisabled(true);
    expect(isRecordButtonDisabled()).toBe(true);
  });

  it('can be cleared', () => {
    setRecordButtonDisabled(true);
    setRecordButtonDisabled(false);
    expect(isRecordButtonDisabled()).toBe(false);
  });
});

describe('drawRecordButton', () => {
  function createMockCtx() {
    const calls: string[] = [];
    return {
      calls,
      ctx: {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        beginPath: () => calls.push('beginPath'),
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => calls.push('fill'),
        stroke: () => calls.push('stroke'),
        roundRect: () => {},
        arc: () => {},
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 1,
        lineCap: '',
        lineJoin: '',
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D,
    };
  }

  const tokens = { meterBorder: '#666', textPrimary: '#fff', signalPositive: '#F5AF28' } as any;

  it('draws without throwing', () => {
    const { ctx, calls } = createMockCtx();
    expect(() => {
      drawRecordButton(ctx, tokens, { hovered: false, disabled: false }, 20);
    }).not.toThrow();
    expect(calls).toContain('save');
    expect(calls).toContain('stroke');
    expect(calls).toContain('fill');
    expect(calls).toContain('restore');
  });

  it('draws with hover state without throwing', () => {
    const { ctx } = createMockCtx();
    expect(() => {
      drawRecordButton(ctx, tokens, { hovered: true, disabled: false }, 20);
    }).not.toThrow();
  });

  it('draws with disabled state without throwing', () => {
    const { ctx } = createMockCtx();
    expect(() => {
      drawRecordButton(ctx, tokens, { hovered: false, disabled: true }, 20);
    }).not.toThrow();
  });
});
