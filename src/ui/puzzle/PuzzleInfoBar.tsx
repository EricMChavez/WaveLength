import { useGameStore } from '../../store/index.ts';
import { getVictoryThreshold } from '../../puzzle/validation.ts';
import styles from './PuzzleInfoBar.module.css';

export function PuzzleInfoBar() {
  const activePuzzle = useGameStore((s) => s.activePuzzle);
  const activeTestCaseIndex = useGameStore((s) => s.activeTestCaseIndex);
  const validationStreak = useGameStore((s) => s.validationStreak);
  const puzzleStatus = useGameStore((s) => s.puzzleStatus);
  const testCasesPassed = useGameStore((s) => s.testCasesPassed);
  const simulationRunning = useGameStore((s) => s.simulationRunning);

  if (!activePuzzle) return null;

  const testCase = activePuzzle.testCases[activeTestCaseIndex];
  const totalCases = activePuzzle.testCases.length;
  const victoryThreshold = testCase ? getVictoryThreshold(testCase) : 0;

  return (
    <div className={styles.bar}>
      <span className={styles.title}>{activePuzzle.title}</span>
      <span className={styles.description}>{activePuzzle.description}</span>
      {testCase && (
        <span className={styles.testCase}>
          Test {activeTestCaseIndex + 1}/{totalCases}: {testCase.name}
        </span>
      )}
      {puzzleStatus === 'victory' ? (
        <span className={styles.victory}>Puzzle Complete!</span>
      ) : (
        <>
          {simulationRunning && victoryThreshold > 0 && (
            <span className={styles.streak}>
              Streak: {validationStreak}/{victoryThreshold}
            </span>
          )}
          {totalCases > 1 && (
            <span className={styles.testsPassed}>
              Tests: {testCasesPassed.length}/{totalCases} passed
            </span>
          )}
        </>
      )}
    </div>
  );
}
