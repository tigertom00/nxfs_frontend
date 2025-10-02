// Base API response types for type-safe API calls

/**
 * User profile information
 * Returned by all memo endpoints for user tracking
 */
export interface UserBasic {
  id: number;
  username: string;
  display_name: string;
  email: string;
  phone: string;
  profile_picture: string | null;
}

/**
 * Detailed user profile with additional fields
 */
export interface UserDetail extends UserBasic {
  first_name: string;
  last_name: string;
  full_name: string;
  clerk_profile_image_url: string | null;
}

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
 * Standardized API Error response format
 * Used across all endpoints for consistent error handling
 */
export interface APIError {
  error: {
    code: string; // Machine-readable error code
    message: string; // User-friendly message
    details?: any; // Additional error context
    field_errors?: {
      // For validation errors
      [field: string]: string[];
    };
  };
  timestamp: string;
  request_id: string; // For debugging
}

/**
 * Legacy error interface - keep for backward compatibility
 * @deprecated Use APIError instead
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
 * Bulk operation responses from new backend APIs
 */
export interface BulkUpdateResponse {
  updated_count: number;
  failed_updates: Array<{
    id: number;
    error: string;
  }>;
}

export interface BulkDeleteResponse {
  deleted_count: number;
  failed_deletes: number[];
}

/**
 * Legacy bulk operation response - keep for backward compatibility
 * @deprecated Use BulkUpdateResponse or BulkDeleteResponse instead
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
  chat_session_id?: string; // For N8N chatbot session management
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

/**
 * Performance monitoring interfaces
 */
export interface PerformanceMetrics {
  system: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  database: {
    vendor: string;
    connections?: number;
    query_cache_hit_rate?: number;
  };
  cache: {
    cache_working: boolean;
    hit_rate?: number;
  };
  api_summary: {
    total_requests: number;
    avg_response_time: number;
    max_response_time: number;
    slow_requests: number;
  };
}

/**
 * Health monitoring interfaces
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: string;
    cache: string;
    cpu: string;
    memory: string;
    disk: string;
  };
}

/**
 * Response headers for performance tracking
 */
export interface ResponseHeaders {
  'X-Response-Time': string; // e.g., "0.125s"
  'X-DB-Queries': string; // e.g., "3"
}
