import { useState, useCallback } from 'react';
import { handleApiError } from '@/lib/error-handler';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

/**
 * Hook for handling API calls with loading, error, and success states
 * Automatically handles error display through the global error handler
 *
 * @param apiFunction - The API function to call
 * @param options - Configuration options
 * @returns Object with data, loading state, error, execute function, and reset function
 *
 * @example
 * const { data: tasks, isLoading, error, execute: fetchTasks } = useApi(tasksAPI.getTasks);
 *
 * // Call the API
 * useEffect(() => {
 *   fetchTasks();
 * }, []);
 *
 * @example
 * const { isLoading, execute: createTask } = useApi(tasksAPI.createTask, {
 *   onSuccess: () => refetchTasks(),
 *   showErrorToast: false // Disable automatic error toast
 * });
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    showErrorToast?: boolean;
  } = {}
): UseApiReturn<T> {
  const { onSuccess, onError, showErrorToast = true } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await apiFunction(...args);

        setState({
          data: result,
          isLoading: false,
          error: null,
        });

        onSuccess?.(result);
        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'An error occurred';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        // Only show error toast if not already handled by API interceptor
        // and if showErrorToast is true
        if (
          showErrorToast &&
          !error?.config?.url?.includes('/auth/token/refresh/')
        ) {
          handleApiError(error, 'API call');
        }

        onError?.(error);
        throw error;
      }
    },
    [apiFunction, onSuccess, onError, showErrorToast]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
