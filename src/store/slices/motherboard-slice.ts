import type { StateCreator } from 'zustand';
import type { MotherboardLayout } from '../motherboard-types.ts';

export interface MotherboardSlice {
  motherboardLayout: MotherboardLayout | null;

  setMotherboardLayout: (layout: MotherboardLayout) => void;
  setMotherboardPage: (page: number) => void;
  nextMotherboardPage: () => void;
  prevMotherboardPage: () => void;
}

export const createMotherboardSlice: StateCreator<MotherboardSlice> = (set, get) => ({
  motherboardLayout: null,

  setMotherboardLayout: (layout) => set({ motherboardLayout: layout }),

  setMotherboardPage: (page) => {
    const { motherboardLayout } = get();
    if (!motherboardLayout) return;
    const clamped = Math.max(0, Math.min(page, motherboardLayout.pagination.totalPages - 1));
    if (clamped === motherboardLayout.pagination.currentPage) return;
    set({
      motherboardLayout: {
        ...motherboardLayout,
        pagination: { ...motherboardLayout.pagination, currentPage: clamped },
      },
    });
  },

  nextMotherboardPage: () => {
    const { motherboardLayout } = get();
    if (!motherboardLayout) return;
    const next = motherboardLayout.pagination.currentPage + 1;
    if (next >= motherboardLayout.pagination.totalPages) return;
    set({
      motherboardLayout: {
        ...motherboardLayout,
        pagination: { ...motherboardLayout.pagination, currentPage: next },
      },
    });
  },

  prevMotherboardPage: () => {
    const { motherboardLayout } = get();
    if (!motherboardLayout) return;
    const prev = motherboardLayout.pagination.currentPage - 1;
    if (prev < 0) return;
    set({
      motherboardLayout: {
        ...motherboardLayout,
        pagination: { ...motherboardLayout.pagination, currentPage: prev },
      },
    });
  },
});
