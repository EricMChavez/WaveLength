import { useGameStore } from '../../store/index.ts';
import { NODE_TYPE_LABELS } from '../../shared/constants/index.ts';
import type { MixMode } from '../../engine/nodes/mix.ts';
import styles from './NodeControls.module.css';

const MIX_MODES: MixMode[] = ['Add', 'Subtract', 'Average', 'Max', 'Min'];
const DELAY_OPTIONS = Array.from({ length: 17 }, (_, i) => i);

export function NodeControls() {
  const selectedNodeId = useGameStore((s) => s.selectedNodeId);
  const activeBoard = useGameStore((s) => s.activeBoard);
  const updateNodeParams = useGameStore((s) => s.updateNodeParams);
  const removeNode = useGameStore((s) => s.removeNode);
  const clearSelection = useGameStore((s) => s.clearSelection);

  if (!selectedNodeId || !activeBoard) return null;
  const node = activeBoard.nodes.get(selectedNodeId);
  if (!node) return null;

  const label = NODE_TYPE_LABELS[node.type] ?? node.type;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{label}</span>
        <button
          className={styles.deleteBtn}
          onClick={() => {
            removeNode(selectedNodeId);
            clearSelection();
          }}
          title="Delete node"
        >
          ×
        </button>
      </div>

      {node.type === 'mix' && (
        <label className={styles.field}>
          <span>Mode</span>
          <select
            value={String(node.params['mode'] ?? 'Add')}
            onChange={(e) =>
              updateNodeParams(selectedNodeId, { mode: e.target.value })
            }
          >
            {MIX_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      )}

      {node.type === 'threshold' && (
        <label className={styles.field}>
          <span>Threshold: {node.params['threshold'] ?? 0}</span>
          <input
            type="range"
            min={-100}
            max={100}
            value={Number(node.params['threshold'] ?? 0)}
            onChange={(e) =>
              updateNodeParams(selectedNodeId, { threshold: Number(e.target.value) })
            }
          />
        </label>
      )}

      {node.type === 'delay' && (
        <label className={styles.field}>
          <span>Subdivisions</span>
          <select
            value={Number(node.params['subdivisions'] ?? 0)}
            onChange={(e) =>
              updateNodeParams(selectedNodeId, { subdivisions: Number(e.target.value) })
            }
          >
            {DELAY_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
