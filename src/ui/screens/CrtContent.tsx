import { useMemo } from 'react';
import { useGameStore } from '../../store/index.ts';
import { useTypewriter } from './useTypewriter.ts';
import { SettingsTerminal } from './SettingsTerminal.tsx';
import asciiArtRaw from '../../assets/ascii-wavelength.txt?raw';
import retro from './retro-shared.module.css';

const ASCII_ART_LINES = asciiArtRaw
  .split('\n')
  .map((l) => l.trimEnd())
  .filter((l, i, a) => !(i === a.length - 1 && l === ''));

const HOME_LINES = [
  'Beta v0.1',
  '[CRITICAL] Low signal!',
  '',
  '[WARNING] Use at your own risk. Side effects may',
  'include corrupted memories, delusions of',
  'insignificance, and dry mouth.',
];

const ABOUT_LINES = [
  '> ABOUT WAVELENGTH',
  '',
  'A recursive tool-building puzzle game',
  'about signal processing.',
  '',
  'Wire together nodes to transform input',
  'waveforms into target outputs.',
  '',
  'Every solved puzzle becomes a reusable',
  'node for future puzzles, creating a',
  'fractal, infinitely-nestable tool-building',
  'loop.',
  '',
  '7 fundamental nodes. Infinite possibilities.',
];

const SETTINGS_HEADER_LINES = [
  '> SYSTEM PREFERENCES',
  '',
];

export function CrtContent() {
  const activeScreen = useGameStore((s) => s.activeScreen);
  const generation = useGameStore((s) => s.tabSwitchGeneration);

  const instantLineCount = activeScreen === 'home' ? ASCII_ART_LINES.length : 0;

  const contentLines = useMemo(() => {
    switch (activeScreen) {
      case 'home': return [...ASCII_ART_LINES, ...HOME_LINES];
      case 'about': return ABOUT_LINES;
      case 'settings': return SETTINGS_HEADER_LINES;
      default: return [...ASCII_ART_LINES, ...HOME_LINES];
    }
  }, [activeScreen]);

  const { lines, cursorVisible, isTyping } = useTypewriter(contentLines, generation, instantLineCount);

  const asciiLines = instantLineCount > 0 ? lines.slice(0, instantLineCount) : [];
  const textLines = instantLineCount > 0 ? lines.slice(instantLineCount) : lines;

  return (
    <div className={retro.screenText}>
      {asciiLines.length > 0 && (
        <div className={retro.asciiArtWrap}>
          <pre className={retro.asciiArt}>{asciiLines.join('\n')}</pre>
        </div>
      )}
      {textLines.map((line, i) => (
        <div key={i}>{line || '\u00A0'}</div>
      ))}
      {activeScreen === 'settings' && !isTyping && (
        <SettingsTerminal />
      )}
      {activeScreen !== 'settings' && cursorVisible && !isTyping && (
        <span className={retro.cursorBlink} />
      )}
    </div>
  );
}
