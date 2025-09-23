import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usersAPI } from '@/lib/api';

interface UIState {
  theme: 'light' | 'dark' | 'purple' | 'pink' | 'system';
  language: 'en' | 'no';
  sidebarOpen: boolean;
  chatOpen: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'purple' | 'pink' | 'system') => void;
  getSystemTheme: () => 'light' | 'dark';
  getEffectiveTheme: () => 'light' | 'dark' | 'purple' | 'pink';
  syncThemeWithServer: (userId: string) => Promise<void>;
  loadThemeFromUser: (user: any) => void;
  setLanguage: (language: 'en' | 'no') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: 'en',
      sidebarOpen: false,
      chatOpen: false,

      getSystemTheme: () => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      },

      getEffectiveTheme: () => {
        const state = get();
        if (state.theme === 'system') {
          return state.getSystemTheme();
        }
        return state.theme as 'light' | 'dark' | 'purple' | 'pink';
      },

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        document.documentElement.classList.remove(
          'light',
          'dark',
          'purple',
          'pink'
        );
        const effectiveTheme =
          theme === 'system' ? get().getSystemTheme() : theme;
        document.documentElement.classList.add(effectiveTheme);

        // Listen for system theme changes when system theme is selected
        if (theme === 'system' && typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            if (get().theme === 'system') {
              document.documentElement.classList.remove(
                'light',
                'dark',
                'purple',
                'pink'
              );
              document.documentElement.classList.add(get().getSystemTheme());
            }
          };
          mediaQuery.addEventListener('change', handleChange);
        }

        // Sync with server if user is authenticated (async, don't wait)
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            try {
              const authData = JSON.parse(authStorage);
              if (authData.state?.isAuthenticated && authData.state?.user?.id) {
                get().syncThemeWithServer(authData.state.user.id);
              }
            } catch (error) {
              console.error('Failed to sync theme:', error);
            }
          }
        }
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

      loadThemeFromUser: (user) => {
        if (user && user.theme) {
          const theme = user.theme as
            | 'light'
            | 'dark'
            | 'purple'
            | 'pink'
            | 'system';
          set({ theme });
          // Apply theme to document
          document.documentElement.classList.remove(
            'light',
            'dark',
            'purple',
            'pink'
          );
          const effectiveTheme =
            theme === 'system' ? get().getSystemTheme() : theme;
          document.documentElement.classList.add(effectiveTheme);
        }
      },

      syncThemeWithServer: async (userId: string) => {
        try {
          const { theme } = get();
          await usersAPI.updateUser(userId, {
            theme: theme,
          });
        } catch (error) {
          console.error('Failed to sync theme with server:', error);
        }
      },
    }),
    {
      name: 'ui-storage',
    }
  )
);
