/** Font family constants and readiness check for the board message card. */

export const CARD_TITLE_FONT = "'Bungee', Impact, sans-serif";
export const CARD_BODY_FONT = "'Space Grotesk', 'Inter', system-ui, sans-serif";

let _fontsLoaded = false;

/**
 * Synchronous check whether Bungee and Space Grotesk are available.
 * Uses document.fonts.check() — returns true once fonts are loaded.
 * Result is cached after first success (fonts don't unload).
 */
export function areCardFontsLoaded(): boolean {
  if (_fontsLoaded) return true;
  try {
    const titleReady = document.fonts.check("16px 'Bungee'");
    const bodyReady = document.fonts.check("16px 'Space Grotesk'");
    _fontsLoaded = titleReady && bodyReady;
  } catch {
    // fonts API not available — fall back to false
  }
  return _fontsLoaded;
}
