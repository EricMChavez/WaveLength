import { useState, useEffect, useRef } from 'react';

const CHAR_DELAY_MS = 25;
const LINE_DELAY_MS = 80;
const FLASH_DELAY_MS = 150;

export interface TypewriterResult {
  lines: string[];
  cursorVisible: boolean;
  isTyping: boolean;
}

/**
 * Line-by-line typing animation driven by a generation counter.
 * On generation change: clear output, brief CRT "flash" delay, then type.
 * Respects prefers-reduced-motion: shows all content immediately.
 */
export function useTypewriter(
  contentLines: string[],
  generation: number,
  instantLineCount: number = 0,
): TypewriterResult {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const rafRef = useRef<number>(0);
  const reducedMotion = useRef(false);

  // Check reduced motion once on mount
  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    // Reduced motion: show everything immediately
    if (reducedMotion.current) {
      setVisibleLines([...contentLines]);
      setIsTyping(false);
      return;
    }

    // Reset on generation change
    setVisibleLines([]);
    setIsTyping(true);

    let cancelled = false;
    let lineIndex = 0;
    let charIndex = 0;
    let lastTime = 0;
    let accumulated = 0;
    let phase: 'flash' | 'typing' = 'flash';
    let flashStart = 0;
    let needLineDelay = false;

    function tick(time: number) {
      if (cancelled) return;

      if (phase === 'flash') {
        if (flashStart === 0) flashStart = time;
        if (time - flashStart < FLASH_DELAY_MS) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        phase = 'typing';
        lastTime = time;
      }

      const delta = time - lastTime;
      lastTime = time;
      accumulated += delta;

      // Type characters until we run out of accumulated time
      let changed = false;
      while (accumulated > 0 && lineIndex < contentLines.length) {
        const currentLine = contentLines[lineIndex];

        if (needLineDelay) {
          // Apply line delay once per line transition
          if (accumulated < LINE_DELAY_MS) break;
          accumulated -= LINE_DELAY_MS;
          needLineDelay = false;
        }

        if (lineIndex < instantLineCount && charIndex === 0) {
          // Instant line: reveal whole line at once (line delay already applied above)
          charIndex = currentLine.length;
          changed = true;
        } else if (charIndex < currentLine.length) {
          // Type one character
          if (accumulated < CHAR_DELAY_MS) break;
          accumulated -= CHAR_DELAY_MS;
          charIndex++;
          changed = true;
        } else {
          // Line complete, move to next
          lineIndex++;
          charIndex = 0;
          needLineDelay = true;
          changed = true;
        }
      }

      if (changed) {
        const result: string[] = [];
        for (let i = 0; i < lineIndex && i < contentLines.length; i++) {
          result.push(contentLines[i]);
        }
        if (lineIndex < contentLines.length) {
          result.push(contentLines[lineIndex].slice(0, charIndex));
        }
        setVisibleLines(result);
      }

      if (lineIndex >= contentLines.length) {
        setIsTyping(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [generation, contentLines, instantLineCount]);

  return {
    lines: visibleLines,
    cursorVisible: true,
    isTyping,
  };
}
