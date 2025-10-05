'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { claudeUsageAPI, type TimeSeriesResponse } from '@/lib/api';
import { toast } from 'sonner';

type IntervalOption = '5min' | '15min' | '1hour';

export function TokenUsageGraph() {
  const [data, setData] = useState<TimeSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<IntervalOption>('5min');
  const [hours, setHours] = useState(6);
  const [error, setError] = useState(false);

  const fetchTimeSeries = async () => {
    try {
      const timeSeriesData = await claudeUsageAPI.getTimeSeries(
        hours,
        interval
      );
      setData(timeSeriesData);
      setError(false);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch time series data:', err);
      setError(true);
      setLoading(false);
      // Don't show toast - parent component handles API errors
    }
  };

  useEffect(() => {
    fetchTimeSeries();
    // Don't set up auto-refresh interval - parent handles refresh
  }, [interval, hours]);

  if (error || !data) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Token Usage Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground mb-3">No graph data available</p>
                <button
                  onClick={() => {
                    setError(false);
                    setLoading(true);
                    fetchTimeSeries();
                  }}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTokens = Math.max(
    ...data.data_points.map((p) => p.total_tokens),
    1
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="border-border bg-card hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Token Usage Over Time
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Hours selector */}
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground"
            >
              <option value={1}>1h</option>
              <option value={6}>6h</option>
              <option value={12}>12h</option>
              <option value={24}>24h</option>
            </select>

            {/* Interval selector */}
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as IntervalOption)}
              className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground"
            >
              <option value="5min">5 min</option>
              <option value="15min">15 min</option>
              <option value="1hour">1 hour</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="relative h-64 flex items-end gap-1 px-2">
          {data.data_points.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No data available for this time range
            </div>
          ) : (
            data.data_points.map((point, index) => {
              const heightPercentage = (point.total_tokens / maxTokens) * 100;
              const hasData = point.total_tokens > 0;

              return (
                <div
                  key={point.timestamp}
                  className="flex-1 group relative"
                  style={{ minWidth: '8px' }}
                >
                  {/* Bar */}
                  <div
                    className={`w-full transition-all duration-300 rounded-t-sm ${
                      hasData
                        ? 'bg-gradient-to-t from-primary to-primary/60 hover:from-primary/80 hover:to-primary/40'
                        : 'bg-muted'
                    }`}
                    style={{
                      height: hasData ? `${Math.max(heightPercentage, 2)}%` : '2%',
                    }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs whitespace-nowrap">
                      <div className="font-semibold text-foreground mb-2">
                        {formatTime(point.timestamp)}
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex justify-between gap-3">
                          <span>Total:</span>
                          <span className="font-mono text-foreground">
                            {formatNumber(point.total_tokens)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Input:</span>
                          <span className="font-mono">
                            {formatNumber(point.input_tokens)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Output:</span>
                          <span className="font-mono">
                            {formatNumber(point.output_tokens)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Cache Read:</span>
                          <span className="font-mono">
                            {formatNumber(point.cache_read_tokens)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Messages:</span>
                          <span className="font-mono">
                            {point.message_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-3 px-2 text-xs text-muted-foreground">
          <span>
            {data.data_points.length > 0 &&
              formatTime(data.data_points[0].timestamp)}
          </span>
          <span>
            {data.data_points.length > 0 &&
              formatTime(
                data.data_points[data.data_points.length - 1].timestamp
              )}
          </span>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-t from-primary to-primary/60 rounded-sm" />
            <span className="text-muted-foreground">Token Usage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Peak: <span className="font-mono text-foreground">{formatNumber(maxTokens)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Avg:{' '}
              <span className="font-mono text-foreground">
                {formatNumber(
                  Math.round(
                    data.data_points.reduce((sum, p) => sum + p.total_tokens, 0) /
                      data.data_points.length
                  )
                )}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
