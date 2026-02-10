import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/index.ts';
import { slotToMeterInfo } from '../../store/slices/creative-slice.ts';
import type { CustomPuzzle } from '../../store/slices/custom-puzzle-slice.ts';
import { nodeRegistry, getNodeLabel } from '../../engine/nodes/registry.ts';
import styles from './SavePuzzleDialog.module.css';

/** Samples per WTS (16 subdivisions) */
const SAMPLES_PER_WTS = 16;

export function SavePuzzleDialog() {
  const overlay = useGameStore((s) => s.activeOverlay);
  if (overlay.type !== 'save-puzzle-dialog') return null;
  return <SavePuzzleDialogInner />;
}

function SavePuzzleDialogInner() {
  const closeOverlay = useGameStore((s) => s.closeOverlay);
  const cancelAuthoring = useGameStore((s) => s.cancelAuthoring);
  const trimBufferSnapshot = useGameStore((s) => s.trimBufferSnapshot);
  const trimConfig = useGameStore((s) => s.trimConfig);
  const creativeSlots = useGameStore((s) => s.creativeSlots);
  const activeBoard = useGameStore((s) => s.activeBoard);
  const addCustomPuzzle = useGameStore((s) => s.addCustomPuzzle);

  // Build list of all fundamental node types (including "Custom" for user-created nodes)
  const allNodeTypes = useMemo(() => {
    const types: Array<{ type: string; label: string }> = [];
    for (const def of nodeRegistry.all) {
      types.push({ type: def.type, label: getNodeLabel(def.type) });
    }
    // Add "Custom" as a fundamental node type that enables all user-created nodes
    types.push({ type: 'custom', label: 'Custom' });
    return types;
  }, []);

  const allTypeStrings = useMemo(() => allNodeTypes.map((t) => t.type), [allNodeTypes]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [allowedNodeSet, setAllowedNodeSet] = useState<Set<string>>(() => new Set(allTypeStrings));
  const [startingNodeIds, setStartingNodeIds] = useState<Set<string>>(new Set());
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Non-CP board nodes available as starting nodes
  const boardNodes = useMemo(() => {
    if (!activeBoard) return [];
    return Array.from(activeBoard.nodes.values())
      .filter((node) => !node.id.startsWith('creative-slot-'));
  }, [activeBoard]);

  // Focus title input on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Find input and output slots
  const inputSlots = creativeSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.direction === 'input');

  const outputSlots = creativeSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.direction === 'output');

  const { startWTS, endWTS } = trimConfig;
  const durationWTS = endWTS - startWTS;

  const handleCancel = useCallback(() => {
    cancelAuthoring();
    closeOverlay();
  }, [cancelAuthoring, closeOverlay]);

  const handleSave = useCallback(() => {
    // Validate
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!activeBoard || !trimBufferSnapshot) {
      setError('Invalid state - please try again');
      return;
    }

    // Extract trimmed samples for each output slot
    const targetSamples = new Map<number, number[]>();
    const startSample = startWTS * SAMPLES_PER_WTS;
    const endSample = endWTS * SAMPLES_PER_WTS;

    for (const { index: slotIndex } of outputSlots) {
      const fullBuffer = trimBufferSnapshot.get(slotIndex);
      if (fullBuffer) {
        const trimmed = fullBuffer.slice(startSample, endSample);
        targetSamples.set(slotIndex, trimmed);
      }
    }

    // Build slot configuration
    const slots = creativeSlots.map((slot) => ({
      direction: slot.direction,
      waveform: slot.direction === 'input' ? slot.waveform : undefined,
    }));

    // Serialize starting nodes (only those selected by the author)
    const initialNodes = Array.from(activeBoard.nodes.values())
      .filter((node) => !node.id.startsWith('creative-slot-') && startingNodeIds.has(node.id))
      .map((node) => ({
        id: node.id,
        type: node.type,
        position: { col: node.position.col, row: node.position.row },
        params: { ...node.params },
        inputCount: node.inputCount,
        outputCount: node.outputCount,
        rotation: node.rotation,
      }));

    // No wires for starting nodes (they're placed individually)
    const initialWires: CustomPuzzle['initialWires'] = [];

    // Compute allowedNodes: null means all types allowed
    const computedAllowed = allowedNodeSet.size === allTypeStrings.length
      ? null
      : Array.from(allowedNodeSet);

    // Create puzzle
    const puzzle: CustomPuzzle = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      createdAt: Date.now(),
      slots,
      targetSamples,
      initialNodes,
      initialWires,
      allowedNodes: computedAllowed,
    };

    addCustomPuzzle(puzzle);
    cancelAuthoring();
    closeOverlay();
  }, [
    title,
    description,
    activeBoard,
    trimBufferSnapshot,
    startWTS,
    endWTS,
    creativeSlots,
    outputSlots,
    addCustomPuzzle,
    cancelAuthoring,
    closeOverlay,
    startingNodeIds,
    allowedNodeSet,
    allTypeStrings,
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [handleCancel, handleSave]);

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel} onKeyDown={handleKeyDown}>
        <div className={styles.header}>
          <h2 className={styles.title}>Save Puzzle</h2>
        </div>

        <div className={styles.content}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="puzzle-title">Title</label>
            <input
              ref={titleInputRef}
              id="puzzle-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="My Puzzle"
              maxLength={50}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="puzzle-description">Description (optional)</label>
            <textarea
              id="puzzle-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this puzzle does..."
              rows={3}
              maxLength={200}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Puzzle Configuration</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Inputs:</span>
                <span className={styles.summaryValue}>
                  {inputSlots.length > 0
                    ? inputSlots.map(({ index }) => {
                        const { side, index: meterIndex } = slotToMeterInfo(index);
                        return `${side === 'left' ? 'L' : 'R'}${meterIndex + 1}`;
                      }).join(', ')
                    : 'None'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Outputs:</span>
                <span className={styles.summaryValue}>
                  {outputSlots.length > 0
                    ? outputSlots.map(({ index }) => {
                        const { side, index: meterIndex } = slotToMeterInfo(index);
                        return `${side === 'left' ? 'L' : 'R'}${meterIndex + 1}`;
                      }).join(', ')
                    : 'None'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Loop duration:</span>
                <span className={styles.summaryValue}>{durationWTS} WTS ({durationWTS}s)</span>
              </div>
            </div>
          </div>

          <div className={styles.checkboxSection}>
            <h3 className={styles.summaryTitle}>
              Allowed Nodes
              <button
                type="button"
                className={styles.toggleAllButton}
                onClick={() => {
                  if (allowedNodeSet.size === allTypeStrings.length) {
                    setAllowedNodeSet(new Set());
                  } else {
                    setAllowedNodeSet(new Set(allTypeStrings));
                  }
                }}
              >
                {allowedNodeSet.size === allTypeStrings.length ? 'None' : 'All'}
              </button>
            </h3>
            <div className={styles.checkboxGrid}>
              {allNodeTypes.map((entry) => (
                <label key={entry.type} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={allowedNodeSet.has(entry.type)}
                    onChange={(e) => {
                      const next = new Set(allowedNodeSet);
                      if (e.target.checked) next.add(entry.type);
                      else next.delete(entry.type);
                      setAllowedNodeSet(next);
                    }}
                  />
                  <span>{entry.label}</span>
                </label>
              ))}
            </div>
          </div>

          {boardNodes.length > 0 && (
            <div className={styles.checkboxSection}>
              <h3 className={styles.summaryTitle}>Starting Nodes</h3>
              <div className={styles.startingNodeList}>
                {boardNodes.map((node) => (
                  <label key={node.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={startingNodeIds.has(node.id)}
                      onChange={(e) => {
                        const next = new Set(startingNodeIds);
                        if (e.target.checked) next.add(node.id);
                        else next.delete(node.id);
                        setStartingNodeIds(next);
                      }}
                    />
                    <span>{getNodeLabel(node.type)} ({node.position.col}, {node.position.row})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleCancel}>Cancel</button>
          <button className={styles.saveButton} onClick={handleSave}>Save Puzzle</button>
        </div>
      </div>
    </div>
  );
}
