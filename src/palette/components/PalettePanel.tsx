import { useGameStore } from '../../store/index.ts';
import { FUNDAMENTAL_NODES } from '../fundamental/index.ts';
import { generateId } from '../../shared/generate-id.ts';
import { createUtilityGameboard } from '../../puzzle/utility-gameboard.ts';
import { stopSimulation } from '../../simulation/simulation-controller.ts';
import styles from './PalettePanel.module.css';

export function PalettePanel() {
  const interactionMode = useGameStore((s) => s.interactionMode);
  const startPlacingNode = useGameStore((s) => s.startPlacingNode);
  const cancelPlacing = useGameStore((s) => s.cancelPlacing);
  const puzzleNodes = useGameStore((s) => s.puzzleNodes);
  const utilityNodes = useGameStore((s) => s.utilityNodes);
  const readOnly = useGameStore((s) => s.activeBoardReadOnly);

  if (readOnly) return null;

  function handleCreateCustom() {
    const state = useGameStore.getState();
    const utilityId = generateId();
    const board = createUtilityGameboard(utilityId);

    if (state.simulationRunning) {
      stopSimulation();
      state.setSimulationRunning(false);
    }

    const snapshot = document.querySelector('canvas')?.toDataURL() ?? '';
    state.startZoomTransition('in', snapshot);
    state.startEditingUtility(utilityId, board);
  }

  function handleEditUtility(utilityId: string) {
    const state = useGameStore.getState();
    const entry = state.utilityNodes.get(utilityId);
    if (!entry) return;

    if (state.simulationRunning) {
      stopSimulation();
      state.setSimulationRunning(false);
    }

    const snapshot = document.querySelector('canvas')?.toDataURL() ?? '';
    state.startZoomTransition('in', snapshot);
    state.startEditingUtility(utilityId, entry.board);
  }

  function handleDeleteUtility(utilityId: string) {
    useGameStore.getState().deleteUtilityNode(utilityId);
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Nodes</h3>
      <div className={styles.list}>
        {FUNDAMENTAL_NODES.map((def) => {
          const isActive =
            interactionMode.type === 'placing-node' &&
            interactionMode.nodeType === def.type;

          return (
            <button
              key={def.type}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              onClick={() => {
                if (isActive) {
                  cancelPlacing();
                } else {
                  startPlacingNode(def.type);
                }
              }}
            >
              {def.label}
            </button>
          );
        })}
      </div>

      {puzzleNodes.size > 0 && (
        <>
          <h3 className={styles.title}>Puzzles</h3>
          <div className={styles.list}>
            {Array.from(puzzleNodes.values()).map((entry) => {
              const nodeType = `puzzle:${entry.puzzleId}`;
              const isActive =
                interactionMode.type === 'placing-node' &&
                interactionMode.nodeType === nodeType;

              return (
                <button
                  key={nodeType}
                  className={`${styles.item} ${styles.puzzleItem} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    if (isActive) {
                      cancelPlacing();
                    } else {
                      startPlacingNode(nodeType);
                    }
                  }}
                >
                  {entry.title}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button className={`${styles.item} ${styles.createCustomBtn}`} onClick={handleCreateCustom}>
        + Create Custom Node
      </button>

      {utilityNodes.size > 0 && (
        <>
          <h3 className={styles.title}>Custom</h3>
          <div className={styles.list}>
            {Array.from(utilityNodes.values()).map((entry) => {
              const nodeType = `utility:${entry.utilityId}`;
              const isActive =
                interactionMode.type === 'placing-node' &&
                interactionMode.nodeType === nodeType;

              return (
                <div key={nodeType} className={styles.utilityItem}>
                  <button
                    className={`${styles.item} ${isActive ? styles.active : ''}`}
                    onClick={() => {
                      if (isActive) {
                        cancelPlacing();
                      } else {
                        startPlacingNode(nodeType);
                      }
                    }}
                  >
                    {entry.title}
                  </button>
                  <div className={styles.utilityActions}>
                    <button
                      className={styles.smallBtn}
                      onClick={() => handleEditUtility(entry.utilityId)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className={styles.smallBtn}
                      onClick={() => handleDeleteUtility(entry.utilityId)}
                      title="Delete"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
