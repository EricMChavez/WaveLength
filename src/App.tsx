import { useEffect } from 'react'
import { GameboardCanvas } from './gameboard/canvas/index.ts'
import { SimulationControls } from './ui/controls/SimulationControls.tsx'
import { GameboardButtons } from './ui/controls/GameboardButtons.tsx'
import { CompletionCeremony } from './ui/puzzle/CompletionCeremony.tsx'
import { ZoomTransition } from './ui/puzzle/ZoomTransition.tsx'
import { PaletteModal, ParameterPopover, ContextMenu, WaveformSelectorOverlay, LevelSelectOverlay, SavePuzzleDialog, NodeCreationForm, SaveCancelDialog } from './ui/overlays/index.ts'
import { PortConstantInput } from './ui/controls/PortConstantInput.tsx'
import { useGameStore } from './store/index.ts'
import type { GameboardState } from './shared/types/index.ts'
import { StartScreen } from './ui/screens/index.ts'
import { DevTools } from './dev/index.ts'

/** Create an empty creative mode gameboard (slot nodes added when user configures CPs) */
function createCreativeGameboard(): GameboardState {
  return { id: 'creative-mode', nodes: new Map(), wires: [] };
}

/** Initialize creative mode gameboard and meters. If saved state exists, restore it. */
export function initializeCreativeMode(): void {
  const store = useGameStore.getState();
  const saved = store.savedCreativeState;

  // Enter creative mode — this restores saved slots if available
  store.enterCreativeMode();

  if (saved) {
    // Restore saved board and port constants
    store.restoreBoard(saved.board, saved.portConstants);
    // Build SlotConfig from saved slot directions
    const slotConfig = saved.slots.map((s, i) => ({
      active: s.direction !== 'off',
      direction: s.direction === 'off' ? (i < 3 ? 'input' as const : 'output' as const) : s.direction,
    })) as unknown as import('./puzzle/types.ts').SlotConfig;
    store.initializeMeters(slotConfig, 'off');
  } else {
    // Fresh creative mode — all 6 meters start as 'off'
    store.setActiveBoard(createCreativeGameboard());
    store.initializeMeters([
      { active: false, direction: 'input' },
      { active: false, direction: 'input' },
      { active: false, direction: 'input' },
      { active: false, direction: 'output' },
      { active: false, direction: 'output' },
      { active: false, direction: 'output' },
    ], 'off');
  }
}

function App() {
  useEffect(() => {
    const store = useGameStore.getState();

    // On first load, show start screen
    if (!store.activeBoard) {
      // Initialize a dormant creative mode board in the background
      store.enterCreativeMode();
      store.setActiveBoard(createCreativeGameboard());
      store.initializeMeters([
        { active: false, direction: 'input' },
        { active: false, direction: 'input' },
        { active: false, direction: 'input' },
        { active: false, direction: 'output' },
        { active: false, direction: 'output' },
        { active: false, direction: 'output' },
      ], 'off');

      // Show start screen overlay
      store.openOverlay({ type: 'start-screen' });
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameboardCanvas />
      <GameboardButtons />
      <SimulationControls />
      <PortConstantInput />
      <PaletteModal />
      <ParameterPopover />
      <ContextMenu />
      <WaveformSelectorOverlay />
      <LevelSelectOverlay />
      <SavePuzzleDialog />
      <SaveCancelDialog />
      <NodeCreationForm />
      <StartScreen />
      <ZoomTransition />
      <CompletionCeremony />
      {/* {import.meta.env.DEV && <DevTools />} */}
    </div>
  )
}

export default App
