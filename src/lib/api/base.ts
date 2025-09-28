import axios, { AxiosError, AxiosResponse } from 'axios';
import { env } from '@/lib/env';
import { useAuthStore } from '@/stores';
import { getAccessToken, getRefreshToken } from './shared/utils';

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
    const token = getAccessToken();
    if (token) {
      // JWT tokens use "Bearer" prefix
      config.headers.Authorization = `Bearer ${token}`;
    } else if (env.NEXT_PUBLIC_API_TOKEN) {
      // Fallback to environment API token if no user token
      config.headers.Authorization = env.NEXT_PUBLIC_API_TOKEN;
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
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          // Import auth API dynamically to avoid circular dependencies
          const { authAPI } = await import('./auth/auth');
          const response = await authAPI.refreshToken(refreshToken);

          // Update tokens in localStorage
          const { setAuthTokens } = await import('./shared/utils');
          setAuthTokens(response.access, refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        console.log('Token refresh failed, redirecting to login.');
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