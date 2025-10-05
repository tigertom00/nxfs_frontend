'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModelDistribution } from '@/lib/api/claude-usage/types';

interface ModelDistributionChartProps {
  models: ModelDistribution[];
}

const MODEL_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
];

export function ModelDistributionChart({
  models,
}: ModelDistributionChartProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cost);
  };

  const getModelShortName = (model: string) => {
    // Extract version number or key part from model name
    if (model.includes('sonnet-4')) return 'Sonnet 4';
    if (model.includes('sonnet')) return 'Sonnet 3.5';
    if (model.includes('opus')) return 'Opus';
    if (model.includes('haiku')) return 'Haiku';
    return model.split('-').slice(-1)[0] || model;
  };

  return (
    <Card className="border-border bg-card hover-lift h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Model Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Horizontal Bar Chart */}
        <div className="space-y-3">
          {models.map((model, index) => {
            const color = MODEL_COLORS[index % MODEL_COLORS.length];

            return (
              <div key={model.model} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="font-medium text-foreground">
                      {getModelShortName(model.model)}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {model.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${color} transition-all duration-500`}
                    style={{ width: `${model.percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-foreground mix-blend-difference">
                    {formatNumber(model.tokens)} tokens
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Model Details Table */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
            Detailed Breakdown
          </h4>
          {models.map((model, index) => (
            <div
              key={model.model}
              className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg text-sm hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${MODEL_COLORS[index % MODEL_COLORS.length]}`}
                />
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {model.model}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-foreground font-mono">
                  {model.messages} msgs
                </span>
                <span className="text-foreground font-mono font-semibold">
                  {formatCost(model.cost_usd)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-foreground">Total Models:</span>
            <span className="text-primary">{models.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
