import { useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';
import { playSound } from '../../shared/audio/audio-manager.ts';
import type { GizmoTab } from '../../store/slices/screen-slice.ts';
import { CrtContent } from './CrtContent.tsx';
import { PowerMeter } from './PowerMeter.tsx';
import retro from './retro-shared.module.css';
import styles from './GizmoFace.module.css';

interface TabButton {
  tab: GizmoTab;
  label: string;
}

const TABS: TabButton[] = [
  { tab: 'home', label: 'Home' },
  { tab: 'about', label: 'About' },
  { tab: 'settings', label: 'Settings' },
];

export function GizmoFace() {
  const activeScreen = useGameStore((s) => s.activeScreen);
  const switchTab = useGameStore((s) => s.switchTab);
  const dismissScreen = useGameStore((s) => s.dismissScreen);

  const handlePlay = useCallback(() => {
    playSound('menu-play-button');
    dismissScreen();
  }, [dismissScreen]);

  return (
    <div className={styles.gizmo}>
      {/* SVG clip-path: barrel/pillow shape for CRT screen */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="crt-screen" clipPathUnits="objectBoundingBox">
            <path d="M 0.03 0.04 Q 0.5 -0.02 0.97 0.04 C 0.978 0.04 0.985 0.057 0.985 0.07 Q 0.99 0.5 0.985 0.93 C 0.985 0.947 0.978 0.96 0.97 0.96 Q 0.5 1.02 0.03 0.96 C 0.022 0.96 0.015 0.947 0.015 0.93 Q 0.01 0.5 0.015 0.07 C 0.015 0.053 0.022 0.04 0.03 0.04 Z"/>
          </clipPath>
        </defs>
      </svg>

      {/* Corner screws */}
      <div className={styles.cornerScrews}>
        <div className={`${retro.screw} ${retro.screwTL}`} />
        <div className={`${retro.screw} ${retro.screwTR}`} />
        <div className={`${retro.screw} ${retro.screwBL}`} />
        <div className={`${retro.screw} ${retro.screwBR}`} />
      </div>

      {/* Monitor — rows 1-2, cols 1-2 */}
      <div className={styles.monitor}>
        <div className={retro.screenHousing}>
          <div className={`${retro.screen} ${styles.crtScreen}`}>
            <CrtContent />
            <div className={retro.highlightStreak} />
            <div className={retro.noiseGrain} />
            <div className={retro.insetDepth} />
            <div className={retro.glassBulge} />
          </div>
        </div>
      </div>

      {/* Signal level — row 1, col 3 */}
      <div className={styles.signalLevel}>
        <PowerMeter vertical />
      </div>

      {/* Bottom row — tabs + play button */}
      <div className={styles.bottomRow}>
        <div className={styles.tabRow}>
          {TABS.map(({ tab, label }) => {
            const isActive = activeScreen === tab;
            return (
              <button
                key={tab}
                className={`${retro.keycap} ${retro.keycapLight} ${isActive ? retro.keycapDepressed : ''}`}
                onClick={() => { playSound('menu-tab'); switchTab(tab); }}
              >
                <div className={`${retro.keycapBase} ${retro.sizeWide}`}>
                  <div className={retro.keycapTop}>
                    <span className={retro.keyLabel}>{label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <button className={styles.playButton} onClick={handlePlay}>
          <div className={styles.playArm}>
            <div className={styles.playArmTop} />
          </div>
          <div className={styles.playBody}>
            <div className={styles.playBodyTop}>Play</div>
          </div>
        </button>
      </div>
    </div>
  );
}
