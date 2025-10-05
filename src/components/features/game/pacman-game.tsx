'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Heart,
  Volume2,
  VolumeX,
  Zap,
  Ghost,
} from 'lucide-react';
import { useIntl } from '@/hooks/use-intl';

// Types
type Difficulty = 'easy' | 'medium' | 'hard';
type Direction = 'up' | 'down' | 'left' | 'right';
type GhostBehavior = 'chase' | 'patrol' | 'random' | 'scared';
type CellType = 0 | 1 | 2 | 3 | 4; // 0: empty, 1: wall, 2: pellet, 3: power pellet, 4: empty path

interface Position {
  x: number;
  y: number;
}

interface GhostEntity {
  id: string;
  position: Position;
  direction: Direction;
  behavior: GhostBehavior;
  color: string;
  scaredTimer: number;
}

interface GameStats {
  highScore: number;
  gamesPlayed: number;
  totalPelletsEaten: number;
}

interface PowerUp {
  type: 'speed' | 'freeze' | 'multiplier';
  duration: number;
  active: boolean;
}

const DIFFICULTY_CONFIG = {
  easy: {
    mazeSize: 15,
    ghostCount: 2,
    ghostSpeed: 150,
    powerPelletDuration: 8000,
  },
  medium: {
    mazeSize: 19,
    ghostCount: 3,
    ghostSpeed: 120,
    powerPelletDuration: 6000,
  },
  hard: {
    mazeSize: 23,
    ghostCount: 4,
    ghostSpeed: 90,
    powerPelletDuration: 4000,
  },
};

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

const DIRECTIONS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export default function PacManGame() {
  const { t } = useIntl();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastMoveTimeRef = useRef<number>(0);
  const ghostMoveTimeRef = useRef<number>(0);

  // Game state
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Game data
  const [maze, setMaze] = useState<CellType[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('right');
  const [ghosts, setGhosts] = useState<GhostEntity[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [pelletsRemaining, setPelletsRemaining] = useState(0);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);

  const [stats, setStats] = useLocalStorage<GameStats>('pacman-stats', {
    highScore: 0,
    gamesPlayed: 0,
    totalPelletsEaten: 0,
  });

  const config = DIFFICULTY_CONFIG[difficulty];

  // Generate maze similar to classic Pac-Man with multiple paths
  const generateMaze = useCallback((size: number): CellType[][] => {
    // Initialize maze with walls
    const maze: CellType[][] = Array(size)
      .fill(0)
      .map(() => Array(size).fill(1));

    // Helper function to create a corridor
    const createCorridor = (
      startX: number,
      endX: number,
      startY: number,
      endY: number
    ) => {
      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
          if (x >= 0 && x < size && y >= 0 && y < size) {
            maze[y][x] = 2; // Pellet
          }
        }
      }
    };

    // Helper function to create room blocks
    const createBlock = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            maze[ny][nx] = 1;
          }
        }
      }
    };

    // Fill entire maze with pellets first
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        maze[y][x] = 2;
      }
    }

    // Create a pattern similar to classic Pac-Man
    const blockSize = Math.floor(size / 8);
    const spacing = blockSize + 1;

    // Create central ghost house
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    createBlock(centerX - 2, centerY - 1, 4, 3);

    // Create symmetric block pattern
    const positions = [
      // Top-left quadrant
      { x: blockSize, y: blockSize },
      { x: blockSize, y: blockSize * 2.5 },
      { x: blockSize * 2.5, y: blockSize },
      { x: blockSize * 2.5, y: blockSize * 2.5 },
    ];

    // Mirror blocks to create symmetric maze
    positions.forEach(({ x, y }) => {
      const w = Math.floor(blockSize * 1.5);
      const h = Math.floor(blockSize * 0.8);

      // Top-left
      createBlock(Math.floor(x), Math.floor(y), w, h);
      // Top-right
      createBlock(Math.floor(size - x - w), Math.floor(y), w, h);
      // Bottom-left
      createBlock(Math.floor(x), Math.floor(size - y - h), w, h);
      // Bottom-right
      createBlock(Math.floor(size - x - w), Math.floor(size - y - h), w, h);
    });

    // Create additional horizontal corridors
    for (let i = 1; i < 4; i++) {
      const y = Math.floor((size / 4) * i);
      createCorridor(1, size - 2, y, y);
    }

    // Create additional vertical corridors
    for (let i = 1; i < 4; i++) {
      const x = Math.floor((size / 4) * i);
      createCorridor(x, x, 1, size - 2);
    }

    // Add some random loops for variety
    const loopCount = Math.floor(size / 4);
    for (let i = 0; i < loopCount; i++) {
      const x = Math.floor(Math.random() * (size - 4)) + 2;
      const y = Math.floor(Math.random() * (size - 4)) + 2;
      const width = Math.floor(Math.random() * 3) + 2;
      const height = Math.floor(Math.random() * 3) + 2;

      // Create hollow rectangle (corridor loop)
      createCorridor(x, x + width, y, y);
      createCorridor(x, x + width, y + height, y + height);
      createCorridor(x, x, y, y + height);
      createCorridor(x + width, x + width, y, y + height);
    }

    // Ensure borders are walls
    for (let i = 0; i < size; i++) {
      maze[0][i] = 1;
      maze[size - 1][i] = 1;
      maze[i][0] = 1;
      maze[i][size - 1] = 1;
    }

    // Add power pellets at corners
    const powerPelletPositions = [
      { x: 2, y: 2 },
      { x: size - 3, y: 2 },
      { x: 2, y: size - 3 },
      { x: size - 3, y: size - 3 },
    ];

    powerPelletPositions.forEach((pos) => {
      if (maze[pos.y][pos.x] !== 1) {
        maze[pos.y][pos.x] = 3; // Power pellet
      }
    });

    return maze;
  }, []);

  // Initialize ghosts
  const initializeGhosts = useCallback(
    (mazeSize: number, count: number): GhostEntity[] => {
      const behaviors: GhostBehavior[] = ['chase', 'patrol', 'random', 'chase'];
      return Array.from({ length: count }, (_, i) => ({
        id: `ghost-${i}`,
        position: {
          x: Math.floor(mazeSize / 2) + i,
          y: Math.floor(mazeSize / 2),
        },
        direction: (['up', 'down', 'left', 'right'] as Direction[])[
          Math.floor(Math.random() * 4)
        ],
        behavior: behaviors[i % behaviors.length],
        color: GHOST_COLORS[i % GHOST_COLORS.length],
        scaredTimer: 0,
      }));
    },
    []
  );

  // Count pellets
  const countPellets = useCallback((maze: CellType[][]): number => {
    return maze.reduce(
      (count, row) =>
        count + row.filter((cell) => cell === 2 || cell === 3).length,
      0
    );
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    const newMaze = generateMaze(config.mazeSize);
    const newGhosts = initializeGhosts(config.mazeSize, config.ghostCount);

    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setPlayerDirection('right');
    setGhosts(newGhosts);
    setScore(0);
    setLives(3);
    setLevel(1);
    setPelletsRemaining(countPellets(newMaze));
    setPowerUpActive(false);
    setPowerUpTimer(0);
    setScoreMultiplier(1);
    setGameStarted(false);
    setGamePaused(false);
    setGameOver(false);
  }, [config, generateMaze, initializeGhosts, countPellets]);

  // Initialize on mount and difficulty change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Check collision
  const canMoveTo = useCallback(
    (pos: Position): boolean => {
      if (
        pos.x < 0 ||
        pos.x >= config.mazeSize ||
        pos.y < 0 ||
        pos.y >= config.mazeSize
      ) {
        return false;
      }
      return maze[pos.y]?.[pos.x] !== 1;
    },
    [maze, config.mazeSize]
  );

  // Move player
  const movePlayer = useCallback(
    (direction: Direction) => {
      const delta = DIRECTIONS[direction];
      const newPos = {
        x: playerPos.x + delta.x,
        y: playerPos.y + delta.y,
      };

      if (canMoveTo(newPos)) {
        setPlayerPos(newPos);
        setPlayerDirection(direction);

        // Check for pellet
        const cell = maze[newPos.y][newPos.x];
        if (cell === 2) {
          // Regular pellet
          setScore((s) => s + 10 * scoreMultiplier);
          setPelletsRemaining((p) => p - 1);
          setStats((prev) => ({
            ...prev,
            totalPelletsEaten: prev.totalPelletsEaten + 1,
          }));
          maze[newPos.y][newPos.x] = 0;
        } else if (cell === 3) {
          // Power pellet
          setScore((s) => s + 50 * scoreMultiplier);
          setPelletsRemaining((p) => p - 1);
          setPowerUpActive(true);
          setPowerUpTimer(config.powerPelletDuration);
          setGhosts((g) =>
            g.map((ghost) => ({ ...ghost, scaredTimer: config.powerPelletDuration }))
          );
          maze[newPos.y][newPos.x] = 0;
        }
      }
    },
    [playerPos, canMoveTo, maze, scoreMultiplier, config.powerPelletDuration, setStats]
  );

  // Simple ghost AI
  const moveGhost = useCallback(
    (ghost: GhostEntity): GhostEntity => {
      let newDirection = ghost.direction;
      const possibleDirections: Direction[] = [];

      // Find valid moves
      Object.entries(DIRECTIONS).forEach(([dir, delta]) => {
        const newPos = {
          x: ghost.position.x + delta.x,
          y: ghost.position.y + delta.y,
        };
        if (canMoveTo(newPos)) {
          possibleDirections.push(dir as Direction);
        }
      });

      if (possibleDirections.length === 0) return ghost;

      if (ghost.scaredTimer > 0) {
        // Random movement when scared
        newDirection =
          possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
      } else {
        // Behavior-based movement
        switch (ghost.behavior) {
          case 'chase':
            // Simple chase: move towards player
            const dx = playerPos.x - ghost.position.x;
            const dy = playerPos.y - ghost.position.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              newDirection = dx > 0 ? 'right' : 'left';
            } else {
              newDirection = dy > 0 ? 'down' : 'up';
            }
            if (!possibleDirections.includes(newDirection)) {
              newDirection =
                possibleDirections[
                  Math.floor(Math.random() * possibleDirections.length)
                ];
            }
            break;
          case 'patrol':
            // Continue in same direction, turn at walls
            if (!possibleDirections.includes(ghost.direction)) {
              newDirection =
                possibleDirections[
                  Math.floor(Math.random() * possibleDirections.length)
                ];
            }
            break;
          case 'random':
            newDirection =
              possibleDirections[
                Math.floor(Math.random() * possibleDirections.length)
              ];
            break;
        }
      }

      const delta = DIRECTIONS[newDirection];
      return {
        ...ghost,
        position: {
          x: ghost.position.x + delta.x,
          y: ghost.position.y + delta.y,
        },
        direction: newDirection,
        scaredTimer: Math.max(0, ghost.scaredTimer - 16),
      };
    },
    [canMoveTo, playerPos]
  );

  // Check ghost collision
  useEffect(() => {
    if (!gameStarted || gamePaused) return;

    ghosts.forEach((ghost) => {
      if (
        ghost.position.x === playerPos.x &&
        ghost.position.y === playerPos.y
      ) {
        if (ghost.scaredTimer > 0) {
          // Eat ghost
          setScore((s) => s + 200 * scoreMultiplier);
          // Reset ghost to center
          setGhosts((g) =>
            g.map((g) =>
              g.id === ghost.id
                ? {
                    ...g,
                    position: {
                      x: Math.floor(config.mazeSize / 2),
                      y: Math.floor(config.mazeSize / 2),
                    },
                    scaredTimer: 0,
                  }
                : g
            )
          );
        } else {
          // Lose life
          setLives((l) => l - 1);
          setPlayerPos({ x: 1, y: 1 });
        }
      }
    });
  }, [
    ghosts,
    playerPos,
    gameStarted,
    gamePaused,
    scoreMultiplier,
    config.mazeSize,
  ]);

  // Check game over
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      setGameStarted(false);
      setStats((prev) => ({
        ...prev,
        highScore: Math.max(prev.highScore, score),
        gamesPlayed: prev.gamesPlayed + 1,
      }));
    }
  }, [lives, score, setStats]);

  // Check level complete
  useEffect(() => {
    if (pelletsRemaining === 0 && gameStarted) {
      setLevel((l) => l + 1);
      setScoreMultiplier((m) => m + 0.5);
      const newMaze = generateMaze(config.mazeSize);
      setMaze(newMaze);
      setPelletsRemaining(countPellets(newMaze));
      setPlayerPos({ x: 1, y: 1 });
      setGhosts(initializeGhosts(config.mazeSize, config.ghostCount));
    }
  }, [
    pelletsRemaining,
    gameStarted,
    config,
    generateMaze,
    countPellets,
    initializeGhosts,
  ]);

  // Power-up timer
  useEffect(() => {
    if (powerUpTimer > 0 && gameStarted && !gamePaused) {
      const timer = setTimeout(() => {
        setPowerUpTimer((t) => Math.max(0, t - 100));
        if (powerUpTimer <= 100) {
          setPowerUpActive(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [powerUpTimer, gameStarted, gamePaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gamePaused) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer('right');
          break;
        case ' ':
          e.preventDefault();
          setGamePaused((p) => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gamePaused, movePlayer]);

  // Game loop for ghost movement
  useEffect(() => {
    if (!gameStarted || gamePaused) return;

    const animate = (timestamp: number) => {
      // Move ghosts
      if (timestamp - ghostMoveTimeRef.current > config.ghostSpeed) {
        setGhosts((g) => g.map(moveGhost));
        ghostMoveTimeRef.current = timestamp;
      }

      gameLoopRef.current = requestAnimationFrame(animate);
    };

    gameLoopRef.current = requestAnimationFrame(animate);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gamePaused, config.ghostSpeed, moveGhost]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = Math.min(
      canvas.width / config.mazeSize,
      canvas.height / config.mazeSize
    );

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        const pixelX = x * cellSize;
        const pixelY = y * cellSize;

        switch (cell) {
          case 1: // Wall
            ctx.fillStyle = 'hsl(var(--primary))';
            ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
            break;
          case 2: // Pellet
            ctx.fillStyle = 'hsl(var(--foreground))';
            ctx.beginPath();
            ctx.arc(
              pixelX + cellSize / 2,
              pixelY + cellSize / 2,
              cellSize / 6,
              0,
              Math.PI * 2
            );
            ctx.fill();
            break;
          case 3: // Power pellet
            ctx.fillStyle = 'hsl(var(--primary))';
            ctx.beginPath();
            ctx.arc(
              pixelX + cellSize / 2,
              pixelY + cellSize / 2,
              cellSize / 3,
              0,
              Math.PI * 2
            );
            ctx.fill();
            break;
        }
      });
    });

    // Draw player
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    const playerPixelX = playerPos.x * cellSize;
    const playerPixelY = playerPos.y * cellSize;

    // Draw Pac-Man with mouth
    let startAngle = 0.2;
    let endAngle = -0.2;

    switch (playerDirection) {
      case 'right':
        startAngle = 0.2;
        endAngle = -0.2;
        break;
      case 'left':
        startAngle = Math.PI + 0.2;
        endAngle = Math.PI - 0.2;
        break;
      case 'up':
        startAngle = Math.PI * 1.5 + 0.2;
        endAngle = Math.PI * 1.5 - 0.2;
        break;
      case 'down':
        startAngle = Math.PI * 0.5 + 0.2;
        endAngle = Math.PI * 0.5 - 0.2;
        break;
    }

    ctx.arc(
      playerPixelX + cellSize / 2,
      playerPixelY + cellSize / 2,
      cellSize / 2.5,
      startAngle * Math.PI,
      endAngle * Math.PI
    );
    ctx.lineTo(playerPixelX + cellSize / 2, playerPixelY + cellSize / 2);
    ctx.fill();

    // Draw ghosts
    ghosts.forEach((ghost) => {
      const ghostPixelX = ghost.position.x * cellSize;
      const ghostPixelY = ghost.position.y * cellSize;

      ctx.fillStyle =
        ghost.scaredTimer > 0 ? '#0000FF' : ghost.color;

      // Ghost body
      ctx.beginPath();
      ctx.arc(
        ghostPixelX + cellSize / 2,
        ghostPixelY + cellSize / 2,
        cellSize / 2.5,
        Math.PI,
        0
      );
      ctx.lineTo(ghostPixelX + cellSize - cellSize / 6, ghostPixelY + cellSize);
      ctx.lineTo(ghostPixelX + cellSize / 2, ghostPixelY + cellSize - cellSize / 6);
      ctx.lineTo(ghostPixelX + cellSize / 6, ghostPixelY + cellSize);
      ctx.closePath();
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        ghostPixelX + cellSize / 3,
        ghostPixelY + cellSize / 2.5,
        cellSize / 8,
        0,
        Math.PI * 2
      );
      ctx.arc(
        ghostPixelX + (cellSize * 2) / 3,
        ghostPixelY + cellSize / 2.5,
        cellSize / 8,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Ghost pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(
        ghostPixelX + cellSize / 3,
        ghostPixelY + cellSize / 2.5,
        cellSize / 16,
        0,
        Math.PI * 2
      );
      ctx.arc(
        ghostPixelX + (cellSize * 2) / 3,
        ghostPixelY + cellSize / 2.5,
        cellSize / 16,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }, [maze, playerPos, playerDirection, ghosts, config.mazeSize]);

  // Touch controls
  const [touchStart, setTouchStart] = useState<Position | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !gameStarted || gamePaused) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? 'right' : 'left');
    } else {
      movePlayer(dy > 0 ? 'down' : 'up');
    }

    setTouchStart(null);
  };

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
                  onClick={() => {
                    setDifficulty(level);
                    initializeGame();
                  }}
                  disabled={gameStarted}
                  className="capitalize hover-lift"
                  size="sm"
                >
                  {t(`game.pacman.${level}`)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant="outline"
                size="sm"
                className="hover-lift"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={initializeGame}
                variant="outline"
                size="sm"
                className="hover-lift"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('game.pacman.newGame')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <div className="flex flex-wrap justify-center gap-4">
        <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
          <Trophy className="w-4 h-4" />
          {t('game.pacman.score')}: {score}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
          <Heart className="w-4 h-4 text-red-500" />
          {t('game.pacman.lives')}: {lives}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
          <Zap className="w-4 h-4" />
          {t('game.pacman.level')}: {level}
        </Badge>
        {powerUpActive && (
          <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500">
            <Ghost className="w-4 h-4" />
            {t('game.pacman.powerUp')}: {Math.ceil(powerUpTimer / 1000)}s
          </Badge>
        )}
      </div>

      {/* High Score */}
      <div className="text-center text-sm text-muted-foreground">
        {t('game.pacman.highScore')}: {stats.highScore} | {t('game.pacman.gamesPlayed')}:{' '}
        {stats.gamesPlayed}
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="max-w-full h-auto border border-border/50 rounded-lg bg-background/50"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {!gameStarted ? (
          <Button
            onClick={() => setGameStarted(true)}
            className="hover-lift"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            {t('game.pacman.start')}
          </Button>
        ) : (
          <Button
            onClick={() => setGamePaused(!gamePaused)}
            variant="outline"
            className="hover-lift"
            size="lg"
          >
            {gamePaused ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                {t('game.pacman.resume')}
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 mr-2" />
                {t('game.pacman.pause')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Controls Guide */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-foreground">
              {t('game.pacman.controls')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('game.pacman.keyboardControls')}: ↑ ↓ ← → {t('common.or')} WASD
            </p>
            <p className="text-sm text-muted-foreground">
              {t('game.pacman.touchControls')}: {t('game.pacman.swipe')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('game.pacman.pauseKey')}: Space
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
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
                  <h2 className="text-3xl font-bold text-foreground">
                    {t('game.pacman.gameOver')}
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    {t('game.pacman.finalScore')}: {score}
                  </p>
                  <p className="text-muted-foreground">
                    {t('game.pacman.levelReached')}: {level}
                  </p>
                </div>
              </div>

              {score === stats.highScore && score > 0 && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-4 py-2 shadow-lg">
                  🏆 {t('game.pacman.newHighScore')}
                </Badge>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={initializeGame} className="flex-1">
                  {t('game.pacman.playAgain')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGameOver(false)}
                  className="flex-1"
                >
                  {t('common.close')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
