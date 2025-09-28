import { PaginatedResponse } from './types';

/**
 * Create URL with query parameters
 * Handles object to URLSearchParams conversion
 */
export function createUrlWithParams(
  baseUrl: string,
  params?: Record<string, any>
): string {
  if (!params) return baseUrl;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Normalize API response to handle both array and paginated responses
 */
export function normalizeResponse<T>(data: any): T[] | PaginatedResponse<T> {
  // If response has pagination structure, return it as is
  if (data && typeof data === 'object' && 'results' in data) {
    return data as PaginatedResponse<T>;
  }

  // Otherwise return as simple array
  return Array.isArray(data) ? data : [];
}

/**
 * Extract pagination info from Django REST response
 */
export function extractPaginationInfo(response: any) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const { count, next, previous, results } = response;

  if (typeof count !== 'undefined' && Array.isArray(results)) {
    return {
      count,
      next,
      previous,
      results,
    };
  }

  return null;
}

/**
 * Convert object to FormData for multipart requests
 */
export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        // Handle array fields - Django expects repeated field names
        value.forEach((item) => {
          formData.append(key, String(item));
        });
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return formData;
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/**
 * Set authentication tokens in localStorage
 */
export function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Clear authentication tokens from localStorage
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Check if response indicates authentication error
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.response?.status === 403;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}