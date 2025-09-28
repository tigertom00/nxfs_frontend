import axios, { AxiosError, AxiosResponse } from 'axios';
import { env } from '@/lib/env';
import { useAuthStore } from '@/stores';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401/403 errors (unauthorized/forbidden)
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { refreshToken } = useAuthStore.getState();
        if (refreshToken) {
          // Use the auth store's refresh method
          await useAuthStore.getState().refreshUserToken();

          // Retry the original request with new token
          const newToken = useAuthStore.getState().token;
          if (newToken) {
            originalRequest.headers.Authorization = `${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        console.log('No refresh token available, redirecting to login.');
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
        return Promise.reject(refreshError);
      }
    }

    // Only show error toast if it's not a 401/403 that we just handled with token refresh
    if (
      !originalRequest.url?.includes('/auth/token/refresh/') &&
      !(error.response?.status === 401 || error.response?.status === 403)
    ) {
      // Import error handler dynamically to avoid circular dependencies
      const { handleApiError } = await import('./shared/error-handler');
      handleApiError(
        error,
        `API ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`
      );
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api;