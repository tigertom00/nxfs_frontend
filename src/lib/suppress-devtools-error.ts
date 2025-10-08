/**
 * Suppresses React DevTools semver validation error
 * This is a known issue with React 19 and older React DevTools versions
 * See: https://github.com/facebook/react/issues/28668
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Check if this is the React DevTools semver error
    const errorString = args[0]?.toString() || '';
    const stack = args[0]?.stack?.toString() || '';

    // Suppress specific React DevTools errors
    const devToolsErrors = [
      'Invalid argument not valid semver',
      'validateAndParse',
      'registerRendererInterface',
      'react_devtools_backend',
    ];

    const shouldSuppress = devToolsErrors.some(
      (err) => errorString.includes(err) || stack.includes(err)
    );

    if (shouldSuppress) {
      // Silently ignore these errors
      return;
    }

    // Pass through all other errors
    originalError(...args);
  };
}

export {};
