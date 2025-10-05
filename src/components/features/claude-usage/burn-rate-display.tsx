'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  BurnRate,
  RateLimitPredictions,
} from '@/lib/api/claude-usage/types';

interface BurnRateDisplayProps {
  burnRate: BurnRate;
  predictions: RateLimitPredictions;
}

export function BurnRateDisplay({
  burnRate,
  predictions,
}: BurnRateDisplayProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <Card className="border-border bg-card hover-lift h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Burn Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Burn Rate */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tokens/min</span>
            <span className="text-2xl font-mono font-bold text-primary">
              {formatNumber(burnRate.tokens_per_minute)}
            </span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 animate-pulse"
              style={{
                width: `${Math.min((burnRate.tokens_per_minute / 200) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Cost Burn Rate */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Cost/min</span>
            <span className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
              {formatCost(burnRate.cost_per_minute_usd)}
            </span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-300 animate-pulse"
              style={{
                width: `${Math.min((burnRate.cost_per_minute_usd / 0.1) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Projections */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Projections
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per hour:</span>
              <span className="font-mono text-foreground">
                {formatNumber(burnRate.tokens_per_minute * 60)} tokens
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per day:</span>
              <span className="font-mono text-foreground">
                {formatNumber(burnRate.tokens_per_minute * 60 * 24)} tokens
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily cost:</span>
              <span className="font-mono text-foreground">
                {formatCost(burnRate.cost_per_minute_usd * 60 * 24)}
              </span>
            </div>
          </div>
        </div>

        {/* Predictions Warning */}
        {predictions.tokens_will_run_out && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  Token Limit Warning
                </p>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                  {predictions.estimated_time_to_limit}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
