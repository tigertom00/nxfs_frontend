// System monitoring types
export interface SystemHost {
  id: number;
  name: string;
  hostname: string;
  ip_address?: string;
  status: 'online' | 'offline' | 'maintenance';
  is_active?: boolean;
  os_name?: string;
  os_version?: string;
  cpu_model?: string;
  architecture?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemStats {
  id: number;
  timestamp: string;
  cpu_percent: number;
  cpu_count: number;
  cpu_temperature?: number;
  memory_total: number;
  memory_used: number;
  memory_available: number;
  memory_percent: number;
  memory_free: number;
  swap_total: number;
  swap_used: number;
  swap_free: number;
  swap_percent: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  disk_percent: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  disk_read_count: number;
  disk_write_count: number;
  network_sent: number;
  network_recv: number;
  network_bytes_sent: number;
  network_bytes_recv: number;
  network_packets_sent: number;
  network_packets_recv: number;
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  boot_time: string;
  process_count: number;
  uptime: number;
  host_id?: number;
  count?: number;
  results?: any[];
}

// Container summary for dashboard
export interface ContainersSummary {
  total: number;
  running: number;
  stopped: number;
  paused: number;
}

// Historical data points for charts
export interface CPUHistoryPoint {
  timestamp: string;
  cpu_percent: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
}

export interface MemoryHistoryPoint {
  timestamp: string;
  memory_percent: number;
  memory_used: number;
  memory_available: number;
  swap_percent: number;
}

export interface DiskHistoryPoint {
  timestamp: string;
  disk_percent: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
}

export interface NetworkHistoryPoint {
  timestamp: string;
  network_bytes_sent: number;
  network_bytes_recv: number;
}

// Top processes information
export interface TopProcess {
  id: number;
  pid: number;
  name: string;
  username: string;
  cpu_percent: number;
  memory_percent: number;
  memory_rss: number;
  memory_vms: number;
  status: string;
  create_time: string;
  cmdline: string;
  timestamp: string;
}

export interface SystemDashboard {
  host: SystemHost;
  current_system_stats: SystemStats;
  containers_summary: ContainersSummary;
  top_processes: TopProcess[];
  cpu_history: CPUHistoryPoint[];
  memory_history: MemoryHistoryPoint[];
  disk_history: DiskHistoryPoint[];
  network_history: NetworkHistoryPoint[];
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
export interface GetLatestSystemStatsResponse {
  count: number;
  results: HostSystemDashboard[];
}
export type GetSystemDashboardResponse = SystemDashboard;
export type GetHostSystemDashboardResponse = HostSystemDashboard;

export interface PostSystemCollectResponse {
  message: string;
  stats_collected: number;
  timestamp: string;
}
