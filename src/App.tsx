import { useEffect } from 'react'
import { GameboardCanvas } from './gameboard/canvas/index.ts'
import { SimulationControls } from './ui/controls/SimulationControls.tsx'
import { NavigationBar } from './ui/controls/NavigationBar.tsx'
import { CompletionCeremony } from './ui/puzzle/CompletionCeremony.tsx'
import { ZoomTransition } from './ui/puzzle/ZoomTransition.tsx'
import { PaletteModal, ParameterPopover, ContextMenu, WaveformSelectorOverlay, LevelSelectOverlay, SavePuzzleDialog, NodeCreationForm } from './ui/overlays/index.ts'
import { PortConstantInput } from './ui/controls/PortConstantInput.tsx'
import { useGameStore } from './store/index.ts'
import type { GameboardState, NodeState } from './shared/types/index.ts'
import { createCreativeSlotNode } from './puzzle/connection-point-nodes.ts'
import { CREATIVE_SLOT_COUNT } from './store/slices/creative-slice.ts'
import { StartScreen } from './ui/screens/index.ts'
import { DevTools } from './dev/index.ts'

/** Create a gameboard with creative slot nodes (left=input, right=output) */
function createCreativeGameboard(): GameboardState {
  const nodes = new Map<string, NodeState>();

  // Left slots (0-2) are inputs (emit signals), right slots (3-5) are outputs (receive signals)
  for (let i = 0; i < CREATIVE_SLOT_COUNT; i++) {
    const direction = i < 3 ? 'input' : 'output';
    const node = createCreativeSlotNode(i, direction);
    nodes.set(node.id, node);
  }

  return { id: 'creative-mode', nodes, wires: [] };
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
    // Build meters from saved slots
    const buildMeterConfig = (slots: typeof saved.slots) => ({
      left: slots.slice(0, 3).map((s) => ({
        active: true,
        direction: s.direction === 'off' ? 'input' as const : s.direction,
      })),
      right: slots.slice(3, 6).map((s) => ({
        active: true,
        direction: s.direction === 'off' ? 'output' as const : s.direction,
      })),
    });
    store.initializeMeters(buildMeterConfig(saved.slots), 'active');
  } else {
    // Fresh creative mode
    store.setActiveBoard(createCreativeGameboard());
    store.initializeMeters({
      left: [
        { active: true, direction: 'input' },
        { active: true, direction: 'input' },
        { active: true, direction: 'input' },
      ],
      right: [
        { active: true, direction: 'output' },
        { active: true, direction: 'output' },
        { active: true, direction: 'output' },
      ],
    }, 'active');
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
      store.initializeMeters({
        left: [
          { active: true, direction: 'input' },
          { active: true, direction: 'input' },
          { active: true, direction: 'input' },
        ],
        right: [
          { active: true, direction: 'output' },
          { active: true, direction: 'output' },
          { active: true, direction: 'output' },
        ],
      }, 'active');

      // Show start screen overlay
      store.openOverlay({ type: 'start-screen' });
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameboardCanvas />
      <NavigationBar />
      <SimulationControls />
      <PortConstantInput />
      <PaletteModal />
      <ParameterPopover />
      <ContextMenu />
      <WaveformSelectorOverlay />
      <LevelSelectOverlay />
      <SavePuzzleDialog />
      <NodeCreationForm />
      <StartScreen />
      <ZoomTransition />
      <CompletionCeremony />
      {import.meta.env.DEV && <DevTools />}
    </div>
  )
}

export default App
