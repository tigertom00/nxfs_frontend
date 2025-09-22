import { useState, useEffect, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Hook for handling async operations with loading and error states
 * Simpler than useApi, good for one-off async operations
 *
 * @param asyncFunction - The async function to execute
 * @param immediate - Whether to execute immediately on mount
 * @returns Object with data, loading state, error, execute function, and reset function
 *
 * @example
 * const { data, isLoading, error, execute } = useAsync(
 *   () => fetch('/api/data').then(res => res.json()),
 *   true // Execute immediately
 * );
 *
 * @example
 * const { isLoading, execute: handleSubmit } = useAsync(async () => {
 *   await submitForm(formData);
 *   router.push('/success');
 * });
 */
export function useAsync<T = any>(
  asyncFunction: () => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await asyncFunction();
      setState({
        data: result,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}
