import { useGameStore } from '../../store/index.ts';
import { NODE_TYPE_LABELS } from '../../shared/constants/index.ts';
import styles from './NodeControls.module.css';

export function NodeControls() {
  const selectedNodeId = useGameStore((s) => s.selectedNodeId);
  const activeBoard = useGameStore((s) => s.activeBoard);
  const removeNode = useGameStore((s) => s.removeNode);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const readOnly = useGameStore((s) => s.activeBoardReadOnly);
  const zoomIntoNode = useGameStore((s) => s.zoomIntoNode);

  if (!selectedNodeId || !activeBoard) return null;
  const node = activeBoard.nodes.get(selectedNodeId);
  if (!node) return null;

  const isPuzzleNode = node.type.startsWith('puzzle:');
  const isUtilityNode = node.type.startsWith('utility:');
  const puzzleId = isPuzzleNode ? node.type.slice('puzzle:'.length) : null;
  const utilityId = isUtilityNode ? node.type.slice('utility:'.length) : null;
  const puzzleEntry = puzzleId ? useGameStore.getState().puzzleNodes.get(puzzleId) : null;
  const utilityEntry = utilityId ? useGameStore.getState().utilityNodes.get(utilityId) : null;
  const label = isPuzzleNode && puzzleEntry
    ? puzzleEntry.title
    : isUtilityNode && utilityEntry
      ? utilityEntry.title
      : (NODE_TYPE_LABELS[node.type] ?? node.type);
  const isZoomable = isPuzzleNode || isUtilityNode;

  const isModified = (() => {
    if (!node.libraryVersionHash) return false;
    if (isPuzzleNode && puzzleEntry) return puzzleEntry.versionHash !== node.libraryVersionHash;
    if (isUtilityNode && utilityEntry) return utilityEntry.versionHash !== node.libraryVersionHash;
    return false;
  })();

  function handleEdit() {
    const state = useGameStore.getState();
    const snapshot = document.querySelector('canvas')?.toDataURL() ?? '';
    state.startZoomTransition('in', snapshot);
    zoomIntoNode(selectedNodeId!);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>
          {label}
          {isModified && <span className={styles.modifiedBadge}> modified</span>}
        </span>
        <div className={styles.headerButtons}>
          {isZoomable && (
            <button
              className={styles.editBtn}
              onClick={handleEdit}
              title="View internals"
            >
              Edit
            </button>
          )}
          {!readOnly && (
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
          )}
        </div>
      </div>

    </div>
  );
}
