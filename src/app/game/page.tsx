'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore } from '@/stores';
import { motion } from 'framer-motion';
import MemoryGame from '@/components/features/game/memory-game';
import PacManGame from '@/components/features/game/pacman-game';
import { useIntl } from '@/hooks/use-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Ghost } from 'lucide-react';

type GameType = 'memory' | 'pacman';

export default function GamePage() {
  const { t } = useIntl();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameType>('memory');

  // Authentication check
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              {t('game.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('game.subtitle')}
            </p>
          </div>

          {/* Game Selector */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-center gap-4">
                <Button
                  variant={selectedGame === 'memory' ? 'default' : 'outline'}
                  onClick={() => setSelectedGame('memory')}
                  className="hover-lift flex items-center gap-2"
                  size="lg"
                >
                  <Brain className="w-5 h-5" />
                  {t('game.memoryGame')}
                </Button>
                <Button
                  variant={selectedGame === 'pacman' ? 'default' : 'outline'}
                  onClick={() => setSelectedGame('pacman')}
                  className="hover-lift flex items-center gap-2"
                  size="lg"
                >
                  <Ghost className="w-5 h-5" />
                  {t('game.pacmanGame')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selected Game */}
          <motion.div
            key={selectedGame}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {selectedGame === 'memory' ? <MemoryGame /> : <PacManGame />}
          </motion.div>
        </motion.div>
      </main>
      <ChatBot />
    </div>
  );
}
