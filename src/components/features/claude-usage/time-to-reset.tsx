'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { RateLimit } from '@/lib/api/claude-usage/types';

interface TimeToResetProps {
  rateLimit: RateLimit;
}

export function TimeToReset({ rateLimit }: TimeToResetProps) {
  const [timeRemaining, setTimeRemaining] = useState(
    rateLimit.time_until_reset_seconds
  );

  useEffect(() => {
    setTimeRemaining(rateLimit.time_until_reset_seconds);
  }, [rateLimit.time_until_reset_seconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const percentage = (timeRemaining / (5 * 60 * 60)) * 100;
  const isUrgent = timeRemaining < 1800; // Less than 30 minutes

  return (
    <Card
      className={`border-2 transition-all duration-300 hover-lift ${
        isUrgent
          ? 'border-destructive bg-destructive/5'
          : 'border-primary bg-card'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl ${isUrgent ? 'animate-pulse' : ''}`}
            >
              ⏱️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Time to Reset
              </h2>
              <p className="text-sm text-muted-foreground">
                5-hour rate limit window
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-4xl font-mono font-bold ${
                isUrgent ? 'text-destructive' : 'text-primary'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Resets at{' '}
              {new Date(rateLimit.next_reset_at).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
              isUrgent
                ? 'bg-destructive'
                : 'bg-gradient-to-r from-primary to-primary/60'
            }`}
            style={{ width: `${100 - percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground mix-blend-difference">
              {(100 - percentage).toFixed(1)}% elapsed
            </span>
          </div>
        </div>

        {/* Warning Message */}
        {isUrgent && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive font-semibold">
              ⚠️ Rate limit window ending soon! Consider reducing usage.
            </p>
          </div>
        )}

        {/* Predictions */}
        {rateLimit.predictions.tokens_will_run_out && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
              🔔 Prediction: {rateLimit.predictions.estimated_time_to_limit}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
