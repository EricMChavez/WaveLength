import { useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';
import styles from './SimulationControls.module.css';

export function SimulationControls() {
  const isCreativeMode = useGameStore((s) => s.isCreativeMode);
  const authoringPhase = useGameStore((s) => s.authoringPhase);
  const openOverlay = useGameStore((s) => s.openOverlay);
  const beginRecordTarget = useGameStore((s) => s.beginRecordTarget);
  const beginSaveAsPuzzle = useGameStore((s) => s.beginSaveAsPuzzle);
  const resetToSolution = useGameStore((s) => s.resetToSolution);
  const cancelAuthoring = useGameStore((s) => s.cancelAuthoring);

  const canRecord = useGameStore((s) => {
    if (!s.isCreativeMode) return false;
    const { cycleResults } = s;
    if (!cycleResults) return false;
    // Must have at least one output with non-zero signal
    const outputCount = cycleResults.outputValues[0]?.length ?? 0;
    if (outputCount === 0) return false;
    for (let oi = 0; oi < outputCount; oi++) {
      for (let c = 0; c < cycleResults.outputValues.length; c++) {
        if (cycleResults.outputValues[c][oi] !== 0) return true;
      }
    }
    return false;
  });

  const handleRecordTarget = useCallback(() => {
    beginRecordTarget();
  }, [beginRecordTarget]);

  const handleSavePuzzle = useCallback(() => {
    beginSaveAsPuzzle();
    openOverlay({ type: 'save-puzzle-dialog' });
  }, [beginSaveAsPuzzle, openOverlay]);

  const handleReset = useCallback(() => {
    resetToSolution();
  }, [resetToSolution]);

  const handleCancel = useCallback(() => {
    cancelAuthoring();
  }, [cancelAuthoring]);

  if (!isCreativeMode) return null;

  if (authoringPhase === 'configuring-start') {
    return (
      <div className={styles.panel}>
        <div className={styles.banner}>
          Configure starting state &mdash; remove nodes/wires the player must figure out
        </div>
        <div className={styles.buttonRow}>
          <button className={styles.saveButton} onClick={handleSavePuzzle}>
            Save Puzzle
          </button>
          <button className={styles.secondaryButton} onClick={handleReset}>
            Reset to Solution
          </button>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <button
        className={styles.saveButton}
        onClick={handleRecordTarget}
        disabled={!canRecord}
        title={canRecord ? 'Record current output as puzzle target' : 'Wire an output with non-zero signal before recording'}
      >
        Record Target
      </button>
    </div>
  );
}
