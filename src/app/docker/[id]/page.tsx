'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore, useUIStore } from '@/stores';
import { dockerAPI, DockerContainer, DockerStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  RefreshCw,
  Server,
  Activity,
  PlayCircle,
  StopCircle,
  PauseCircle,
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
  Clock,
  Tag,
  Terminal,
  Globe,
  FolderOpen,
} from 'lucide-react';
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
  if (bytes === 0) {return '0 B';}
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

  if (days > 0) {return `${days}d ${hours}h ${minutes}m`;}
  if (hours > 0) {return `${hours}h ${minutes}m`;}
  return `${minutes}m`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function formatPort(port: {
  container_port: number;
  host_ip?: string;
  host_port?: number;
}): string {
  if (port.host_port) {
    return `${port.host_port}:${port.container_port}`;
  }
  return `${port.container_port}`;
}

function getPortUrl(
  port: { container_port: number; host_ip?: string; host_port?: number },
  hostName?: string
): string | null {
  if (!port.host_port) {return null;}

  let baseUrl = '';
  if (hostName === 'nuk') {
    baseUrl = 'http://10.20.30.203';
  } else if (hostName === 'zero') {
    baseUrl = 'http://10.20.30.202';
  } else {
    return null; // Unknown host
  }

  return `${baseUrl}:${port.host_port}`;
}

function StatsCard({ stats }: { stats: DockerStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-blue-500" />
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.cpu_percent !== null
              ? `${stats.cpu_percent.toFixed(2)}%`
              : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <MemoryStick className="w-4 h-4 mr-2 text-green-500" />
            Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.memory_percent !== null
              ? `${stats.memory_percent.toFixed(1)}%`
              : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.memory_usage !== null && stats.memory_limit !== null
              ? `${formatBytes(stats.memory_usage)} / ${formatBytes(stats.memory_limit)}`
              : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Network className="w-4 h-4 mr-2 text-purple-500" />
            Network I/O
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>RX:</span>
              <span className="font-medium">
                {stats.network_rx !== null
                  ? formatBytes(stats.network_rx)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TX:</span>
              <span className="font-medium">
                {stats.network_tx !== null
                  ? formatBytes(stats.network_tx)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <HardDrive className="w-4 h-4 mr-2 text-orange-500" />
            Disk I/O
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Read:</span>
              <span className="font-medium">
                {stats.disk_read !== null
                  ? formatBytes(stats.disk_read)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Write:</span>
              <span className="font-medium">
                {stats.disk_write !== null
                  ? formatBytes(stats.disk_write)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoricalStats({ stats }: { stats: DockerStats[] }) {
  // Ensure stats is always an array
  const statsArray = Array.isArray(stats) ? stats : [];

  if (statsArray.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No historical data</h3>
        <p className="text-muted-foreground">
          Historical stats will appear here as they are collected.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {statsArray.slice(0, 10).map((stat, index) => (
        <Card key={stat.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {formatDate(stat.timestamp)}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">CPU</div>
                <div className="font-medium">
                  {stat.cpu_percent !== null
                    ? `${stat.cpu_percent.toFixed(2)}%`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Memory</div>
                <div className="font-medium">
                  {stat.memory_percent !== null
                    ? `${stat.memory_percent.toFixed(1)}%`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Network RX</div>
                <div className="font-medium">
                  {stat.network_rx !== null
                    ? formatBytes(stat.network_rx)
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">PIDs</div>
                <div className="font-medium">{stat.pids}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ContainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { theme } = useUIStore();
  const router = useRouter();
  const [container, setContainer] = useState<DockerContainer | null>(null);
  const [historicalStats, setHistoricalStats] = useState<DockerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'purple');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [containerData, statsData] = await Promise.all([
        dockerAPI.getContainer(id),
        dockerAPI.getContainerStats(id, { limit: 20 }),
      ]);
      setContainer(containerData);
      setHistoricalStats(Array.isArray(statsData) ? statsData : []);
    } catch (error) {
      console.error('Failed to fetch container data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
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
  }, [isAuthenticated, id]);

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
        <ChatBot />
      </div>
    );
  }

  if (!isAuthenticated || !container) {
    return null;
  }

  const statusInfo = statusConfig[container.status] || statusConfig.stopped;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{container.name}</h1>
                <Badge
                  variant="secondary"
                  className={cn('text-white', statusInfo.color)}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Server className="w-4 h-4 mr-1" />
                {container.host_name}
              </div>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw
                className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')}
              />
              Refresh
            </Button>
          </div>

          {container.latest_stats && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Stats</h2>
              <StatsCard stats={container.latest_stats} />
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="history">Stats History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Container Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Container ID
                      </div>
                      <div className="font-mono text-sm">
                        {container.container_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Image
                      </div>
                      <div className="font-mono text-sm">{container.image}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        State
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Status: {container.state.Status}</div>
                        {container.state.Pid > 0 && (
                          <div>PID: {container.state.Pid}</div>
                        )}
                        {container.state.ExitCode !== 0 && (
                          <div>Exit Code: {container.state.ExitCode}</div>
                        )}
                        {container.state.Error && (
                          <div className="text-red-500">
                            Error: {container.state.Error}
                          </div>
                        )}
                      </div>
                    </div>
                    {container.command && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Command
                        </div>
                        <div className="font-mono text-sm bg-muted p-2 rounded">
                          {container.command}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Created
                      </div>
                      <div className="text-sm">
                        {formatDate(container.created_at)}
                      </div>
                    </div>
                    {container.started_at && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Started
                        </div>
                        <div className="text-sm">
                          {formatDate(container.started_at)}
                        </div>
                      </div>
                    )}
                    {container.status === 'running' && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Uptime
                        </div>
                        <div className="text-sm">
                          {formatUptime(
                            container.created_at,
                            container.started_at
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Last Updated
                      </div>
                      <div className="text-sm">
                        {formatDate(container.updated_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {container.volumes && container.volumes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Volumes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {container.volumes.map((volume, index) => (
                        <div
                          key={index}
                          className="font-mono text-sm bg-muted p-2 rounded"
                        >
                          {volume}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="w-4 h-4 mr-2" />
                    Environment Variables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {container.environment &&
                  Object.keys(container.environment).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(container.environment).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b"
                          >
                            <div className="font-medium text-sm">{key}</div>
                            <div className="md:col-span-2 font-mono text-sm bg-muted p-2 rounded">
                              {value}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No environment variables found.
                    </p>
                  )}
                </CardContent>
              </Card>

              {container.labels && Object.keys(container.labels).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Labels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(container.labels).map(([key, value]) => (
                        <div
                          key={key}
                          className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b"
                        >
                          <div className="font-medium text-sm">{key}</div>
                          <div className="md:col-span-2 font-mono text-sm bg-muted p-2 rounded">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {container.ports && container.ports.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Port Mappings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(() => {
                          // Deduplicate ports by unique host_port:container_port combination
                          const uniquePorts = container.ports.filter(
                            (port, index, arr) => {
                              return (
                                arr.findIndex(
                                  (p) =>
                                    p.host_port === port.host_port &&
                                    p.container_port === port.container_port
                                ) === index
                              );
                            }
                          );

                          return uniquePorts.map((port, index) => {
                            const url = getPortUrl(port, container.host_name);
                            return url ? (
                              <Badge
                                key={`${port.host_port}-${port.container_port}`}
                                variant="outline"
                                className="mr-2 mb-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => window.open(url, '_blank')}
                              >
                                {formatPort(port)}
                              </Badge>
                            ) : (
                              <Badge
                                key={`${port.host_port}-${port.container_port}`}
                                variant="outline"
                                className="mr-2 mb-2"
                              >
                                {formatPort(port)}
                              </Badge>
                            );
                          });
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {container.networks && container.networks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Network className="w-4 h-4 mr-2" />
                        Networks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {container.networks.map((network, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-2 mb-2"
                          >
                            {network}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Performance History
                </h3>
                <HistoricalStats stats={historicalStats} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
