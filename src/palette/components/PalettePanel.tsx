import { useGameStore } from '../../store/index.ts';
import { FUNDAMENTAL_NODES } from '../fundamental/index.ts';
import styles from './PalettePanel.module.css';

export function PalettePanel() {
  const interactionMode = useGameStore((s) => s.interactionMode);
  const startPlacingNode = useGameStore((s) => s.startPlacingNode);
  const cancelPlacing = useGameStore((s) => s.cancelPlacing);

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
    </div>
  );
}
