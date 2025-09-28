import { BaseSearchParams } from '../shared/types';

// Docker entity types
export interface DockerHost {
  id: number;
  name: string;
  hostname: string;
  ip_address?: string;
  port?: number;
  connection_type?: 'socket' | 'tcp';
  is_active: boolean;
  last_sync?: string;
  total_containers?: number;
  running_containers?: number;
  created_at: string;
  updated_at: string;
}

export interface DockerStats {
  id: string;
  container: string; // Foreign key to DockerContainer
  timestamp: string;
  cpu_percent: number;
  memory_usage: number; // in bytes
  memory_limit: number; // in bytes
  memory_percent: number;
  network_rx: number; // bytes received
  network_tx: number; // bytes transmitted
  disk_read: number; // bytes read from disk
  disk_write: number; // bytes written to disk
  pids: number; // number of processes/threads
}

export interface DockerContainer {
  id: string;
  container_id: string; // Docker container ID
  name: string;
  image: string;
  status:
    | 'running'
    | 'stopped'
    | 'paused'
    | 'restarting'
    | 'exited'
    | 'created';
  state: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    Error: string;
    StartedAt: string;
    FinishedAt: string;
  };
  host: number; // Foreign key to DockerHost
  host_name?: string; // Host name for display
  created_at: string;
  started_at?: string;
  ports?: Array<{
    container_port: number;
    host_ip?: string;
    host_port?: number;
  }>;
  networks?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  labels?: Record<string, string>;
  command?: string;
  updated_at: string;
  latest_stats?: DockerStats;
}

export interface DockerOverview {
  total_hosts: number;
  total_containers: number;
  running_containers: number;
  stopped_containers: number;
  hosts: DockerHost[];
}

// Search parameters
export interface ContainerSearchParams extends BaseSearchParams {
  host_id?: number;
  status?: string;
  running_only?: boolean;
  image?: string;
}

export interface StatsSearchParams {
  hours?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

// Request payloads
export interface CreateHostPayload {
  name: string;
  hostname: string;
  ip_address?: string;
  port?: number;
  connection_type?: 'socket' | 'tcp';
}

export type UpdateHostPayload = Partial<CreateHostPayload>;

export interface ContainerActionPayload {
  action: 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'remove';
  force?: boolean;
}

// Response types
export type GetDockerHostsResponse = DockerHost[];
export type GetDockerHostResponse = DockerHost;
export type CreateDockerHostResponse = DockerHost;
export type UpdateDockerHostResponse = DockerHost;
export type DeleteDockerHostResponse = void;
export type GetDockerOverviewResponse = DockerOverview;

export type GetDockerContainersResponse = DockerContainer[];
export type GetDockerContainerResponse = DockerContainer;
export type GetRunningContainersResponse = DockerContainer[];

export type GetContainerStatsResponse = DockerStats[];
export type GetContainerStatResponse = DockerStats;

export interface SyncContainersResponse {
  message: string;
  synced_containers: number;
  timestamp: string;
}

export interface RefreshStatsResponse {
  message: string;
  containers_updated: number;
  timestamp: string;
}

export interface ContainerActionResponse {
  message: string;
  container_id: string;
  status: string;
  timestamp: string;
}