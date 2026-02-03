import { useGameStore } from '../../store/index.ts';
import { startSimulation, stopSimulation } from '../../simulation/simulation-controller.ts';
import styles from './SimulationControls.module.css';

export function SimulationControls() {
  const running = useGameStore((s) => s.simulationRunning);
  const activeBoard = useGameStore((s) => s.activeBoard);

  if (!activeBoard) return null;

  function toggle() {
    if (running) {
      stopSimulation();
      useGameStore.getState().setSimulationRunning(false);
    } else {
      startSimulation();
      useGameStore.getState().setSimulationRunning(true);
    }
  }

  return (
    <div className={styles.panel}>
      <button
        className={`${styles.button} ${running ? styles.buttonActive : ''}`}
        onClick={toggle}
      >
        {running ? 'Stop' : 'Play'}
      </button>
    </div>
  );
}
