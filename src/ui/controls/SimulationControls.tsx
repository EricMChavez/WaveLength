import { useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';
import styles from './SimulationControls.module.css';

export function SimulationControls() {
  const isCreativeMode = useGameStore((s) => s.isCreativeMode);
  const openOverlay = useGameStore((s) => s.openOverlay);
  const beginSaveAsPuzzle = useGameStore((s) => s.beginSaveAsPuzzle);
  const canSave = useGameStore((s) => {
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

  const handleSaveAsPuzzle = useCallback(() => {
    beginSaveAsPuzzle();
    openOverlay({ type: 'save-puzzle-dialog' });
  }, [beginSaveAsPuzzle, openOverlay]);

  if (!isCreativeMode) return null;

  return (
    <div className={styles.panel}>
      <button
        className={styles.saveButton}
        onClick={handleSaveAsPuzzle}
        disabled={!canSave}
        title={canSave ? 'Save current configuration as a puzzle' : 'Wire an output with non-zero signal before saving'}
      >
        Save as Puzzle
      </button>
    </div>
  );
}
