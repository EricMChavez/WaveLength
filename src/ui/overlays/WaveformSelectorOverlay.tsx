import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/index.ts';
import type { WaveformShape } from '../../puzzle/types.ts';
import { slotToMeterInfo } from '../../store/slices/creative-slice.ts';
import { creativeSlotId } from '../../puzzle/connection-point-nodes.ts';
import { meterKey } from '../../gameboard/meters/meter-types.ts';
import styles from './WaveformSelectorOverlay.module.css';

/** Available waveform shapes with display labels, grouped by base shape */
const WAVEFORM_OPTIONS: Array<{ shape: WaveformShape; label: string }> = [
  { shape: 'sine-full', label: 'Sine Full' },
  { shape: 'sine-full-reduced', label: 'Sine Full Reduced' },
  { shape: 'sine-half', label: 'Sine Half' },
  { shape: 'sine-half-reduced', label: 'Sine Half Reduced' },
  { shape: 'sine-quarter', label: 'Sine Quarter' },
  { shape: 'sine-quarter-reduced', label: 'Sine Quarter Reduced' },
  { shape: 'triangle-full', label: 'Triangle Full' },
  { shape: 'triangle-full-reduced', label: 'Triangle Full Reduced' },
  { shape: 'triangle-half', label: 'Triangle Half' },
  { shape: 'triangle-half-reduced', label: 'Triangle Half Reduced' },
  { shape: 'triangle-quarter', label: 'Triangle Quarter' },
  { shape: 'triangle-quarter-reduced', label: 'Triangle Quarter Reduced' },
  { shape: 'square-full', label: 'Square Full' },
  { shape: 'square-full-reduced', label: 'Square Full Reduced' },
  { shape: 'square-half', label: 'Square Half' },
  { shape: 'square-half-reduced', label: 'Square Half Reduced' },
  { shape: 'square-quarter', label: 'Square Quarter' },
  { shape: 'square-quarter-reduced', label: 'Square Quarter Reduced' },
  { shape: 'sawtooth-full', label: 'Sawtooth Full' },
  { shape: 'sawtooth-full-reduced', label: 'Sawtooth Full Reduced' },
  { shape: 'sawtooth-half', label: 'Sawtooth Half' },
  { shape: 'sawtooth-half-reduced', label: 'Sawtooth Half Reduced' },
  { shape: 'sawtooth-quarter', label: 'Sawtooth Quarter' },
  { shape: 'sawtooth-quarter-reduced', label: 'Sawtooth Quarter Reduced' },
];

/** Mini SVG preview of a waveform shape */
function WaveformIcon({ shape }: { shape: WaveformShape | 'output' | 'off' }) {
  const width = 28;
  const height = 16;
  const mid = height / 2;
  const amp = 6;

  if (shape === 'off') {
    // Draw an X for hidden/off
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={`M${width / 2 - 5},${mid - 5} L${width / 2 + 5},${mid + 5} M${width / 2 + 5},${mid - 5} L${width / 2 - 5},${mid + 5}`}
          fill="none"
          stroke="#666680"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (shape === 'output') {
    // Draw an arrow pointing right for output
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={`M4,${mid} H${width - 8} L${width - 12},${mid - 4} M${width - 8},${mid} L${width - 12},${mid + 4}`}
          fill="none"
          stroke="#9090b0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Determine base shape and cycle count for the icon
  // Full: half cycle visible (slow), Half: 1 cycle, Quarter: 2 cycles (fast)
  // Handle reduced variants - strip suffix for base shape and period detection
  const isReduced = shape.endsWith('-reduced');
  const shapeWithoutReduced = isReduced ? shape.replace(/-reduced$/, '') : shape;
  const cycles = shapeWithoutReduced.endsWith('-full') ? 0.5 : shapeWithoutReduced.endsWith('-half') ? 1 : 2;
  const base = shapeWithoutReduced.replace(/-(?:full|half|quarter)$/, '');
  const usable = width - 4; // 2px margin each side
  const x0 = 2;
  // Reduced waveforms show at 50% amplitude
  const ampScale = isReduced ? 0.5 : 1;
  const scaledAmp = amp * ampScale;

  let path = '';
  if (base === 'sine') {
    // Generate sine curve with cubic bezier approximation per half-cycle
    const parts: string[] = [`M${x0},${mid}`];
    const segW = usable / (cycles * 2); // width per half-cycle
    for (let i = 0; i < cycles * 2; i++) {
      const sx = x0 + i * segW;
      const ex = sx + segW;
      const dir = i % 2 === 0 ? -1 : 1; // up first, then down
      const cp = mid + dir * scaledAmp * 1.5;
      parts.push(`Q${(sx + ex) / 2},${cp} ${ex},${mid}`);
    }
    path = parts.join(' ');
  } else if (base === 'square') {
    const segW = usable / cycles;
    const parts: string[] = [`M${x0},${mid - scaledAmp}`];
    for (let i = 0; i < cycles; i++) {
      const sx = x0 + i * segW;
      parts.push(`H${sx + segW / 2} V${mid + scaledAmp} H${sx + segW} V${mid - scaledAmp}`);
    }
    path = parts.join(' ');
  } else if (base === 'triangle') {
    const segW = usable / cycles;
    const parts: string[] = [`M${x0},${mid + scaledAmp}`];
    for (let i = 0; i < cycles; i++) {
      const sx = x0 + i * segW;
      parts.push(`L${sx + segW / 2},${mid - scaledAmp} L${sx + segW},${mid + scaledAmp}`);
    }
    path = parts.join(' ');
  } else if (base === 'sawtooth') {
    const segW = usable / cycles;
    const parts: string[] = [`M${x0},${mid + scaledAmp}`];
    for (let i = 0; i < cycles; i++) {
      const sx = x0 + i * segW;
      parts.push(`L${sx + segW},${mid - scaledAmp}`);
      if (i < cycles - 1) parts.push(`L${sx + segW},${mid + scaledAmp}`);
    }
    path = parts.join(' ');
  } else {
    path = `M${x0},${mid} H${width - 2}`;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d={path}
        fill="none"
        stroke="#F5AF28"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WaveformSelectorOverlay() {
  const overlay = useGameStore((s) => s.activeOverlay);
  if (overlay.type !== 'waveform-selector') return null;
  return <WaveformSelectorInner slotIndex={overlay.slotIndex} />;
}

function WaveformSelectorInner({ slotIndex }: { slotIndex: number }) {
  const closeOverlay = useGameStore((s) => s.closeOverlay);
  const creativeSlots = useGameStore((s) => s.creativeSlots);
  const setCreativeSlotDirection = useGameStore((s) => s.setCreativeSlotDirection);
  const setCreativeSlotWaveformShape = useGameStore((s) => s.setCreativeSlotWaveformShape);
  const activeBoard = useGameStore((s) => s.activeBoard);
  const updateWires = useGameStore((s) => s.updateWires);
  const updateCreativeSlotNode = useGameStore((s) => s.updateCreativeSlotNode);
  const addCreativeSlotNode = useGameStore((s) => s.addCreativeSlotNode);
  const setMeterVisualState = useGameStore((s) => s.setMeterVisualState);
  const isCreativeMode = useGameStore((s) => s.isCreativeMode);

  // In puzzle mode, close immediately - waveform changes not allowed
  useEffect(() => {
    if (!isCreativeMode) {
      closeOverlay();
    }
  }, [isCreativeMode, closeOverlay]);

  const slot = creativeSlots[slotIndex];
  const currentDirection = slot?.direction ?? 'output';
  const currentShape = slot?.waveform?.shape ?? 'sine-quarter';
  const { side, index } = slotToMeterInfo(slotIndex);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelectOff = useCallback(() => {
    if (currentDirection === 'off') {
      closeOverlay();
      return;
    }

    // Delete connected wires first
    if (activeBoard) {
      const nodeId = creativeSlotId(slotIndex);
      const filteredWires = activeBoard.wires.filter(
        (w) => w.source.nodeId !== nodeId && w.target.nodeId !== nodeId
      );
      if (filteredWires.length !== activeBoard.wires.length) {
        updateWires(filteredWires);
      }
    }

    // Change direction to off (removes node)
    const changed = setCreativeSlotDirection(slotIndex, 'off');
    if (changed) {
      updateCreativeSlotNode(slotIndex, 'off');
      // Hide the meter
      setMeterVisualState(meterKey(side, index), 'hidden');
    }
    closeOverlay();
  }, [slotIndex, currentDirection, activeBoard, updateWires, setCreativeSlotDirection, updateCreativeSlotNode, setMeterVisualState, side, index, closeOverlay]);

  const handleSelectOutput = useCallback(() => {
    if (currentDirection === 'output') {
      closeOverlay();
      return;
    }

    // Delete connected wires first (if coming from input)
    if (activeBoard && currentDirection !== 'off') {
      const nodeId = creativeSlotId(slotIndex);
      const filteredWires = activeBoard.wires.filter(
        (w) => w.source.nodeId !== nodeId && w.target.nodeId !== nodeId
      );
      if (filteredWires.length !== activeBoard.wires.length) {
        updateWires(filteredWires);
      }
    }

    // If coming from 'off', need to add the node back and show meter
    if (currentDirection === 'off') {
      addCreativeSlotNode(slotIndex, 'output');
      setMeterVisualState(meterKey(side, index), 'active');
    } else {
      updateCreativeSlotNode(slotIndex, 'output');
    }

    setCreativeSlotDirection(slotIndex, 'output');
    closeOverlay();
  }, [slotIndex, currentDirection, activeBoard, updateWires, setCreativeSlotDirection, updateCreativeSlotNode, addCreativeSlotNode, setMeterVisualState, side, index, closeOverlay]);

  const handleSelectWaveform = useCallback((shape: WaveformShape) => {
    // If coming from 'off', need to add the node back and show meter
    if (currentDirection === 'off') {
      addCreativeSlotNode(slotIndex, 'input');
      setCreativeSlotDirection(slotIndex, 'input');
      setMeterVisualState(meterKey(side, index), 'active');
    } else if (currentDirection === 'output') {
      // Delete connected wires when switching from output to input
      if (activeBoard) {
        const nodeId = creativeSlotId(slotIndex);
        const filteredWires = activeBoard.wires.filter(
          (w) => w.source.nodeId !== nodeId && w.target.nodeId !== nodeId
        );
        if (filteredWires.length !== activeBoard.wires.length) {
          updateWires(filteredWires);
        }
      }
      updateCreativeSlotNode(slotIndex, 'input');
      setCreativeSlotDirection(slotIndex, 'input');
    }

    setCreativeSlotWaveformShape(slotIndex, shape);
    closeOverlay();
  }, [slotIndex, currentDirection, activeBoard, updateWires, setCreativeSlotDirection, setCreativeSlotWaveformShape, updateCreativeSlotNode, addCreativeSlotNode, setMeterVisualState, side, index, closeOverlay]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
    }
  }, [closeOverlay]);

  // Focus the list on mount
  useEffect(() => {
    listRef.current?.focus();
  }, []);

  const slotLabel = `${side === 'left' ? 'Left' : 'Right'} ${index + 1}`;

  return (
    <div className={styles.backdrop} onClick={closeOverlay}>
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Waveform Selector"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Configure Connection Point</h3>
          <div className={styles.subtitle}>{slotLabel}</div>
        </div>
        <div className={styles.list} ref={listRef} tabIndex={-1}>
          {/* Off (hidden) option */}
          <button
            className={`${styles.item} ${styles.offItem} ${currentDirection === 'off' ? styles.active : ''}`}
            onClick={handleSelectOff}
          >
            <div className={styles.waveformIcon}>
              <WaveformIcon shape="off" />
            </div>
            <span className={styles.waveformLabel}>Off (hidden)</span>
          </button>

          <div className={styles.divider} />

          {/* Output option */}
          <button
            className={`${styles.item} ${currentDirection === 'output' ? styles.active : ''}`}
            onClick={handleSelectOutput}
          >
            <div className={styles.waveformIcon}>
              <WaveformIcon shape="output" />
            </div>
            <span className={styles.waveformLabel}>Output (receives signal)</span>
          </button>

          <div className={styles.divider} />

          {/* Input waveform options */}
          {WAVEFORM_OPTIONS.map((opt) => (
            <button
              key={opt.shape}
              className={`${styles.item} ${currentDirection === 'input' && currentShape === opt.shape ? styles.active : ''}`}
              onClick={() => handleSelectWaveform(opt.shape)}
            >
              <div className={styles.waveformIcon}>
                <WaveformIcon shape={opt.shape} />
              </div>
              <span className={styles.waveformLabel}>{opt.label} (emits signal)</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
