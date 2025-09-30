import api from '../base';
import { handleApiError } from '../shared/error-handler';
import {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  RegisterPayload,
  RegisterResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from './types';

export const authAPI = {
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/token/', credentials);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Logging in');
      throw error;
    }
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
      const response = await api.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Refreshing token');
      throw error;
    }
  },

  register: async (userData: RegisterPayload): Promise<RegisterResponse> => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Registering user');
      throw error;
    }
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post('/auth/password/reset/', payload);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Requesting password reset');
      throw error;
    }
  },

  resetPassword: async (
    payload: ResetPasswordPayload
  ): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post('/auth/password/reset/confirm/', payload);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Resetting password');
      throw error;
    }
  },

  verifyToken: async (token: string): Promise<{ valid: boolean }> => {
    try {
      const response = await api.post('/auth/token/verify/', { token });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Verifying token');
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // If your API has a logout endpoint that blacklists the token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout/', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      // Don't throw on logout errors, just log them
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};
