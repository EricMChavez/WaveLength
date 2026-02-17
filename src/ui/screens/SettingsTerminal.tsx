import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';
import { getCurrentTheme, setTheme } from '../../shared/tokens/theme-manager.ts';
import { isMuted, setMuted } from '../../shared/audio/index.ts';
import retro from './retro-shared.module.css';

interface SettingOption {
  label: string;
  getValue: () => string;
  toggle: () => void;
}

export function SettingsTerminal() {
  const activeScreen = useGameStore((s) => s.activeScreen);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [, forceUpdate] = useState(0);

  const settings: SettingOption[] = [
    {
      label: 'THEME',
      getValue: () => getCurrentTheme() === 'dark' ? 'SIGNAL BENCH (DARK)' : 'STUDIO MONITOR (LIGHT)',
      toggle: () => {
        const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
        setTheme(next);
        forceUpdate((n) => n + 1);
      },
    },
    {
      label: 'AUDIO',
      getValue: () => isMuted() ? 'MUTED' : 'ENABLED',
      toggle: () => {
        setMuted(!isMuted());
        forceUpdate((n) => n + 1);
      },
    },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activeScreen !== 'settings') return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(settings.length - 1, i + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      settings[focusedIndex]?.toggle();
    }
  }, [activeScreen, focusedIndex, settings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  return (
    <div className={retro.screenText}>
      {settings.map((setting, i) => {
        const focused = i === focusedIndex;
        const prefix = focused ? '> ' : '  ';
        return (
          <div
            key={setting.label}
            onClick={() => {
              setFocusedIndex(i);
              setting.toggle();
            }}
            style={{
              cursor: 'pointer',
              color: focused ? '#33e8a0' : '#1a8860',
              textShadow: focused ? '0 0 4px rgba(51, 232, 160, 0.7)' : 'none',
            }}
          >
            {prefix}{setting.label.padEnd(9)}: {setting.getValue()}
          </div>
        );
      })}
      <div>&nbsp;</div>
      <div style={{ color: '#1a8860', fontSize: '14px' }}>
        {'  [ARROW KEYS] navigate  [ENTER] toggle'}
      </div>
    </div>
  );
}
