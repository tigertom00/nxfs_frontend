/**
 * Claude Usage API Client
 * Endpoints for Claude Code usage monitoring
 */

import api from '../base';
import { handleApiError } from '../shared/error-handler';
import type { DashboardData, TimeSeriesResponse, UsageStats } from './types';

const BASE_PATH = '/app/claude-usage';

export const claudeUsageAPI = {
  /**
   * Get complete dashboard summary with all metrics
   * @param hours - Time range in hours (default: 6)
   */
  getDashboard: async (hours: number = 6): Promise<DashboardData> => {
    try {
      const response = await api.get<DashboardData>(
        `${BASE_PATH}/dashboard/`,
        {
          params: { hours },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Fetching Claude usage dashboard');
      throw error;
    }
  },

  /**
   * Get time-series data for graphing token usage
   * @param hours - Time range in hours (default: 6)
   * @param interval - Data point interval (default: '5min')
   */
  getTimeSeries: async (
    hours: number = 6,
    interval: '5min' | '15min' | '1hour' = '5min'
  ): Promise<TimeSeriesResponse> => {
    try {
      const response = await api.get<TimeSeriesResponse>(
        `${BASE_PATH}/timeseries/`,
        {
          params: { hours, interval },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Fetching Claude usage time series');
      throw error;
    }
  },

  /**
   * Get overall usage statistics with rate limit info
   */
  getStats: async (): Promise<UsageStats> => {
    try {
      const response = await api.get<UsageStats>(`${BASE_PATH}/stats/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Fetching Claude usage stats');
      throw error;
    }
  },
};

export * from './types';
