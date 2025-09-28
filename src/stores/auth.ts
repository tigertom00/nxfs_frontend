import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  authAPI,
  usersAPI,
  setAuthTokens,
  clearAuthTokens,
  getAccessToken,
} from '@/lib/api';
import { handleApiError, showSuccessToast } from '@/lib/error-handler';

interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  profile_picture?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      initialize: async () => {
        const { isInitialized, user } = get();
        if (isInitialized) return;

        // Zustand persist will restore user and isAuthenticated automatically
        const token = getAccessToken();
        if (token && !user) {
          try {
            set({ isLoading: true, error: null });
            const userData = await usersAPI.getCurrentUser();
            // Handle both array and paginated response formats
            const apiUser = Array.isArray(userData) ? userData[0] : userData.results?.[0];
            set({
              user: apiUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isInitialized: true,
            });

            // Load theme preference from user data
            if (apiUser && typeof window !== 'undefined') {
              const { useUIStore } = await import('./ui');
              const { loadThemeFromUser } = useUIStore.getState();
              loadThemeFromUser(apiUser);
            }
          } catch (error: any) {
            clearAuthTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              isInitialized: true,
            });
          }
        } else {
          // If user is already present (from persist), just mark initialized
          set({ isInitialized: true });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authAPI.login({ email, password });
          const { access, refresh } = response;

          setAuthTokens(access, refresh);

          const userData = await usersAPI.getCurrentUser();
          // Handle both array and paginated response formats
          const user = Array.isArray(userData) ? userData[0] : userData.results?.[0];

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isInitialized: true,
          });

          // Load theme preference from user data
          if (user && typeof window !== 'undefined') {
            const { useUIStore } = await import('./ui');
            const { loadThemeFromUser } = useUIStore.getState();
            loadThemeFromUser(user);
          }

          if (user) {
            showSuccessToast(
              `Welcome back, ${user.display_name || user.username}!`
            );
          }
        } catch (error: any) {
          const apiError = handleApiError(error, 'Login');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: apiError.message,
            isInitialized: true,
          });
          throw error;
        }
      },

      logout: () => {
        clearAuthTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
        showSuccessToast('Successfully logged out');
      },

      getCurrentUser: async () => {
        try {
          const { isAuthenticated } = get();

          if (!isAuthenticated) {
            return;
          }

          set({ isLoading: true, error: null });

          const userData = await usersAPI.getCurrentUser();
          // Handle both array and paginated response formats
          const user = Array.isArray(userData) ? userData[0] : userData.results?.[0];

          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.detail || 'Failed to get user data';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          // Clear tokens if user data fetch fails
          clearAuthTokens();
        }
      },

      updateUser: async (userData: any) => {
        try {
          const { user } = get();

          if (!user) {
            throw new Error('No user logged in');
          }

          set({ isLoading: true, error: null });

          const updatedUser = await usersAPI.updateUser(user.id, userData);

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });

          showSuccessToast('Profile updated successfully');
        } catch (error: any) {
          const apiError = handleApiError(error, 'Updating profile');
          set({
            isLoading: false,
            error: apiError.message,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
