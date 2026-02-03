import { useEffect } from 'react'
import { GameboardCanvas } from './gameboard/canvas/index.ts'
import { PalettePanel } from './palette/components/PalettePanel.tsx'
import { NodeControls } from './ui/controls/NodeControls.tsx'
import { PortConstantInput } from './ui/controls/PortConstantInput.tsx'
import { SimulationControls } from './ui/controls/SimulationControls.tsx'
import { useGameStore } from './store/index.ts'
import type { GameboardState } from './shared/types/index.ts'

function createEmptyGameboard(): GameboardState {
  return { id: 'main', nodes: new Map(), wires: [] }
}

function App() {
  useEffect(() => {
    if (!useGameStore.getState().activeBoard) {
      useGameStore.getState().setActiveBoard(createEmptyGameboard())
    }
  }, [])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <PalettePanel />
      <div style={{ flex: 1, position: 'relative' }}>
        <GameboardCanvas />
        <NodeControls />
        <PortConstantInput />
        <SimulationControls />
      </div>
    </div>
  )
}

export default App
