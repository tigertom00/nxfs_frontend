'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  DashboardSummary,
  RateLimit,
} from '@/lib/api/claude-usage/types';

interface UsageMetricsProps {
  summary: DashboardSummary;
  rateLimit: RateLimit;
}

const PRO_TOKEN_LIMIT = 65459;
const PRO_COST_LIMIT = 16.66;
const PRO_MESSAGE_LIMIT = 466;

export function UsageMetrics({ summary, rateLimit }: UsageMetricsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const metrics = [
    {
      icon: '💰',
      label: 'Cost Usage',
      value: `$${summary.total_cost_usd.toFixed(2)}`,
      limit: `$${PRO_COST_LIMIT.toFixed(2)}`,
      percentage: (summary.total_cost_usd / PRO_COST_LIMIT) * 100,
      description: 'Estimated cost in USD',
    },
    {
      icon: '🔢',
      label: 'Token Usage',
      value: formatNumber(rateLimit.current_window_tokens),
      limit: formatNumber(PRO_TOKEN_LIMIT),
      percentage: (rateLimit.current_window_tokens / PRO_TOKEN_LIMIT) * 100,
      description: 'Current 5-hour window',
    },
    {
      icon: '💬',
      label: 'Messages Usage',
      value: formatNumber(summary.total_messages),
      limit: formatNumber(PRO_MESSAGE_LIMIT),
      percentage: (summary.total_messages / PRO_MESSAGE_LIMIT) * 100,
      description: `Last ${summary.time_range_hours} hours`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const progressColor = getProgressColor(metric.percentage);
        const isWarning = metric.percentage > 80;

        return (
          <Card
            key={metric.label}
            className={`border transition-all hover-lift ${
              isWarning ? 'border-destructive' : 'border-border'
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{metric.icon}</span>
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-foreground">
                    {metric.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {metric.limit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {metric.description}
                  </span>
                  <span
                    className={`font-semibold ${
                      isWarning ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {metric.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
