'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore, useUIStore } from '@/stores';
import { dockerAPI } from '@/lib/api';
import { DockerContainer, DockerOverview } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Server, Activity, PlayCircle, StopCircle, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  running: { color: 'bg-green-500', icon: PlayCircle, label: 'Running' },
  stopped: { color: 'bg-red-500', icon: StopCircle, label: 'Stopped' },
  paused: { color: 'bg-yellow-500', icon: PauseCircle, label: 'Paused' },
  restarting: { color: 'bg-blue-500', icon: RefreshCw, label: 'Restarting' },
  exited: { color: 'bg-gray-500', icon: StopCircle, label: 'Exited' },
  created: { color: 'bg-purple-500', icon: PlayCircle, label: 'Created' },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(createdAt: string, startedAt?: string): string {
  const start = startedAt ? new Date(startedAt) : new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - start.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatPort(port: { container_port: number; host_ip?: string; host_port?: number }): string {
  if (port.host_port && port.host_ip) {
    return `${port.host_ip}:${port.host_port}→${port.container_port}`;
  } else if (port.host_port) {
    return `${port.host_port}→${port.container_port}`;
  }
  return `${port.container_port}`;
}

function ContainerCard({ container }: { container: DockerContainer }) {
  const router = useRouter();
  const statusInfo = statusConfig[container.status] || statusConfig.stopped;
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/docker/${container.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {container.name}
          </CardTitle>
          <Badge
            variant="secondary"
            className={cn("text-white", statusInfo.color)}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Server className="w-4 h-4 mr-1" />
          {container.host_name}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Image</div>
          <div className="text-sm font-mono truncate">{container.image}</div>
        </div>

        {container.status === 'running' && container.latest_stats && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">CPU</div>
              <div className="font-medium">
                {container.latest_stats.cpu_percent !== null
                  ? `${container.latest_stats.cpu_percent.toFixed(1)}%`
                  : 'N/A'
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Memory</div>
              <div className="font-medium">
                {container.latest_stats.memory_usage !== null
                  ? formatBytes(container.latest_stats.memory_usage)
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        )}

        {container.ports && container.ports.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Ports</div>
            <div className="flex flex-wrap gap-1">
              {container.ports.slice(0, 3).map((port, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {formatPort(port)}
                </Badge>
              ))}
              {container.ports.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{container.ports.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {container.status === 'running' && (
          <div className="text-xs text-muted-foreground">
            Uptime: {formatUptime(container.created_at, container.started_at)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewCard({ overview }: { overview: DockerOverview }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Hosts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.total_hosts}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Containers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.total_containers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <PlayCircle className="w-4 h-4 mr-1 text-green-500" />
            Running
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {overview.running_containers}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <StopCircle className="w-4 h-4 mr-1 text-red-500" />
            Stopped
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {overview.stopped_containers}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DockerPage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const router = useRouter();
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [overview, setOverview] = useState<DockerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Initialize theme
  useEffect(() => {
    if (theme) {
      document.documentElement.classList.remove('light', 'dark', 'purple');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [containersData, hostsData] = await Promise.all([
        dockerAPI.getContainers(),
        dockerAPI.getHosts(),
      ]);

      setContainers(containersData);

      // Create overview from fetched data
      const runningContainers = containersData.filter(c => c.status === 'running').length;
      const stoppedContainers = containersData.length - runningContainers;

      setOverview({
        total_hosts: hostsData.length,
        total_containers: containersData.length,
        running_containers: runningContainers,
        stopped_containers: stoppedContainers,
        hosts: hostsData,
      });
    } catch (error) {
      console.error('Failed to fetch Docker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dockerAPI.refreshStats();
      await fetchData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const filteredContainers = containers.filter(container => {
    if (filter === 'running') return container.status === 'running';
    if (filter === 'stopped') return container.status !== 'running';
    return true;
  });

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
        <ChatBot />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Docker Containers</h1>
          <p className="text-muted-foreground">
            Manage and monitor your Docker containers across hosts
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {overview && <OverviewCard overview={overview} />}

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({containers.length})
        </Button>
        <Button
          variant={filter === 'running' ? 'default' : 'outline'}
          onClick={() => setFilter('running')}
        >
          <PlayCircle className="w-4 h-4 mr-1" />
          Running ({containers.filter(c => c.status === 'running').length})
        </Button>
        <Button
          variant={filter === 'stopped' ? 'default' : 'outline'}
          onClick={() => setFilter('stopped')}
        >
          <StopCircle className="w-4 h-4 mr-1" />
          Stopped ({containers.filter(c => c.status !== 'running').length})
        </Button>
      </div>

      {filteredContainers.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No containers found</h3>
          <p className="text-muted-foreground">
            {filter === 'all'
              ? 'No containers are available. Try syncing your hosts.'
              : `No ${filter} containers found.`
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContainers.map((container) => (
            <ContainerCard key={container.id} container={container} />
          ))}
        </div>
      )}
      </div>
      <ChatBot />
    </div>
  );
}