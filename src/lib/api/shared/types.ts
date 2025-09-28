// Base API response types for type-safe API calls

/**
 * Generic API response wrapper
 * Most of your API responses follow this pattern
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  timestamp?: string;
}

/**
 * Paginated response for list endpoints
 * Common in Django REST Framework APIs
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Enhanced pagination structure with additional metadata
 */
export interface PaginationMeta {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponseWithMeta<T> {
  pagination: PaginationMeta;
  links: {
    next?: string;
    previous?: string;
  };
  results: T[];
}

/**
 * Error response structure
 * Standardizes error handling across the API
 */
export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
  timestamp?: string;
}

/**
 * Search parameters base interface
 */
export interface BaseSearchParams {
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

/**
 * Choice item for dropdowns and selects
 */
export interface ChoiceItem {
  id: number;
  name: string;
  value?: string;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean;
  updated_count: number;
  failed_count?: number;
  errors?: string[];
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  filename: string;
  url: string;
  size: number;
  content_type: string;
  uploaded_at: string;
}

/**
 * User types based on your API structure
 */
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login?: string;
  language: 'en' | 'no';
  theme: 'light' | 'dark' | 'purple' | 'pink' | 'system';
  session_id?: string; // For chatbot session management
}

/**
 * Authentication response types
 */
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string; // Some APIs return new refresh token
}