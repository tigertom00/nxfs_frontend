'use client';

import { useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import BlogPosts from '@/components/blog-posts';
import ChatBot from '@/components/chat/chatbot';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
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
    document.documentElement.classList.add(theme);
    
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
            <h1 className="text-4xl font-bold mb-4">
              {t('home.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('home.subtitle')}
            </p>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">
                {t('home.blogTranslation')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('home.blogTranslationDesc')}
              </p>
            </div>
          </div>
          <BlogPosts />
        </div>
      </main>
      {isAuthenticated && <ChatBot />}
    </div>
  );
}