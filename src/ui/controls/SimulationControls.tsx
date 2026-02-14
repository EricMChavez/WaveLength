import { useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';
import styles from './SimulationControls.module.css';

export function SimulationControls() {
  const isCreativeMode = useGameStore((s) => s.isCreativeMode);
  const authoringPhase = useGameStore((s) => s.authoringPhase);
  const openOverlay = useGameStore((s) => s.openOverlay);
  const beginSaveAsPuzzle = useGameStore((s) => s.beginSaveAsPuzzle);
  const resetToSolution = useGameStore((s) => s.resetToSolution);
  const cancelAuthoring = useGameStore((s) => s.cancelAuthoring);
  const tutorialTitleDraft = useGameStore((s) => s.tutorialTitleDraft);
  const setTutorialTitleDraft = useGameStore((s) => s.setTutorialTitleDraft);
  const tutorialMessageDraft = useGameStore((s) => s.tutorialMessageDraft);
  const setTutorialMessageDraft = useGameStore((s) => s.setTutorialMessageDraft);

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

  if (!isCreativeMode || authoringPhase !== 'configuring-start') return null;

  return (
    <div className={styles.panel}>
      <div className={styles.banner}>
        Configure starting state &mdash; remove nodes/wires the player must figure out
      </div>
      <input
        className={styles.messageInput}
        type="text"
        placeholder="Card title (optional)"
        value={tutorialTitleDraft}
        onChange={(e) => setTutorialTitleDraft(e.target.value)}
        maxLength={40}
      />
      <input
        className={styles.messageInput}
        type="text"
        placeholder="Card body (optional)"
        value={tutorialMessageDraft}
        onChange={(e) => setTutorialMessageDraft(e.target.value)}
        maxLength={200}
      />
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
