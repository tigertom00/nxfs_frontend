import { PaginatedResponse, BaseSearchParams, User } from '../shared/types';

// Admin user management types
export interface AdminUser extends User {
  is_superuser: boolean;
  groups?: string[];
  user_permissions?: string[];
  last_activity?: string;
}

// Admin user search and filter params
export interface AdminUserSearchParams extends BaseSearchParams {
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  registration_date_start?: string;
  registration_date_end?: string;
  search?: string; // Search by email, username, name
  groups?: string[];
}

// Admin user management payloads
export interface ResetPasswordPayload {
  new_password: string;
}

export interface ToggleActivePayload {
  is_active: boolean;
}

export interface UpdateUserPayload {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  groups?: string[];
}

// Response types
export type GetAdminUsersResponse = AdminUser[] | PaginatedResponse<AdminUser>;
export type GetAdminUserResponse = AdminUser;
export type UpdateAdminUserResponse = AdminUser;
export type ResetPasswordResponse = {
  success: boolean;
  message: string;
};
export type ToggleActiveResponse = AdminUser;
