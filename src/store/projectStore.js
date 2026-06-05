import { create } from 'zustand';

const initialFilters = {
  search: '',
  status: 'all',
  segment: 'all',
  priority: 'all',
  sort: 'oldest',
};

export const useProjectStore = create((set) => ({
  filters: initialFilters,
  selectedProjectId: null,
  formMode: null,
  formRecord: null,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  resetFilters: () => set({ filters: { ...initialFilters } }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  openProjectForm: (formMode = 'create', formRecord = null) => set({ formMode, formRecord }),
  closeProjectForm: () => set({ formMode: null, formRecord: null }),
}));
