import type { StateCreator } from 'zustand';
import type { MotherboardLayout } from '../motherboard-types.ts';

export interface MotherboardSlice {
  motherboardLayout: MotherboardLayout | null;

  setMotherboardLayout: (layout: MotherboardLayout) => void;
}

export const createMotherboardSlice: StateCreator<MotherboardSlice> = (set) => ({
  motherboardLayout: null,

  setMotherboardLayout: (layout) => set({ motherboardLayout: layout }),
});
