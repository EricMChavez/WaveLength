import { useEffect } from 'react'
import { GameboardCanvas } from './gameboard/canvas/index.ts'
import { PalettePanel } from './palette/components/PalettePanel.tsx'
import { NodeControls } from './ui/controls/NodeControls.tsx'
import { PortConstantInput } from './ui/controls/PortConstantInput.tsx'
import { SimulationControls } from './ui/controls/SimulationControls.tsx'
import { PuzzleInfoBar } from './ui/puzzle/PuzzleInfoBar.tsx'
import { useGameStore } from './store/index.ts'
import type { GameboardState } from './shared/types/index.ts'
import { createPuzzleGameboard } from './puzzle/puzzle-gameboard.ts'
import { PUZZLE_LEVELS } from './puzzle/levels/index.ts'

function createEmptyGameboard(): GameboardState {
  return { id: 'main', nodes: new Map(), wires: [] }
}

function App() {
  useEffect(() => {
    if (!useGameStore.getState().activeBoard) {
      const store = useGameStore.getState()
      // Load the first tutorial puzzle by default
      const firstPuzzle = PUZZLE_LEVELS[0]
      if (firstPuzzle) {
        store.loadPuzzle(firstPuzzle)
        store.setActiveBoard(createPuzzleGameboard(firstPuzzle))
      } else {
        store.setActiveBoard(createEmptyGameboard())
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <PalettePanel />
      <div style={{ flex: 1, position: 'relative' }}>
        <GameboardCanvas />
        <PuzzleInfoBar />
        <NodeControls />
        <PortConstantInput />
        <SimulationControls />
      </div>
    </div>
  )
}

export default App
