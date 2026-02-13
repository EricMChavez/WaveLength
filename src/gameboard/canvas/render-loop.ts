import { useGameStore } from '../../store/index.ts';
import { getThemeTokens, isReducedMotion } from '../../shared/tokens/theme-manager.ts';
import { getPerSampleMatch } from '../../simulation/cycle-runner.ts';
import { generateWaveformValue } from '../../puzzle/waveform-generators.ts';
import { GRID_COLS, GRID_ROWS, METER_LEFT_START, METER_RIGHT_START, gridRectToPixels, pixelToGrid } from '../../shared/grid/index.ts';
import { drawMeter } from '../meters/render-meter.ts';
import type { RenderMeterState } from '../meters/render-meter.ts';
import { METER_GRID_ROWS, METER_GRID_COLS, METERS_PER_SIDE, METER_GAP_ROWS, METER_VERTICAL_OFFSETS, meterKey } from '../meters/meter-types.ts';
import type { MeterKey } from '../meters/meter-types.ts';
import { drawNodes } from './render-nodes.ts';
import { drawWires } from './render-wires.ts';
import { computeWireAnimationCache } from './wire-animation.ts';
import type { WireAnimationCache } from './wire-animation.ts';
import { drawWireBlips } from './render-wire-blips.ts';
import { renderConnectionPoints } from './render-connection-points.ts';
import { renderWirePreview } from './render-wire-preview.ts';
import { drawGrid } from './render-grid.ts';
import { drawHighlightStreak } from './render-highlight-streak.ts';
import { HIGHLIGHT_STREAK } from '../../shared/constants/index.ts';
import { getDevOverrides } from '../../dev/index.ts';
import { renderPlacementGhost } from './render-placement-ghost.ts';
import { drawLidAnimation, computeProgress, parseDurationMs, drawVictoryBurst, drawNameReveal } from '../animation/index.ts';
import { drawKeyboardFocus } from './render-focus.ts';
import { getFocusTarget, isFocusVisible } from '../interaction/keyboard-focus.ts';
import { getRejectedKnobNodeId } from './rejected-knob.ts';
import { getPortGridAnchor, getPortWireDirection, findPath, DIR_E } from '../../shared/routing/index.ts';
import type { GridPoint } from '../../shared/grid/types.ts';
import type { KnobInfo } from './render-types.ts';
import type { NodeState, Wire } from '../../shared/types/index.ts';
import type { CycleResults } from '../../engine/evaluation/index.ts';
import { getKnobConfig } from '../../engine/nodes/framework.ts';
import { getNodeDefinition } from '../../engine/nodes/registry.ts';
import { isConnectionInputNode, isConnectionOutputNode, getConnectionPointIndex, isCreativeSlotNode, getCreativeSlotIndex, isBidirectionalCpNode, getBidirectionalCpIndex } from '../../puzzle/connection-point-nodes.ts';

const PLAYPOINT_RATE = 16; // cycles per second

/** Build a map of signal value per CP at current playpoint, from meter signal arrays. */
function computeCpSignals(
  meterSignalArrays: ReadonlyMap<string, number[]>,
  playpoint: number,
): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  for (const [key, samples] of meterSignalArrays) {
    result.set(key, samples[playpoint] ?? 0);
  }
  return result;
}

/** Build a map of signal value per node port at current playpoint, from cycle results. */
function computePortSignals(
  cycleResults: CycleResults | null,
  playpoint: number,
  wires: ReadonlyArray<Wire>,
): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  if (!cycleResults) return result;

  // For each wire, the source output port value = the wire's value at this cycle
  for (const wire of wires) {
    const wireVal = cycleResults.wireValues.get(wire.id)?.[playpoint] ?? 0;
    result.set(`${wire.source.nodeId}:output:${wire.source.portIndex}`, wireVal);
    result.set(`${wire.target.nodeId}:input:${wire.target.portIndex}`, wireVal);
  }

  return result;
}

/** Build a map of wire signal values at the current playpoint. */
function computeWireValues(
  cycleResults: CycleResults | null,
  playpoint: number,
  wires: ReadonlyArray<Wire>,
): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  if (!cycleResults) return result;

  for (const wire of wires) {
    result.set(wire.id, cycleResults.wireValues.get(wire.id)?.[playpoint] ?? 0);
  }

  return result;
}

// Module-scope cache for wire preview A* path (avoid recomputing every frame)
let lastPreviewGridCol = -1;
let lastPreviewGridRow = -1;
let cachedPreviewPath: GridPoint[] | null = null;

// Playpoint animation state
let lastPlaypointTimestamp = 0;
let playAccumulator = 0;

// Pause blip animation state
let pauseAnimAccumulator = 0;
let lastPauseTimestamp = 0;
const PAUSE_ANIM_CYCLE_MS = 1250;
let cachedWireAnim: WireAnimationCache | null = null;
let cachedWireAnimResults: CycleResults | null = null;
let cachedWireAnimPlaypoint = -1;

// --- Performance caches ---

// Cache: meter signal arrays (rebuild only when data changes)
let _meterSignalCache: ReadonlyMap<string, number[]> = new Map();
let _meterSignalCycleResults: CycleResults | null = null;
let _meterSignalPuzzleId: string | null = null;
let _meterSignalTestIndex = -1;
let _meterSignalCreativeSlots: unknown = null;
let _meterSignalIsCreative = false;

// Cache: meter target arrays (rebuild only when puzzle/test case changes)
let _meterTargetCache: ReadonlyMap<string, number[]> = new Map();
let _meterTargetPuzzleId: string | null = null;
let _meterTargetTestIndex = -1;

// Cache: CP signals map (rebuild only when meter arrays or playpoint change)
let _cpSignalsCache: ReadonlyMap<string, number> = new Map();
let _cpSignalsMeterArrays: ReadonlyMap<string, number[]> | null = null;
let _cpSignalsPlaypoint = -1;

// Cache: port signals map (rebuild only when cycleResults, playpoint, or wires change)
let _portSignalsCache: ReadonlyMap<string, number> = new Map();
let _portSignalsCycleResults: CycleResults | null = null;
let _portSignalsPlaypoint = -1;
let _portSignalsWires: ReadonlyArray<Wire> | null = null;

// Cache: wire values map (rebuild only when cycleResults, playpoint, or wires change)
let _wireValuesCache: ReadonlyMap<string, number> = new Map();
let _wireValuesCycleResults: CycleResults | null = null;
let _wireValuesPlaypoint = -1;
let _wireValuesWires: ReadonlyArray<Wire> | null = null;

// Cache: connected input ports set (rebuild only when wires change)
let _connectedInputPortsCache: ReadonlySet<string> = new Set();
let _connectedInputPortsWires: ReadonlyArray<Wire> | null = null;

// Cache: connected output CPs set (rebuild only when wires change)
let _connectedOutputCPsCache: ReadonlySet<string> = new Set();
let _connectedOutputCPsWires: ReadonlyArray<Wire> | null = null;

// Cache: connected input CPs set (rebuild only when wires change)
let _connectedInputCPsCache: ReadonlySet<string> = new Set();
let _connectedInputCPsWires: ReadonlyArray<Wire> | null = null;

// Cache: knob wire lookup map (rebuild only when wires change)
let _knobWireLookup: Map<string, Wire> = new Map();
let _knobWireLookupWires: ReadonlyArray<Wire> | null = null;

// Cache: knob values map (rebuild only when inputs change)
let _knobValuesCache: ReadonlyMap<string, KnobInfo> = new Map();
let _knobValuesNodes: ReadonlyMap<string, NodeState> | null = null;
let _knobValuesWires: ReadonlyArray<Wire> | null = null;
let _knobValuesCycleResults: CycleResults | null = null;
let _knobValuesPlaypoint = -1;

/**
 * Start the requestAnimationFrame render loop.
 * Reads Zustand via getState() each frame — NOT React hooks.
 * Returns a cleanup function to stop the loop.
 *
 * @param canvas - The canvas element to render to.
 * @param getCellSize - Callback that returns the current grid cell size in CSS pixels.
 *   Viewport-derived; updated on resize via the GameboardCanvas component.
 */
export function startRenderLoop(
  canvas: HTMLCanvasElement,
  getCellSize: () => number,
  getOffset: () => { x: number; y: number },
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let animationId = 0;
  let running = true;
  function render(timestamp: number) {
    if (!running) return;

    // Single getState() + getThemeTokens() per frame
    const state = useGameStore.getState();
    const tokens = getThemeTokens();

    // Advance playpoint when playing
    if (state.playMode === 'playing' && lastPlaypointTimestamp > 0) {
      const elapsed = timestamp - lastPlaypointTimestamp;
      playAccumulator += elapsed;
      const cyclesPerMs = PLAYPOINT_RATE / 1000;
      const cyclesToAdvance = Math.floor(playAccumulator * cyclesPerMs);
      if (cyclesToAdvance > 0) {
        playAccumulator -= cyclesToAdvance / cyclesPerMs;
        state.stepPlaypoint(cyclesToAdvance);
      }
    }
    lastPlaypointTimestamp = timestamp;

    // Advance pause blip animation when paused
    let pauseProgress = 0;
    if (state.playMode === 'paused') {
      // Reset animation cycle when playpoint changes (arrow key stepping)
      if (state.playpoint !== cachedWireAnimPlaypoint && cachedWireAnimPlaypoint >= 0) {
        pauseAnimAccumulator = 0;
        lastPauseTimestamp = 0;
      }
      if (lastPauseTimestamp > 0) {
        pauseAnimAccumulator += timestamp - lastPauseTimestamp;
      }
      pauseProgress = (pauseAnimAccumulator % PAUSE_ANIM_CYCLE_MS) / PAUSE_ANIM_CYCLE_MS;
      lastPauseTimestamp = timestamp;
    } else {
      pauseAnimAccumulator = 0;
      lastPauseTimestamp = 0;
      cachedWireAnim = null;
    }

    // Derive logical dimensions from grid cell size
    const cellSize = getCellSize();
    const offset = getOffset();
    const logicalWidth = GRID_COLS * cellSize;
    const logicalHeight = GRID_ROWS * cellSize;

    // Viewport dimensions (canvas is viewport-sized)
    const dpr = window.devicePixelRatio || 1;
    const vpWidth = canvas.width / dpr;
    const vpHeight = canvas.height / dpr;

    // Clear full viewport canvas
    ctx!.clearRect(0, 0, vpWidth, vpHeight);

    // During legacy zoom transition, keep canvas cleared and skip drawing
    // so the snapshot overlay is the only thing visible.
    if (state.zoomTransition) {
      animationId = requestAnimationFrame(render);
      return;
    }

    // --- Lid animation: advance progress and check completion ---
    const lidAnim = state.lidAnimation;
    const lidActive = lidAnim.type === 'opening' || lidAnim.type === 'closing';
    let lidProgress = 0;

    if (lidActive) {
      const durationMs = parseDurationMs(tokens.animZoomDuration);
      lidProgress = computeProgress(lidAnim.startTime, timestamp, durationMs);

      if (lidProgress >= 1) {
        state.endLidAnimation();
        // Animation complete — render the live board below without overlay
        animationId = requestAnimationFrame(render);
        return;
      }
    }

    // --- Ceremony animation: read state ---
    const ceremony = state.ceremonyAnimation;

    // === Viewport-level rendering (before grid translate) ===
    const devOverrides = getDevOverrides();
    const bgColor = devOverrides.enabled ? devOverrides.colors.pageBackground : '#0d0f14';

    // Fill page background across entire viewport
    ctx!.fillStyle = bgColor;
    ctx!.fillRect(0, 0, vpWidth, vpHeight);

    // Page background highlight streak (covers entire viewport, behind everything)
    const pageHard = devOverrides.enabled ? devOverrides.highlightStyle.pageHard : 0.035;
    const pageSoft = devOverrides.enabled ? devOverrides.highlightStyle.pageSoft : 0.2;
    const pageFade = devOverrides.enabled ? devOverrides.highlightStyle.verticalFadeRatio : HIGHLIGHT_STREAK.VERTICAL_FADE_RATIO;
    drawHighlightStreak(ctx!, { x: 0, y: 0, width: vpWidth, height: vpHeight }, pageHard, pageSoft, pageFade);

    // === Grid-level rendering (translated to grid origin) ===
    ctx!.translate(offset.x, offset.y);

    // Grid zones and lines (lowest z-order)
    // Show authoring draft during configuring-start/saving, otherwise show puzzle's message
    const isAuthoring = state.authoringPhase !== 'idle';
    const tutorialTitle = (isAuthoring && state.tutorialTitleDraft)
      ? state.tutorialTitleDraft
      : state.activePuzzle?.tutorialTitle;
    const tutorialMessage = (isAuthoring && state.tutorialMessageDraft)
      ? state.tutorialMessageDraft
      : state.activePuzzle?.tutorialMessage;
    drawGrid(ctx!, tokens, { tutorialTitle, tutorialMessage }, cellSize);

    // Read cycle results and playpoint for rendering
    const cycleResults = state.cycleResults;
    const playpoint = state.playpoint;

    // Draw meters in side zones
    const perSampleMatch = getPerSampleMatch();
    // Build flat arrays for meter rendering from cycleResults + puzzle (cached)
    const puzzleId = state.activePuzzle?.id ?? null;
    const testIndex = state.activeTestCaseIndex;
    const isCreative = state.isCreativeMode;
    const creativeSlots = isCreative ? state.creativeSlots : null;

    if (
      cycleResults !== _meterSignalCycleResults ||
      puzzleId !== _meterSignalPuzzleId ||
      testIndex !== _meterSignalTestIndex ||
      isCreative !== _meterSignalIsCreative ||
      creativeSlots !== _meterSignalCreativeSlots
    ) {
      _meterSignalCache = buildMeterSignalArrays(cycleResults, state);
      _meterSignalCycleResults = cycleResults;
      _meterSignalPuzzleId = puzzleId;
      _meterSignalTestIndex = testIndex;
      _meterSignalIsCreative = isCreative;
      _meterSignalCreativeSlots = creativeSlots;
    }
    const meterSignalArrays = _meterSignalCache;

    if (puzzleId !== _meterTargetPuzzleId || testIndex !== _meterTargetTestIndex) {
      _meterTargetCache = buildMeterTargetArrays(state);
      _meterTargetPuzzleId = puzzleId;
      _meterTargetTestIndex = testIndex;
    }
    const meterTargetArrays = _meterTargetCache;

    // Read wires early so we can compute CP connection status for meters
    const boardWires = state.activeBoard?.wires ?? null;

    // Build connected output CP set (cached on wires reference)
    // Output CPs receive signal from the graph — wires target them
    if (boardWires !== _connectedOutputCPsWires) {
      const set = new Set<string>();
      if (boardWires) {
        for (const wire of boardWires) {
          const targetId = wire.target.nodeId;
          if (isConnectionOutputNode(targetId)) {
            set.add(`output:${getConnectionPointIndex(targetId)}`);
          } else if (isCreativeSlotNode(targetId)) {
            // Creative slot index is 0-5 (0-2=left, 3-5=right).
            // Meters use position index 0-2 per side, so convert slot→meter index.
            const slotIdx = getCreativeSlotIndex(targetId);
            const meterIdx = slotIdx < 3 ? slotIdx : slotIdx - 3;
            set.add(`output:${meterIdx}`);
          } else if (isBidirectionalCpNode(targetId)) {
            set.add(`output:${getBidirectionalCpIndex(targetId)}`);
          }
        }
      }
      _connectedOutputCPsCache = set;
      _connectedOutputCPsWires = boardWires;
    }
    const connectedOutputCPs = _connectedOutputCPsCache;

    // Build connected input CP set (cached on wires reference)
    // Input CPs emit signal into the graph — wires source from them
    if (boardWires !== _connectedInputCPsWires) {
      const set = new Set<string>();
      if (boardWires) {
        for (const wire of boardWires) {
          const sourceId = wire.source.nodeId;
          if (isConnectionInputNode(sourceId)) {
            set.add(`input:${getConnectionPointIndex(sourceId)}`);
          } else if (isCreativeSlotNode(sourceId)) {
            // Creative slot index is 0-5 (0-2=left, 3-5=right).
            // Meters use position index 0-2 per side, so convert slot→meter index.
            const slotIdx = getCreativeSlotIndex(sourceId);
            const meterIdx = slotIdx < 3 ? slotIdx : slotIdx - 3;
            set.add(`input:${meterIdx}`);
          } else if (isBidirectionalCpNode(sourceId)) {
            set.add(`input:${getBidirectionalCpIndex(sourceId)}`);
          }
        }
      }
      _connectedInputCPsCache = set;
      _connectedInputCPsWires = boardWires;
    }
    const connectedInputCPs = _connectedInputCPsCache;

    // Calculate meter starting offset (meters fill the full height)
    const meterTopMargin = 0; // in grid rows
    const meterStride = METER_GRID_ROWS + METER_GAP_ROWS; // rows per meter + gap

    for (let i = 0; i < METERS_PER_SIDE; i++) {
      // Left meters
      const leftKey: MeterKey = meterKey('left', i);
      const leftSlot = state.meterSlots.get(leftKey);
      if (leftSlot) {
        const meterRow = meterTopMargin + i * meterStride + METER_VERTICAL_OFFSETS[i];
        const leftRect = gridRectToPixels({
          col: METER_LEFT_START,
          row: meterRow,
          cols: METER_GRID_COLS,
          rows: METER_GRID_ROWS,
        }, cellSize);
        const cpIdx = leftSlot.cpIndex ?? i;
        const dir = leftSlot.direction;
        const isConnected = dir === 'input'
          ? connectedInputCPs.has(`input:${cpIdx}`)
          : connectedOutputCPs.has(`output:${cpIdx}`);
        const renderState: RenderMeterState = {
          slot: leftSlot,
          signalValues: meterSignalArrays.get(`${dir}:${cpIdx}`) ?? null,
          targetValues: dir === 'output' ? (meterTargetArrays.get(`target:${cpIdx}`) ?? null) : null,
          matchStatus: dir === 'output' ? (perSampleMatch.get(`output:${cpIdx}`) ?? null) : undefined,
          playpoint,
          isConnected,
        };
        drawMeter(ctx!, tokens, renderState, leftRect);
      }

      // Right meters
      const rightKey: MeterKey = meterKey('right', i);
      const rightSlot = state.meterSlots.get(rightKey);
      if (rightSlot) {
        const meterRowRight = meterTopMargin + i * meterStride + METER_VERTICAL_OFFSETS[i];
        const rightRect = gridRectToPixels({
          col: METER_RIGHT_START,
          row: meterRowRight,
          cols: METER_GRID_COLS,
          rows: METER_GRID_ROWS,
        }, cellSize);
        const cpIdxR = rightSlot.cpIndex ?? i;
        const dirR = rightSlot.direction;
        const isConnectedR = dirR === 'input'
          ? connectedInputCPs.has(`input:${cpIdxR}`)
          : connectedOutputCPs.has(`output:${cpIdxR}`);
        const renderState: RenderMeterState = {
          slot: rightSlot,
          signalValues: meterSignalArrays.get(`${dirR}:${cpIdxR}`) ?? null,
          targetValues: dirR === 'output' ? (meterTargetArrays.get(`target:${cpIdxR}`) ?? null) : null,
          matchStatus: dirR === 'output' ? (perSampleMatch.get(`output:${cpIdxR}`) ?? null) : undefined,
          playpoint,
          isConnected: isConnectedR,
        };
        drawMeter(ctx!, tokens, renderState, rightRect);
      }
    }

    // Compute signal values for port/CP coloring from meter signal arrays (cached)
    if (meterSignalArrays !== _cpSignalsMeterArrays || playpoint !== _cpSignalsPlaypoint) {
      _cpSignalsCache = computeCpSignals(meterSignalArrays, playpoint);
      _cpSignalsMeterArrays = meterSignalArrays;
      _cpSignalsPlaypoint = playpoint;
    }
    const cpSignals = _cpSignalsCache;

    if (
      cycleResults !== _portSignalsCycleResults ||
      playpoint !== _portSignalsPlaypoint ||
      boardWires !== _portSignalsWires
    ) {
      _portSignalsCache = boardWires
        ? computePortSignals(cycleResults, playpoint, boardWires)
        : new Map<string, number>();
      _portSignalsCycleResults = cycleResults;
      _portSignalsPlaypoint = playpoint;
      _portSignalsWires = boardWires;
    }
    const portSignals = _portSignalsCache;

    // Build connected input port set (cached on wires reference)
    if (boardWires !== _connectedInputPortsWires) {
      const set = new Set<string>();
      if (boardWires) {
        for (const wire of boardWires) {
          if (wire.target.side === 'input') {
            set.add(`${wire.target.nodeId}:${wire.target.portIndex}`);
          }
        }
      }
      _connectedInputPortsCache = set;
      _connectedInputPortsWires = boardWires;
    }
    const connectedInputPorts = _connectedInputPortsCache;

    if (state.activeBoard) {
      // Wire rendering: branch on pause state for blip animation
      const isPaused = state.playMode === 'paused';
      if (isPaused && cycleResults && cycleResults.processingOrder.length > 0 && !isReducedMotion()) {
        // Recompute animation cache if cycleResults or playpoint changed
        if (cachedWireAnimResults !== cycleResults || cachedWireAnimPlaypoint !== playpoint) {
          cachedWireAnim = computeWireAnimationCache(
            state.activeBoard.wires, state.activeBoard.nodes, cycleResults, playpoint,
          );
          cachedWireAnimResults = cycleResults;
          cachedWireAnimPlaypoint = playpoint;
        }
        drawWires(ctx!, tokens, state.activeBoard.wires, cellSize, state.activeBoard.nodes, undefined, true);
        if (cachedWireAnim) {
          drawWireBlips(ctx!, tokens, state.activeBoard.wires, state.activeBoard.nodes, cellSize, cachedWireAnim, pauseProgress);
        }
      } else {
        if (
          cycleResults !== _wireValuesCycleResults ||
          playpoint !== _wireValuesPlaypoint ||
          state.activeBoard.wires !== _wireValuesWires
        ) {
          _wireValuesCache = computeWireValues(cycleResults, playpoint, state.activeBoard.wires);
          _wireValuesCycleResults = cycleResults;
          _wireValuesPlaypoint = playpoint;
          _wireValuesWires = state.activeBoard.wires;
        }
        drawWires(ctx!, tokens, state.activeBoard.wires, cellSize, state.activeBoard.nodes, _wireValuesCache);
      }

      // Compute knob values from cycle results (cached)
      if (
        state.activeBoard.nodes !== _knobValuesNodes ||
        state.activeBoard.wires !== _knobValuesWires ||
        cycleResults !== _knobValuesCycleResults ||
        playpoint !== _knobValuesPlaypoint
      ) {
        _knobValuesCache = computeKnobValues(state.activeBoard.nodes, state.activeBoard.wires, cycleResults, playpoint);
        _knobValuesNodes = state.activeBoard.nodes;
        _knobValuesWires = state.activeBoard.wires;
        _knobValuesCycleResults = cycleResults;
        _knobValuesPlaypoint = playpoint;
      }
      const knobValues = _knobValuesCache;

      drawNodes(ctx!, tokens, {
        puzzleNodes: state.puzzleNodes,
        utilityNodes: state.utilityNodes,
        nodes: state.activeBoard.nodes,
        selectedNodeId: state.selectedNodeId,
        hoveredNodeId: state.hoveredNodeId,
        knobValues,
        portSignals,
        rejectedKnobNodeId: getRejectedKnobNodeId(),
        connectedInputPorts,
      }, cellSize);

      // Keyboard focus ring (after nodes, before wire preview)
      drawKeyboardFocus(
        ctx!, tokens, getFocusTarget(), isFocusVisible(),
        state.activeBoard.nodes, state.activeBoard.wires,
        logicalWidth, logicalHeight, cellSize,
        state.interactionMode.type === 'keyboard-wiring' ? state.interactionMode : null,
        state.activePuzzle?.connectionPoints,
      );
    }

    // Draw connection points on top of wires (always visible)
    renderConnectionPoints(ctx!, tokens, {
      activePuzzle: state.activePuzzle,
      perPortMatch: state.perPortMatch,
      editingUtilityId: state.editingUtilityId,
      cpSignals,
      connectedOutputCPs,
    }, cellSize);

    // Wire preview during drawing-wire mode (suppressed when overlay is active)
    const overlayActive = state.activeOverlay.type !== 'none';
    if (!overlayActive && state.interactionMode.type === 'drawing-wire' && state.mousePosition && state.activeBoard) {
      const cursorGrid = pixelToGrid(state.mousePosition.x, state.mousePosition.y, cellSize);

      // Recompute A* path only when cursor moves to a different grid cell
      if (cursorGrid.col !== lastPreviewGridCol || cursorGrid.row !== lastPreviewGridRow) {
        lastPreviewGridCol = cursorGrid.col;
        lastPreviewGridRow = cursorGrid.row;

        const fromPort = state.interactionMode.fromPort;
        const sourceNode = state.activeBoard.nodes.get(fromPort.nodeId);
        if (sourceNode) {
          const sourceAnchor = getPortGridAnchor(sourceNode, fromPort.side, fromPort.portIndex);
          const startDir = getPortWireDirection(sourceNode, fromPort.side, fromPort.portIndex);
          cachedPreviewPath = findPath(sourceAnchor, cursorGrid, state.occupancy, startDir, DIR_E);
        } else {
          cachedPreviewPath = null;
        }
      }

      renderWirePreview(ctx!, tokens, state.interactionMode.fromPosition, state.mousePosition, cachedPreviewPath, cellSize);
    } else {
      // Reset cache when not in drawing-wire mode
      lastPreviewGridCol = -1;
      lastPreviewGridRow = -1;
      cachedPreviewPath = null;
    }

    // Placement ghost (suppressed when overlay is active)
    if (!overlayActive) {
      renderPlacementGhost(ctx!, tokens, {
        interactionMode: state.interactionMode,
        mousePosition: state.mousePosition,
        occupancy: state.occupancy,
        puzzleNodes: state.puzzleNodes,
        utilityNodes: state.utilityNodes,
        keyboardGhostPosition: state.keyboardGhostPosition,
      }, cellSize);
    }

    // Lid animation overlay (drawn on top of the live board)
    if (lidActive) {
      drawLidAnimation(ctx!, tokens, lidAnim, lidProgress, logicalWidth, logicalHeight);
    }

    // --- Ceremony animation overlays (drawn on top of everything) ---
    if (ceremony.type === 'victory-burst') {
      const burstDuration = parseDurationMs(tokens.animCeremonyBurstDuration);
      const burstProgress = computeProgress(ceremony.startTime, timestamp, burstDuration);
      drawVictoryBurst(ctx!, tokens, burstProgress, logicalWidth, logicalHeight);

      if (burstProgress >= 1) {
        state.startNameReveal();
      }
    } else if (ceremony.type === 'name-reveal') {
      const revealDuration = parseDurationMs(tokens.animCeremonyRevealDuration);
      const revealProgress = computeProgress(ceremony.startTime, timestamp, revealDuration);

      const puzzleName = state.ceremonyPuzzle?.title ?? '';
      const puzzleDesc = state.ceremonyPuzzle?.description ?? '';
      drawNameReveal(ctx!, tokens, revealProgress, puzzleName, puzzleDesc, logicalWidth, logicalHeight);

      if (revealProgress >= 1) {
        // Capture grid-area snapshot for zoom-out (canvas is viewport-sized)
        const snapDpr = window.devicePixelRatio || 1;
        const bitmapX = Math.round(offset.x * snapDpr);
        const bitmapY = Math.round(offset.y * snapDpr);
        const bitmapW = Math.round(logicalWidth * snapDpr);
        const bitmapH = Math.round(logicalHeight * snapDpr);
        const snapshot = new OffscreenCanvas(bitmapW, bitmapH);
        const snapshotCtx = snapshot.getContext('2d');
        if (snapshotCtx) {
          snapshotCtx.drawImage(canvas, bitmapX, bitmapY, bitmapW, bitmapH, 0, 0, bitmapW, bitmapH);
        }
        state.startCeremonyZoomOut(snapshot);
      }
    } else if (ceremony.type === 'zoom-out') {
      const zoomDuration = parseDurationMs(tokens.animZoomDuration);
      const zoomProgress = computeProgress(ceremony.startTime, timestamp, zoomDuration);

      // Synthesize a closing lid animation state from the ceremony snapshot
      drawLidAnimation(ctx!, tokens, {
        type: 'closing',
        progress: zoomProgress,
        snapshot: ceremony.snapshot,
        startTime: ceremony.startTime,
      }, zoomProgress, logicalWidth, logicalHeight);

      if (zoomProgress >= 1) {
        // Ceremony complete — finalize
        handleCeremonyCompletion(state);
      }
    }

    // Dim canvas when an overlay is active (but not during ceremony or lid)
    const ceremonyActive = ceremony.type !== 'inactive';
    if (overlayActive && !lidActive && !ceremonyActive) {
      ctx!.fillStyle = 'rgba(0,0,0,0.15)';
      ctx!.fillRect(-offset.x, -offset.y, vpWidth, vpHeight);
    }

    // Reset transform (remove grid translate, keep DPR scale)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    animationId = requestAnimationFrame(render);
  }

  animationId = requestAnimationFrame(render);

  return () => {
    running = false;
    cancelAnimationFrame(animationId);
  };
}

/**
 * Handle ceremony completion: add puzzle node, complete level, dismiss ceremony.
 * Called from render loop when ceremony zoom-out reaches progress >= 1.
 */
function handleCeremonyCompletion(state: ReturnType<typeof useGameStore.getState>): void {
  const { ceremonyPuzzle, ceremonyBakeMetadata, ceremonyIsResolve: _ceremonyIsResolve } = state;

  // End animation
  state.endCeremony();

  if (!ceremonyPuzzle || !ceremonyBakeMetadata) {
    state.dismissCeremony();
    return;
  }

  // Mark level as completed — ceremony stays active for the React overlay
  // (CompletionCeremony.tsx will call dismissCeremony when user clicks a button)
  state.completeLevel(ceremonyPuzzle.id);
}

const CYCLE_COUNT = 256;

/**
 * Build flat signal arrays for all meter CPs from cycle results.
 * Input CPs get their values from the input waveforms (test case or creative slots).
 * Output CPs get their values from cycle evaluation results.
 */
function buildMeterSignalArrays(
  cycleResults: CycleResults | null,
  state: ReturnType<typeof useGameStore.getState>,
): ReadonlyMap<string, number[]> {
  const result = new Map<string, number[]>();
  const { activePuzzle, activeTestCaseIndex } = state;

  // Input signals from test case waveforms or creative mode slots
  if (activePuzzle) {
    const testCase = activePuzzle.testCases[activeTestCaseIndex];
    if (testCase) {
      for (let i = 0; i < testCase.inputs.length; i++) {
        const samples = new Array(CYCLE_COUNT);
        for (let c = 0; c < CYCLE_COUNT; c++) {
          samples[c] = generateWaveformValue(c, testCase.inputs[i]);
        }
        result.set(`input:${i}`, samples);
      }
    }
  } else if (state.isCreativeMode) {
    for (let i = 0; i < 3; i++) {
      const slot = state.creativeSlots[i];
      if (slot?.direction === 'input') {
        const samples = new Array(CYCLE_COUNT);
        for (let c = 0; c < CYCLE_COUNT; c++) {
          samples[c] = generateWaveformValue(c, slot.waveform);
        }
        result.set(`input:${i}`, samples);
      }
    }
  }

  // Output signals from cycle results
  if (cycleResults) {
    const outputCount = cycleResults.outputValues[0]?.length ?? 0;
    for (let i = 0; i < outputCount; i++) {
      const samples = new Array(CYCLE_COUNT);
      for (let c = 0; c < CYCLE_COUNT; c++) {
        samples[c] = cycleResults.outputValues[c]?.[i] ?? 0;
      }
      result.set(`output:${i}`, samples);
    }
  }

  return result;
}

/**
 * Build flat target arrays for output meters from puzzle test case expected outputs.
 */
function buildMeterTargetArrays(
  state: ReturnType<typeof useGameStore.getState>,
): ReadonlyMap<string, number[]> {
  const result = new Map<string, number[]>();
  const { activePuzzle, activeTestCaseIndex } = state;

  if (!activePuzzle) return result;

  const testCase = activePuzzle.testCases[activeTestCaseIndex];
  if (!testCase) return result;

  for (let i = 0; i < testCase.expectedOutputs.length; i++) {
    const samples = new Array(CYCLE_COUNT);
    for (let c = 0; c < CYCLE_COUNT; c++) {
      samples[c] = generateWaveformValue(c, testCase.expectedOutputs[i]);
    }
    result.set(`target:${i}`, samples);
  }

  return result;
}

/**
 * Build a wire lookup map: "nodeId:portIndex" → Wire for wire targets.
 * Rebuilt only when the wires array reference changes.
 */
function getWireTargetLookup(wires: ReadonlyArray<Wire>): Map<string, Wire> {
  if (wires === _knobWireLookupWires) return _knobWireLookup;

  _knobWireLookup = new Map();
  for (const wire of wires) {
    _knobWireLookup.set(`${wire.target.nodeId}:${wire.target.portIndex}`, wire);
  }
  _knobWireLookupWires = wires;
  return _knobWireLookup;
}

/**
 * Compute knob display values for all knob-equipped nodes on the active board.
 * Uses cycle results for wired knobs, or node params for unwired knobs.
 * Uses a cached wire lookup map to avoid O(nodes × wires) search per frame.
 */
function computeKnobValues(
  nodes: ReadonlyMap<string, NodeState>,
  wires: ReadonlyArray<Wire>,
  cycleResults: CycleResults | null,
  playpoint: number,
): ReadonlyMap<string, KnobInfo> {
  const result = new Map<string, KnobInfo>();
  const wireLookup = getWireTargetLookup(wires);

  for (const node of nodes.values()) {
    const knobConfig = getKnobConfig(getNodeDefinition(node.type));
    if (!knobConfig) continue;

    const { portIndex, paramKey } = knobConfig;

    // O(1) lookup instead of O(wires) linear search
    const wire = wireLookup.get(`${node.id}:${portIndex}`);

    if (wire) {
      // Read value from cycle results at current playpoint
      const wireVal = cycleResults?.wireValues.get(wire.id)?.[playpoint] ?? 0;
      result.set(node.id, { value: wireVal, isWired: true });
    } else {
      // Use the node's param value
      const value = Number(node.params[paramKey] ?? 0);
      result.set(node.id, { value, isWired: false });
    }
  }

  return result;
}
