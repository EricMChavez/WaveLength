import { useGameStore } from '../../store/index.ts';
import { PUZZLE_LEVELS } from '../../puzzle/levels/index.ts';
import { createPuzzleGameboard } from '../../puzzle/puzzle-gameboard.ts';
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
    store.dismissCeremony();

    // Find the next puzzle after the current one
    const currentIndex = PUZZLE_LEVELS.findIndex((p) => p.id === puzzle!.id);
    const nextPuzzle = currentIndex >= 0 ? PUZZLE_LEVELS[currentIndex + 1] : undefined;

    if (nextPuzzle) {
      store.loadPuzzle(nextPuzzle);
      store.setActiveBoard(createPuzzleGameboard(nextPuzzle));
    } else {
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
