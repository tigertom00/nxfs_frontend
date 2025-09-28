'use client';

import { useEffect } from 'react';
import Navbar from '@/components/layouts/navbar';
import BlogPosts from '@/components/features/blog/blog-posts';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore, useUIStore } from '@/stores';
import { useIntl } from '@/hooks/use-intl';

export default function Home() {
  const { isAuthenticated, getCurrentUser, initialize } = useAuthStore();
  const { theme } = useUIStore();
  const { t } = useIntl();

  useEffect(() => {
    // Initialize auth state
    initialize();

    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    if (theme) {
      document.documentElement.classList.add(theme);
    }

    // Get user data if authenticated
    if (isAuthenticated) {
      getCurrentUser();
    }
  }, [initialize, isAuthenticated, getCurrentUser, theme]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">{t('home.title')}</h1>
            <p className="text-xl text-muted-foreground">
              {t('home.subtitle')}
            </p>
          </div>
          <BlogPosts />
        </div>
      </main>
      {isAuthenticated && <ChatBot />}
    </div>
  );
}
