import { create } from 'zustand';

function readTheme() {
  try {
    return localStorage.getItem('pg-theme') || 'dark';
  } catch {
    return 'dark';
  }
}

function writeTheme(theme) {
  try {
    localStorage.setItem('pg-theme', theme);
  } catch {
    // ignore storage failures
  }
}

export const useUiStore = create((set) => ({
  theme: readTheme(),
  sidebarOpen: false,
  sidebarCollapsed: false,
  mobileSearchOpen: false,
  setTheme: (theme) => {
    writeTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark';
      writeTheme(theme);
      return { theme };
    }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSearchOpen: (mobileSearchOpen) => set({ mobileSearchOpen }),
}));
