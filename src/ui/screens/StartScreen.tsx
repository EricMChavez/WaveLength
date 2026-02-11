import { useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';
import { initializeCreativeMode } from '../../App.tsx';
import styles from './StartScreen.module.css';

export function StartScreen() {
  const overlay = useGameStore((s) => s.activeOverlay);
  if (overlay.type !== 'start-screen') return null;
  return <StartScreenInner />;
}

function StartScreenInner() {
  const closeOverlay = useGameStore((s) => s.closeOverlay);
  const openOverlay = useGameStore((s) => s.openOverlay);
  const hasSavedCreative = useGameStore((s) => s.savedCreativeState !== null);
  const clearSavedCreativeState = useGameStore((s) => s.clearSavedCreativeState);

  const handleResumeCreative = useCallback(() => {
    // Restore saved creative mode state
    initializeCreativeMode();
    closeOverlay();
  }, [closeOverlay]);

  const handleNewCreative = useCallback(() => {
    // Clear saved state and start fresh
    clearSavedCreativeState();
    initializeCreativeMode();
    closeOverlay();
  }, [clearSavedCreativeState, closeOverlay]);

  const handleCreativeMode = useCallback(() => {
    // No saved state — just start fresh
    initializeCreativeMode();
    closeOverlay();
  }, [closeOverlay]);

  const handleLevelSelect = useCallback(() => {
    openOverlay({ type: 'level-select' });
  }, [openOverlay]);

  return (
    <div className={styles.backdrop}>
      <div className={styles.container}>
        <h1 className={styles.title}>Signal Puzzle</h1>
        <p className={styles.subtitle}>Wire together nodes to transform signals</p>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleLevelSelect}
          >
            <span className={styles.buttonIcon}>&#x25B6;</span>
            Level Select
          </button>

          {hasSavedCreative ? (
            <>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleResumeCreative}
              >
                <span className={styles.buttonIcon}>&#x2699;</span>
                Resume Creative
              </button>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleNewCreative}
              >
                <span className={styles.buttonIcon}>&#x2699;</span>
                New Creative
              </button>
            </>
          ) : (
            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={handleCreativeMode}
            >
              <span className={styles.buttonIcon}>&#x2699;</span>
              Creative Mode
            </button>
          )}
        </div>

        <div className={styles.hint}>
          <p>Complete puzzles to unlock new nodes for Creative Mode</p>
        </div>
      </div>
    </div>
  );
}
