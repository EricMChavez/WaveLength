import { useGameStore } from '../../store/index.ts';
import styles from './ZoomTransition.module.css';

export function ZoomTransition() {
  const transition = useGameStore((s) => s.zoomTransition);
  const endZoomTransition = useGameStore((s) => s.endZoomTransition);

  if (!transition) return null;

  const animClass = transition.direction === 'in' ? styles.zoomIn : styles.zoomOut;

  return (
    <div className={styles.overlay}>
      <img
        className={`${styles.snapshot} ${animClass}`}
        src={transition.snapshot}
        alt=""
        onAnimationEnd={endZoomTransition}
      />
    </div>
  );
}
