import { create } from 'zustand';

// PUBLIC_INTERFACE
/**
 * Zustand store for UI state management.
 * Manages theme (dark/light), sidebar visibility, and modal states.
 */
const useUIStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  sidebarOpen: true,
  activeModal: null,
  
  // PUBLIC_INTERFACE
  /**
   * Toggle between dark and light themes.
   * Persists choice to localStorage and applies to document element.
   */
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    return { theme: newTheme };
  }),
  
  // PUBLIC_INTERFACE
  /**
   * Set theme explicitly.
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme: (theme) => set(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    return { theme };
  }),
  
  // PUBLIC_INTERFACE
  /**
   * Toggle sidebar open/closed state.
   */
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // PUBLIC_INTERFACE
  /**
   * Open a specific modal by name.
   * @param {string} modalName - Name of the modal to open
   */
  openModal: (modalName) => set({ activeModal: modalName }),
  
  // PUBLIC_INTERFACE
  /**
   * Close the currently active modal.
   */
  closeModal: () => set({ activeModal: null }),
}));

export default useUIStore;
