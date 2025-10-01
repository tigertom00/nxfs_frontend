'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks';
import { Clock, RotateCcw, Trophy, Zap } from 'lucide-react';

// Electrical-themed symbols
const ELECTRICAL_SYMBOLS = [
  { id: 'battery', symbol: '🔋', name: 'Battery' },
  { id: 'lightbulb', symbol: '💡', name: 'Lightbulb' },
  { id: 'plug', symbol: '🔌', name: 'Plug' },
  { id: 'flash', symbol: '⚡', name: 'Lightning' },
  { id: 'cable', symbol: '🔗', name: 'Cable' },
  { id: 'switch', symbol: '🎚️', name: 'Switch' },
  { id: 'motor', symbol: '⚙️', name: 'Motor' },
  { id: 'solar', symbol: '☀️', name: 'Solar' },
];

interface GameCard {
  id: string;
  symbolId: string;
  symbol: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameStats {
  moves: number;
  matches: number;
  time: number;
  bestTime: number | null;
  gamesPlayed: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG = {
  easy: { pairs: 4, cols: 4 },
  medium: { pairs: 6, cols: 4 },
  hard: { pairs: 8, cols: 4 },
};

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [victoryModalShown, setVictoryModalShown] = useState(false);
  const [finalGameStats, setFinalGameStats] = useState<{
    time: number;
    moves: number;
  } | null>(null);
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const [currentGameMoves, setCurrentGameMoves] = useState(0);
  const [stats, setStats] = useLocalStorage<GameStats>('memory-game-stats', {
    moves: 0,
    matches: 0,
    time: 0,
    bestTime: null,
    gamesPlayed: 0,
  });

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setCurrentGameTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted]);

  // Initialize game
  const initializeGame = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const selectedSymbols = ELECTRICAL_SYMBOLS.slice(0, config.pairs);
    const gameCards: GameCard[] = [];

    selectedSymbols.forEach((symbol) => {
      gameCards.push(
        {
          id: `${symbol.id}-1`,
          symbolId: symbol.id,
          symbol: symbol.symbol,
          name: symbol.name,
          isFlipped: false,
          isMatched: false,
        },
        {
          id: `${symbol.id}-2`,
          symbolId: symbol.id,
          symbol: symbol.symbol,
          name: symbol.name,
          isFlipped: false,
          isMatched: false,
        }
      );
    });

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setGameStarted(false);
    setGameCompleted(false);
    setVictoryModalShown(false);
    setFinalGameStats(null);
    setCurrentGameTime(0);
    setCurrentGameMoves(0);
    setStats((prev) => ({ ...prev, moves: 0, matches: 0, time: 0 }));
  }, [difficulty]);

  // Initialize game on mount and difficulty change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle card click
  const handleCardClick = (cardId: string) => {
    if (isChecking) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    // Check for match if two cards are selected
    if (newSelectedCards.length === 2) {
      setIsChecking(true);
      setCurrentGameMoves((prev) => prev + 1);

      const [first, second] = newSelectedCards;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (
        firstCard &&
        secondCard &&
        firstCard.symbolId === secondCard.symbolId
      ) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);
          setIsChecking(false);
          setStats((prev) => ({ ...prev, matches: prev.matches + 1 }));
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  // Check for game completion
  useEffect(() => {
    if (
      cards.length > 0 &&
      cards.every((card) => card.isMatched) &&
      !victoryModalShown
    ) {
      // Capture final game stats before they get reset
      setFinalGameStats({ time: currentGameTime, moves: currentGameMoves });
      setGameCompleted(true);
      setVictoryModalShown(true);
      setStats((prev) => {
        const newStats = { ...prev, gamesPlayed: prev.gamesPlayed + 1 };
        if (!prev.bestTime || currentGameTime < prev.bestTime) {
          newStats.bestTime = currentGameTime;
        }
        return newStats;
      });
    }
  }, [cards, currentGameTime, currentGameMoves, victoryModalShown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? 'default' : 'outline'}
                  onClick={() => setDifficulty(level)}
                  className="capitalize hover-lift"
                  size="sm"
                >
                  {level}
                </Button>
              ))}
            </div>

            <div className="flex gap-4 items-center">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <Clock className="w-4 h-4" />
                {formatTime(currentGameTime)}
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <RotateCcw className="w-4 h-4" />
                {currentGameMoves}
              </Badge>
              <Button
                onClick={initializeGame}
                variant="outline"
                size="sm"
                className="hover-lift"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <span>Games: {stats.gamesPlayed}</span>
        {stats.bestTime !== null && (
          <span>Best: {formatTime(stats.bestTime)}</span>
        )}
      </div>

      {/* Game Board */}
      <div className="flex justify-center">
        <div
          className={`grid gap-3 max-w-lg w-full`}
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          }}
        >
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
              >
                <Card
                  className={`aspect-square cursor-pointer transition-all duration-200 ${
                    card.isMatched
                      ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20'
                      : card.isFlipped
                        ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/20'
                        : 'bg-card border-border hover:bg-muted hover-lift hover:shadow-lg'
                  }`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <AnimatePresence mode="wait">
                      {card.isFlipped || card.isMatched ? (
                        <motion.div
                          key="front"
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -180, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-4xl filter drop-shadow-sm"
                        >
                          {card.symbol}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ rotateY: -180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: 180, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-2xl text-muted-foreground opacity-60"
                        >
                          <Zap className="w-8 h-8" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Game Completion Modal */}
      <AnimatePresence>
        {gameCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card border-border rounded-xl p-8 max-w-md w-full mx-4 text-center space-y-6"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Trophy className="w-20 h-20 text-yellow-500 mx-auto filter drop-shadow-lg" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    Congratulations!
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    You completed the {difficulty} game in{' '}
                    {formatTime(finalGameStats?.time || 0)} with{' '}
                    {finalGameStats?.moves || 0} moves!
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {finalGameStats && stats.bestTime === finalGameStats.time && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-4 py-2 shadow-lg">
                      🏆 New Best Time!
                    </Badge>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                {stats.bestTime === stats.time && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    New Best Time!
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={initializeGame} className="flex-1">
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGameCompleted(false);
                    // Don't reset cards - just hide the modal
                    // Cards stay matched so completion check doesn't re-trigger
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
