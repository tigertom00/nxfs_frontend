'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores';

export function ThemeInitializer() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    // Apply the current theme to the document on component mount
    // This ensures the theme is applied even if the store hasn't initialized yet
    document.documentElement.classList.remove('light', 'dark', 'purple');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Subscribe to theme changes and apply them
  useEffect(() => {
    const unsubscribe = useUIStore.subscribe(
      (state) => state.theme,
      (newTheme) => {
        document.documentElement.classList.remove('light', 'dark', 'purple');
        document.documentElement.classList.add(newTheme);
      }
    );

    return unsubscribe;
  }, []);

  // This component doesn't render anything, it just handles theme initialization
  return null;
}