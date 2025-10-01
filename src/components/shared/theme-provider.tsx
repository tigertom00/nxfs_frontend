'use client';

import { useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/stores';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isInitialized } = useAuthStore();
  const { initializeTheme, loadThemeFromUser } = useUIStore();

  useEffect(() => {
    // Initialize theme on mount
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    // Load theme from user when user data is available
    if (isInitialized && user) {
      loadThemeFromUser(user);
    }
  }, [isInitialized, user, loadThemeFromUser]);

  return <>{children}</>;
}
