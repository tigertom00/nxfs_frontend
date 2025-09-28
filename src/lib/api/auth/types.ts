import { User, LoginResponse, RefreshTokenResponse } from '../shared/types';

// User response types
export type GetCurrentUserResponse = User[];
export type UpdateUserResponse = User;

// Additional auth-specific types
export interface UpdateUserPayload {
  email?: string;
  username?: string;
  display_name?: string;
  profile_picture?: File | string;
  first_name?: string;
  last_name?: string;
  language?: 'en' | 'no';
  theme?: 'light' | 'dark' | 'purple' | 'pink' | 'system';
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// Re-export shared types for convenience
export type { User, LoginResponse, RefreshTokenResponse };