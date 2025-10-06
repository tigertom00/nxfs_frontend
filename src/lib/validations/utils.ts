/**
 * Form validation utilities and helpers
 * Provides common validation functions and error handling patterns
 */

import { ZodError, ZodSchema } from 'zod';
import { FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates data against a Zod schema and returns validation result
 */
export function validateWithSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ZodError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Safely validates data and returns parsed data or null
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Converts Zod errors to react-hook-form field errors format
 */
export function zodErrorsToFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (path) {
      fieldErrors[path] = err.message;
    }
  });

  return fieldErrors;
}

/**
 * Formats field errors for display in toast notifications
 */
export function formatFieldErrors(errors: FieldErrors): string {
  const errorMessages = Object.entries(errors)
    .map(([field, error]) => {
      const fieldName = field
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return `${fieldName}: ${error?.message || 'Invalid value'}`;
    })
    .join('\n');

  return errorMessages;
}

/**
 * Shows validation errors as toast notifications
 */
export function showValidationErrors(
  errors: FieldErrors,
  title = 'Validation Error'
): void {
  const errorMessage = formatFieldErrors(errors);

  toast.error(title, {
    description: errorMessage,
    duration: 5000,
  });
}

// ============================================================================
// FORM SUBMISSION HELPERS
// ============================================================================

export interface FormSubmitOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Wraps form submission with error handling and toast notifications
 */
export async function handleFormSubmit<TData, TResult>(
  submitFn: (data: TData) => Promise<TResult>,
  data: TData,
  options: FormSubmitOptions = {}
): Promise<TResult | null> {
  const {
    successMessage = 'Saved successfully',
    errorMessage = 'An error occurred',
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  try {
    const result = await submitFn(data);

    if (showSuccessToast) {
      toast.success(successMessage);
    }

    if (onSuccess) {
      onSuccess();
    }

    return result;
  } catch (error) {
    console.error('Form submission error:', error);

    if (showErrorToast) {
      const message =
        error instanceof Error ? error.message : errorMessage;
      toast.error(errorMessage, {
        description: message,
      });
    }

    if (onError && error instanceof Error) {
      onError(error);
    }

    return null;
  }
}

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Removes undefined and null values from an object
 */
export function cleanFormData<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  const cleaned: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });

  return cleaned as Partial<T>;
}

/**
 * Converts form data to FormData for multipart uploads
 */
export function toFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      if (value.every((item) => item instanceof File)) {
        // Multiple files
        value.forEach((file) => formData.append(key, file));
      } else {
        // Array of primitives - serialize as JSON
        formData.append(key, JSON.stringify(value));
      }
    } else if (typeof value === 'object') {
      // Nested object - serialize as JSON
      formData.append(key, JSON.stringify(value));
    } else {
      // Primitive values
      formData.append(key, String(value));
    }
  });

  return formData;
}

/**
 * Converts empty strings to null in form data
 */
export function emptyStringsToNull<T extends Record<string, unknown>>(
  data: T
): T {
  const converted: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    converted[key] = value === '' ? null : value;
  });

  return converted as T;
}

// ============================================================================
// FILE VALIDATION HELPERS
// ============================================================================

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  maxFiles?: number;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates file upload constraints
 */
export function validateFiles(
  files: File | File[],
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes,
    maxFiles,
  } = options;

  const fileArray = Array.isArray(files) ? files : [files];
  const errors: string[] = [];

  // Check file count
  if (maxFiles && fileArray.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} file(s) allowed`);
  }

  // Validate each file
  fileArray.forEach((file, index) => {
    const fileLabel =
      fileArray.length > 1 ? `File ${index + 1}` : 'File';

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      errors.push(`${fileLabel} exceeds maximum size of ${maxSizeMB}MB`);
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      const allowedTypesList = allowedTypes
        .map((type) => type.split('/')[1].toUpperCase())
        .join(', ');
      errors.push(
        `${fileLabel} has invalid type. Allowed types: ${allowedTypesList}`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// ASYNC VALIDATION HELPERS
// ============================================================================

/**
 * Debounced async validation for form fields
 */
export function createAsyncValidator<T>(
  validatorFn: (value: T) => Promise<boolean>,
  errorMessage: string,
  debounceMs = 500
) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (value: T): Promise<boolean | string> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const isValid = await validatorFn(value);
          resolve(isValid || errorMessage);
        } catch (error) {
          console.error('Async validation error:', error);
          resolve(errorMessage);
        }
      }, debounceMs);
    });
  };
}

// ============================================================================
// PASSWORD STRENGTH HELPERS
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  suggestions: string[];
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length === 0) {
    return { score: 0, label: 'Weak', suggestions: ['Password is required'] };
  }

  // Length check
  if (password.length >= 8) {score++;}
  if (password.length >= 12) {score++;}
  else {suggestions.push('Use at least 12 characters');}

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Use both uppercase and lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include special characters');
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, Math.floor((score / 5) * 4)));

  const labels: PasswordStrength['label'][] = [
    'Weak',
    'Fair',
    'Good',
    'Strong',
    'Very Strong',
  ];

  return {
    score,
    label: labels[score],
    suggestions,
  };
}
