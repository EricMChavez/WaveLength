import { useGameStore } from '../../store/index.ts';
import { PUZZLE_LEVELS } from '../../puzzle/levels/index.ts';
import { createPuzzleGameboard } from '../../puzzle/puzzle-gameboard.ts';
import { buildConnectionPointConfig } from '../../puzzle/types.ts';
import styles from './CompletionCeremony.module.css';

export function CompletionCeremony() {
  const active = useGameStore((s) => s.ceremonyActive);
  const snapshot = useGameStore((s) => s.ceremonySnapshot);
  const puzzle = useGameStore((s) => s.ceremonyPuzzle);
  const isResolve = useGameStore((s) => s.ceremonyIsResolve);
  const bakeMetadata = useGameStore((s) => s.ceremonyBakeMetadata);

  if (!active || !puzzle) return null;

  function handleContinue() {
    const store = useGameStore.getState();

    // Mark level as completed in progression state
    store.completeLevel(puzzle!.id);

    store.dismissCeremony();

    // Use progression state to determine next level
    const nextIndex = store.currentLevelIndex;
    const nextPuzzle = PUZZLE_LEVELS[nextIndex];

    if (nextPuzzle && nextPuzzle.id !== puzzle!.id) {
      store.setCurrentLevel(nextIndex);
      store.loadPuzzle(nextPuzzle);
      store.setActiveBoard(createPuzzleGameboard(nextPuzzle));

      // Initialize meters with the next puzzle's connection point configuration
      const cpConfig = nextPuzzle.connectionPoints
        ?? buildConnectionPointConfig(nextPuzzle.activeInputs, nextPuzzle.activeOutputs);
      store.initializeMeters(cpConfig, 'active');

    } else {
      // Last level completed — go to sandbox
      store.unloadPuzzle();
      store.setActiveBoard({ id: 'sandbox', nodes: new Map(), wires: [] });
    }
  }

  function handleKeepCurrent() {
    useGameStore.getState().dismissCeremony();
  }

  function handleSaveNew() {
    if (bakeMetadata && puzzle) {
      const store = useGameStore.getState();
      store.updatePuzzleNode(puzzle.id, bakeMetadata);
      store.dismissCeremony();
    }
  }

  return (
    <div className={styles.overlay}>
      {snapshot && (
        <img
          className={styles.snapshot}
          src={snapshot}
          alt="Puzzle solution"
          width={400}
          height={300}
        />
      )}

      <div className={styles.info}>
        <h2 className={styles.title}>{puzzle.title}</h2>
        <p className={styles.description}>{puzzle.description}</p>
        {!isResolve && (
          <p className={styles.paletteMessage}>Added to your Puzzle palette!</p>
        )}
      </div>

      <div className={styles.buttons}>
        {isResolve ? (
          <>
            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleKeepCurrent}>
              Keep Current
            </button>
            <button className={styles.button} onClick={handleSaveNew}>
              Save New Solution
            </button>
          </>
        ) : (
          <button className={styles.button} onClick={handleContinue}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
