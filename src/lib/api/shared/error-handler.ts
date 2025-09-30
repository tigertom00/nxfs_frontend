import { toast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';
import { ApiError, APIError } from './types';

export class ErrorHandler {
  static handle(error: unknown, context?: string): ApiError | APIError {
    console.error(`Error in ${context}:`, error);

    if (error instanceof AxiosError) {
      // Check if response follows new standardized APIError format
      if (error.response?.data?.error?.code) {
        const standardizedError: APIError = error.response.data as APIError;
        this.showStandardizedToast(standardizedError, context);
        return standardizedError;
      }

      // Fall back to legacy ApiError format
      const legacyError: ApiError = {
        detail: error.response?.data?.detail || error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      };

      this.showLegacyToast(legacyError, context);
      return legacyError;
    }

    const genericError: ApiError = {
      detail:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    };

    this.showLegacyToast(genericError, context);
    return genericError;
  }

  // Handle new standardized APIError format
  private static showStandardizedToast(error: APIError, context?: string) {
    const title = this.getErrorTitleFromCode(error.error.code);
    const description = context
      ? `${context}: ${error.error.message}`
      : error.error.message;

    // Log request ID for debugging
    console.error(
      `API Error [${error.error.code}] Request ID: ${error.request_id}`
    );

    // Show field-level validation errors if present
    if (error.error.field_errors) {
      Object.entries(error.error.field_errors).forEach(([field, errors]) => {
        console.error(`${field}: ${errors.join(', ')}`);
      });
    }

    toast({
      variant: 'destructive',
      title,
      description,
      duration: 5000,
    });
  }

  // Handle legacy ApiError format
  private static showLegacyToast(error: ApiError, context?: string) {
    const title = 'Error';
    const description = context ? `${context}: ${error.detail}` : error.detail;

    toast({
      variant: 'destructive',
      title,
      description,
      duration: 5000,
    });
  }

  private static getErrorTitleFromCode(code: string): string {
    switch (code) {
      case 'AUTHENTICATION_REQUIRED':
        return 'Authentication Required';
      case 'PERMISSION_DENIED':
        return 'Access Denied';
      case 'VALIDATION_ERROR':
        return 'Validation Error';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too Many Requests';
      case 'RESOURCE_NOT_FOUND':
        return 'Not Found';
      case 'INTERNAL_SERVER_ERROR':
        return 'Server Error';
      default:
        return 'Error';
    }
  }

  private static getErrorTitle(status?: number): string {
    switch (status) {
      case 400:
        return 'Invalid Request';
      case 401:
        return 'Authentication Required';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      default:
        return 'Error';
    }
  }
}

// Helper functions for common scenarios
export const handleApiError = (error: unknown, context?: string) =>
  ErrorHandler.handle(error, context);

// Utility to check if error is the new standardized format
export const isStandardizedError = (error: any): error is APIError => {
  return error?.error?.code && error?.error?.message && error?.request_id;
};

// Extract field errors for form validation
export const getFieldErrors = (error: APIError): Record<string, string[]> => {
  return error.error.field_errors || {};
};

// Check for specific error codes
export const isAuthenticationError = (error: APIError | ApiError): boolean => {
  if (isStandardizedError(error)) {
    return error.error.code === 'AUTHENTICATION_REQUIRED';
  }
  return false;
};

export const isRateLimitError = (error: APIError | ApiError): boolean => {
  if (isStandardizedError(error)) {
    return error.error.code === 'RATE_LIMIT_EXCEEDED';
  }
  return false;
};

export const isValidationError = (error: APIError | ApiError): boolean => {
  if (isStandardizedError(error)) {
    return error.error.code === 'VALIDATION_ERROR';
  }
  return false;
};

export const showSuccessToast = (message: string, title = 'Success') => {
  toast({
    title,
    description: message,
    duration: 3000,
  });
};

export const showErrorToast = (message: string, title = 'Error') => {
  toast({
    variant: 'destructive',
    title,
    description: message,
    duration: 5000,
  });
};
