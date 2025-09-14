import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark' | 'purple';
  language: 'en' | 'no';
  sidebarOpen: boolean;
  chatOpen: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'purple') => void;
  setLanguage: (language: 'en' | 'no') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      sidebarOpen: false,
      chatOpen: false,

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        document.documentElement.classList.remove('light', 'dark', 'purple');
        document.documentElement.classList.add(theme);
      },

      setLanguage: (language) => {
        set({ language });
        // Store language preference
        localStorage.setItem('language', language);
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleChat: () => {
        set((state) => ({ chatOpen: !state.chatOpen }));
      },

      setChatOpen: (open) => {
        set({ chatOpen: open });
      },
    }),
    {
      name: 'ui-storage',
    }
  )
);