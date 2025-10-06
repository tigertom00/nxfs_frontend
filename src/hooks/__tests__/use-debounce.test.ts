import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 500ms
    jest.advanceTimersByTime(500);

    // Wait for the debounced value to update
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Rapidly update values
    rerender({ value: 'first', delay: 500 });
    jest.advanceTimersByTime(200);

    rerender({ value: 'second', delay: 500 });
    jest.advanceTimersByTime(200);

    rerender({ value: 'third', delay: 500 });

    // Value should still be initial (no timeout completed yet)
    expect(result.current).toBe('initial');

    // Fast-forward by 500ms
    jest.advanceTimersByTime(500);

    // Should only update to the last value
    await waitFor(() => {
      expect(result.current).toBe('third');
    });
  });

  it('should work with different data types', async () => {
    // Test with number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    rerenderNumber({ value: 42, delay: 300 });
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(numberResult.current).toBe(42);
    });

    // Test with object
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: { name: 'initial' }, delay: 300 },
      }
    );

    const newObject = { name: 'updated' };
    rerenderObject({ value: newObject, delay: 300 });
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(objectResult.current).toEqual(newObject);
    });
  });

  it('should handle delay changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Update value with new delay
    rerender({ value: 'updated', delay: 1000 });

    // Fast-forward by 500ms (old delay)
    jest.advanceTimersByTime(500);

    // Should not update yet (new delay is 1000ms)
    expect(result.current).toBe('initial');

    // Fast-forward remaining 500ms
    jest.advanceTimersByTime(500);

    // Now it should update
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should handle zero delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    );

    rerender({ value: 'updated', delay: 0 });

    // With zero delay, should update immediately after timeout executes
    jest.advanceTimersByTime(0);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });
});
