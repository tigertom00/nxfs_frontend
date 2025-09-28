// System monitoring types
export interface SystemStats {
  id: number;
  timestamp: string;
  cpu_percent: number;
  memory_total: number;
  memory_used: number;
  memory_available: number;
  memory_percent: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  disk_percent: number;
  network_sent: number;
  network_recv: number;
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
  uptime: number;
  host_id?: number;
}

export interface SystemDashboard {
  current_stats: SystemStats;
  stats_history: SystemStats[];
  alerts: SystemAlert[];
  summary: {
    avg_cpu: number;
    avg_memory: number;
    avg_disk: number;
    uptime_hours: number;
  };
}

export interface SystemAlert {
  id: number;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  level: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  current_value: number;
  created_at: string;
  resolved_at?: string;
}

export interface HostSystemDashboard extends SystemDashboard {
  host_id: number;
  host_name: string;
}

// Request types
export interface SystemStatsQuery {
  hours?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  host_id?: number;
}

// Response types
export type GetSystemStatsResponse = SystemStats[];
export type GetSystemStatResponse = SystemStats;
export type GetLatestSystemStatsResponse = SystemStats;
export type GetSystemDashboardResponse = SystemDashboard;
export type GetHostSystemDashboardResponse = HostSystemDashboard;

export interface PostSystemCollectResponse {
  message: string;
  stats_collected: number;
  timestamp: string;
}