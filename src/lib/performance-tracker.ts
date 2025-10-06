import React from 'react';
import { ResponseHeaders } from './api/shared/types';

export interface APIPerformanceMetric {
  url?: string;
  method?: string;
  response_time?: number;
  db_queries?: number;
  timestamp: string;
  status?: number;
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  slowRequests: number; // Requests > 1s
  heavyDBRequests: number; // Requests > 10 queries
  recentMetrics: APIPerformanceMetric[];
}

class PerformanceTracker {
  private metrics: APIPerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  trackAPIRequest(metric: APIPerformanceMetric) {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getStats(timePeriodMs = 30 * 60 * 1000): PerformanceStats {
    // Default: last 30 minutes
    const now = new Date();
    const cutoff = new Date(now.getTime() - timePeriodMs);

    const recentMetrics = this.metrics.filter(
      (metric) => new Date(metric.timestamp) > cutoff
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        slowRequests: 0,
        heavyDBRequests: 0,
        recentMetrics: [],
      };
    }

    const responseTimes = recentMetrics
      .map((m) => m.response_time)
      .filter((time): time is number => time !== undefined);

    const totalRequests = recentMetrics.length;
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const slowRequests = responseTimes.filter((time) => time > 1.0).length;
    const heavyDBRequests = recentMetrics.filter(
      (m) => m.db_queries && m.db_queries > 10
    ).length;

    return {
      totalRequests,
      averageResponseTime,
      maxResponseTime,
      slowRequests,
      heavyDBRequests,
      recentMetrics: recentMetrics.slice(-50), // Return last 50 for debugging
    };
  }

  getSlowRequests(threshold = 1.0): APIPerformanceMetric[] {
    return this.metrics.filter(
      (metric) => metric.response_time && metric.response_time > threshold
    );
  }

  getHeavyDBRequests(threshold = 10): APIPerformanceMetric[] {
    return this.metrics.filter(
      (metric) => metric.db_queries && metric.db_queries > threshold
    );
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Export data for external analytics
  exportMetrics(): APIPerformanceMetric[] {
    return [...this.metrics];
  }
}

// Create global instance
const performanceTracker = new PerformanceTracker();

// Make it available globally for the axios interceptor
if (typeof window !== 'undefined') {
  (window as unknown as Window & { performanceTracker: PerformanceTracker }).performanceTracker = performanceTracker;
}

export default performanceTracker;

// React hook for using performance data
export function usePerformanceStats(timePeriodMs?: number) {
  const [stats, setStats] = React.useState<PerformanceStats | null>(null);

  React.useEffect(() => {
    const updateStats = () => {
      setStats(performanceTracker.getStats(timePeriodMs));
    };

    // Update immediately
    updateStats();

    // Update every 10 seconds
    const interval = setInterval(updateStats, 10000);

    return () => clearInterval(interval);
  }, [timePeriodMs]);

  return stats;
}

// Utility functions for React components
export const formatResponseTime = (time: number): string => {
  if (time < 1) {
    return `${Math.round(time * 1000)}ms`;
  }
  return `${time.toFixed(2)}s`;
};

export const getPerformanceColor = (responseTime: number): string => {
  if (responseTime < 0.5) {return 'text-green-500';}
  if (responseTime < 1.0) {return 'text-yellow-500';}
  return 'text-red-500';
};
