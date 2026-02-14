import { useGameStore } from '../../store/index.ts';
import { captureGridSnapshot } from '../../gameboard/canvas/snapshot.ts';
import styles from './GameboardButtons.module.css';

export function GameboardButtons() {
  const isCreativeMode = useGameStore((s) => s.isCreativeMode);
  const authoringPhase = useGameStore((s) => s.authoringPhase);
  const navigationDepth = useGameStore((s) => s.navigationDepth);
  const editingUtilityId = useGameStore((s) => s.editingUtilityId);
  const activeBoardReadOnly = useGameStore((s) => s.activeBoardReadOnly);
  const ceremonyType = useGameStore((s) => s.ceremonyState.type);
  const overlayType = useGameStore((s) => s.activeOverlay.type);
  const lidType = useGameStore((s) => s.lidAnimation.type);
  const zoomTransition = useGameStore((s) => s.zoomTransition);

  const canRecord = useGameStore((s) => {
    if (!s.isCreativeMode) return false;
    const { cycleResults } = s;
    if (!cycleResults) return false;
    const outputCount = cycleResults.outputValues[0]?.length ?? 0;
    if (outputCount === 0) return false;
    for (let oi = 0; oi < outputCount; oi++) {
      for (let c = 0; c < cycleResults.outputValues.length; c++) {
        if (cycleResults.outputValues[c][oi] !== 0) return true;
      }
    }
    return false;
  });

  // Both buttons hidden during overlays, lid animation, zoom transition, victory-screen
  const hidden =
    overlayType !== 'none' ||
    lidType !== 'idle' ||
    zoomTransition !== null ||
    ceremonyType === 'victory-screen';

  if (hidden) return null;

  return (
    <div className={styles.container}>
      <BackButton
        isCreativeMode={isCreativeMode}
        navigationDepth={navigationDepth}
        editingUtilityId={editingUtilityId}
        activeBoardReadOnly={activeBoardReadOnly}
        ceremonyType={ceremonyType}
      />
      <ProgressButton
        isCreativeMode={isCreativeMode}
        authoringPhase={authoringPhase}
        editingUtilityId={editingUtilityId}
        navigationDepth={navigationDepth}
        activeBoardReadOnly={activeBoardReadOnly}
        ceremonyType={ceremonyType}
        canRecord={canRecord}
      />
    </div>
  );
}

function BackButton({
  isCreativeMode,
  navigationDepth,
  editingUtilityId,
  activeBoardReadOnly,
  ceremonyType,
}: {
  isCreativeMode: boolean;
  navigationDepth: number;
  editingUtilityId: string | null;
  activeBoardReadOnly: boolean;
  ceremonyType: string;
}) {
  function handleClick() {
    const store = useGameStore.getState();

    if (ceremonyType === 'it-works') {
      store.dismissCeremony();
    } else if (editingUtilityId !== null) {
      store.openOverlay({ type: 'unsaved-changes' });
    } else if (navigationDepth > 0 && activeBoardReadOnly) {
      const snapshot = captureGridSnapshot();
      if (snapshot) store.startLidClose(snapshot);
      store.zoomOut();
    } else if (isCreativeMode) {
      store.openOverlay({ type: 'start-screen' });
    } else {
      store.openOverlay({ type: 'level-select' });
    }
  }

  let label: string;
  if (ceremonyType === 'it-works') {
    label = 'Dismiss';
  } else if (editingUtilityId !== null) {
    label = 'Back';
  } else if (navigationDepth > 0 && activeBoardReadOnly) {
    label = 'Back';
  } else if (isCreativeMode) {
    label = 'Menu';
  } else {
    label = 'Levels';
  }

  return (
    <button className={styles.btn} onClick={handleClick}>
      <span className={styles.icon}>&larr;</span>
      {label}
    </button>
  );
}

function ProgressButton({
  isCreativeMode,
  authoringPhase,
  editingUtilityId,
  navigationDepth,
  activeBoardReadOnly,
  ceremonyType,
  canRecord,
}: {
  isCreativeMode: boolean;
  authoringPhase: string;
  editingUtilityId: string | null;
  navigationDepth: number;
  activeBoardReadOnly: boolean;
  ceremonyType: string;
  canRecord: boolean;
}) {
  // Hidden when editing, inspecting, or creative authoring (not idle)
  if (editingUtilityId !== null) return null;
  if (navigationDepth > 0 && activeBoardReadOnly) return null;
  if (isCreativeMode && authoringPhase !== 'idle') return null;

  // Creative mode idle: record target
  if (isCreativeMode) {
    function handleRecord() {
      useGameStore.getState().beginRecordTarget();
    }
    return (
      <button
        className={`${styles.btn} ${!canRecord ? styles.btnDisabled : ''}`}
        onClick={canRecord ? handleRecord : undefined}
        title={canRecord ? 'Record current output as puzzle target' : 'Wire an output with non-zero signal first'}
      >
        Record Target
      </button>
    );
  }

  // Puzzle mode: it-works = unlocked amber, otherwise locked
  if (ceremonyType === 'it-works') {
    function handleComplete() {
      const store = useGameStore.getState();
      if (store.ceremonyPuzzle) {
        store.completeLevel(store.ceremonyPuzzle.id);
      }
      store.showVictoryScreen();
    }
    return (
      <button className={`${styles.btn} ${styles.btnAmber}`} onClick={handleComplete}>
        Complete
      </button>
    );
  }

  // Puzzle mode, not won: locked
  return (
    <button className={`${styles.btn} ${styles.btnDisabled}`} title="Solve the puzzle to unlock">
      <span className={styles.icon}>&#x1F512;</span>
      Locked
    </button>
  );
}
