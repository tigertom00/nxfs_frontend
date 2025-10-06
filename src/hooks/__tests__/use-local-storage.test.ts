import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../use-local-storage';
import { mockLocalStorage } from '../../__tests__/utils/test-utils';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Replace global localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('initial-value');
  });

  it('should return stored value from localStorage', () => {
    mockLocalStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(mockLocalStorage.getItem('test-key')).toBe(
      JSON.stringify('new-value')
    );
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(6);
    expect(mockLocalStorage.getItem('test-key')).toBe('6');
  });

  it('should work with complex objects', () => {
    const initialObject = { name: 'John', age: 30, active: true };
    const { result } = renderHook(() =>
      useLocalStorage('test-key', initialObject)
    );

    expect(result.current[0]).toEqual(initialObject);

    const updatedObject = { name: 'Jane', age: 25, active: false };
    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    const storedValue = mockLocalStorage.getItem('test-key');
    expect(storedValue).not.toBeNull();
    expect(JSON.parse(storedValue as string)).toEqual(updatedObject);
  });

  it('should work with arrays', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() =>
      useLocalStorage('test-key', initialArray)
    );

    expect(result.current[0]).toEqual(initialArray);

    act(() => {
      result.current[1]([...initialArray, 4, 5]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock localStorage.getItem to throw an error
    const originalGetItem = mockLocalStorage.getItem;
    mockLocalStorage.getItem = () => {
      throw new Error('Storage error');
    };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback-value')
    );

    expect(result.current[0]).toBe('fallback-value');
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore original method
    mockLocalStorage.getItem = originalGetItem;
    consoleErrorSpy.mockRestore();
  });

  it('should handle JSON parse errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Store invalid JSON
    mockLocalStorage.setItem('test-key', 'invalid-json{{{');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback-value')
    );

    expect(result.current[0]).toBe('fallback-value');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle multiple instances with same key', () => {
    const { result: result1 } = renderHook(() =>
      useLocalStorage('shared-key', 'initial')
    );
    // Second instance for demonstration
    renderHook(() => useLocalStorage('shared-key', 'initial'));

    act(() => {
      result1.current[1]('updated');
    });

    // First hook should have updated value
    expect(result1.current[0]).toBe('updated');

    // Note: Second hook won't automatically sync unless we implement
    // storage event listeners (which is a potential enhancement)
    // For now, both hooks will have independent state after initialization
  });

  it('should work with boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(mockLocalStorage.getItem('test-key')).toBe('true');
  });

  it('should work with null values', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string | null>('test-key', null)
    );

    expect(result.current[0]).toBe(null);

    act(() => {
      result.current[1]('value');
    });

    expect(result.current[0]).toBe('value');

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe(null);
    expect(mockLocalStorage.getItem('test-key')).toBe('null');
  });
});
