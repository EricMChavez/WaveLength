import type { StateCreator } from 'zustand';

export interface SimulationSlice {
  /** Whether the signal simulation is running */
  simulationRunning: boolean;
  /** Set the simulation running state */
  setSimulationRunning: (running: boolean) => void;
}

export const createSimulationSlice: StateCreator<SimulationSlice> = (set) => ({
  simulationRunning: false,

  setSimulationRunning: (running) =>
    set({ simulationRunning: running }),
});
