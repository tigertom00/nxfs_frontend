import { toast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  field?: string;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): ApiError {
    console.error(`Error in ${context}:`, error);

    if (error instanceof AxiosError) {
      const apiError: ApiError = {
        message: error.response?.data?.detail || error.message,
        status: error.response?.status,
        code: error.code,
      };

      this.showToast(apiError, context);
      return apiError;
    }

    const genericError: ApiError = {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };

    this.showToast(genericError, context);
    return genericError;
  }

  private static showToast(error: ApiError, context?: string) {
    const title = this.getErrorTitle(error.status);
    const description = context
      ? `${context}: ${error.message}`
      : error.message;

    toast({
      variant: 'destructive',
      title,
      description,
      duration: 5000,
    });
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