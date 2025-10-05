/**
 * Claude Usage API Types
 * Backend documentation: /app/claude-usage/
 */

export interface DashboardSummary {
  total_tokens: number;
  total_cost_usd: number;
  total_messages: number;
  time_range_hours: number;
}

export interface BurnRate {
  tokens_per_minute: number;
  cost_per_minute_usd: number;
}

export interface ModelDistribution {
  model: string;
  tokens: number;
  messages: number;
  cost_usd: number;
  percentage: number;
}

export interface RateLimitPredictions {
  tokens_will_run_out: boolean;
  estimated_time_to_limit: string;
}

export interface RateLimit {
  current_window_tokens: number;
  current_window_start: string;
  next_reset_at: string;
  time_until_reset_seconds: number;
  time_until_reset_human: string;
  is_within_active_window: boolean;
  predictions: RateLimitPredictions;
}

export interface DashboardData {
  summary: DashboardSummary;
  burn_rate: BurnRate;
  model_distribution: ModelDistribution[];
  rate_limit: RateLimit;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  message_count: number;
}

export interface TimeSeriesResponse {
  start_time: string;
  end_time: string;
  interval: '5min' | '15min' | '1hour';
  data_points: TimeSeriesDataPoint[];
}

export interface UsageStats {
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_creation_tokens: number;
  total_cache_read_tokens: number;
  total_sessions: number;
  total_messages: number;
  projects: number;
  current_window_tokens: number;
  next_reset_at: string;
  time_until_reset_seconds: number;
  time_until_reset_human: string;
  is_within_active_window: boolean;
}
