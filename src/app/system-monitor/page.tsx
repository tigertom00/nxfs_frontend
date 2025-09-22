'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { systemAPI } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { SystemDashboard, LatestSystemStatsResponse } from '@/types/api';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  Thermometer,
  Zap,
  RefreshCw,
  Monitor,
  Clock,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIntl } from '@/hooks/use-intl';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatUptime = (bootTime: string): string => {
  const boot = new Date(bootTime);
  const now = new Date();
  const diffMs = now.getTime() - boot.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

const SystemMonitorPage = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const { t } = useIntl();

  const [dashboard, setDashboard] = useState<SystemDashboard | null>(null);
  const [allHosts, setAllHosts] = useState<LatestSystemStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  const fetchData = async () => {
    try {
      setError(null);
      const [dashboardData, latestStats] = await Promise.all([
        systemAPI.getSystemDashboard(),
        systemAPI.getLatestSystemStats(),
      ]);
      setDashboard(dashboardData);
      setAllHosts(latestStats);
    } catch (err) {
      setError('Failed to fetch system data');
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleCollectStats = async () => {
    try {
      await systemAPI.collectSystemStats();
      setTimeout(() => fetchData(), 2000); // Refresh after 2 seconds
    } catch (err) {
      console.error('Error collecting stats:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error && !dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">System Monitor</h1>
              <p className="text-slate-300">Real-time infrastructure monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleCollectStats}
              variant="outline"
              className="border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
            >
              <Zap className="w-4 h-4 mr-2" />
              Collect Stats
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* All Hosts Overview */}
        {allHosts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Server className="w-5 h-5 mr-2 text-blue-400" />
                  Infrastructure Overview ({allHosts.count} hosts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allHosts.results.map((hostData, index) => (
                    <motion.div
                      key={hostData.host.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{hostData.host.name}</h3>
                        <Badge
                          variant={hostData.host.is_active ? "default" : "secondary"}
                          className={hostData.host.is_active ? "bg-green-500" : ""}
                        >
                          {hostData.host.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center">
                            <Cpu className="w-4 h-4 mr-2 text-blue-400" />
                            CPU
                          </span>
                          <span className="text-white font-mono">{hostData.stats.cpu_percent}%</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center">
                            <MemoryStick className="w-4 h-4 mr-2 text-green-400" />
                            Memory
                          </span>
                          <span className="text-white font-mono">{hostData.stats.memory_percent}%</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center">
                            <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
                            Disk
                          </span>
                          <span className="text-white font-mono">{hostData.stats.disk_percent.toFixed(1)}%</span>
                        </div>

                        {hostData.stats.cpu_temperature && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center">
                              <Thermometer className="w-4 h-4 mr-2 text-red-400" />
                              Temp
                            </span>
                            <span className="text-white font-mono">{hostData.stats.cpu_temperature}°C</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Detailed Dashboard for Primary Host */}
        {dashboard && (
          <>
            {/* Host Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Server className="w-5 h-5 mr-2 text-blue-400" />
                    {dashboard.host.name} - System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Operating System</p>
                      <p className="text-white font-mono">{dashboard.host.os_name} {dashboard.host.os_version}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">CPU Model</p>
                      <p className="text-white font-mono text-xs">{dashboard.host.cpu_model}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Architecture</p>
                      <p className="text-white font-mono">{dashboard.host.architecture}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Uptime</p>
                      <p className="text-white font-mono">{formatUptime(dashboard.current_system_stats.boot_time)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CPU */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-blue-100">
                      <Cpu className="w-5 h-5 mr-2 text-blue-400" />
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-white">
                        {dashboard.current_system_stats.cpu_percent}%
                      </div>
                      <Progress
                        value={dashboard.current_system_stats.cpu_percent}
                        className="bg-blue-900/50"
                      />
                      <div className="text-sm text-blue-200">
                        {dashboard.current_system_stats.cpu_count} cores
                      </div>
                      {dashboard.current_system_stats.cpu_temperature && (
                        <div className="flex items-center text-sm text-blue-200">
                          <Thermometer className="w-4 h-4 mr-1" />
                          {dashboard.current_system_stats.cpu_temperature}°C
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Memory */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-green-100">
                      <MemoryStick className="w-5 h-5 mr-2 text-green-400" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-white">
                        {dashboard.current_system_stats.memory_percent}%
                      </div>
                      <Progress
                        value={dashboard.current_system_stats.memory_percent}
                        className="bg-green-900/50"
                      />
                      <div className="text-sm text-green-200">
                        {formatBytes(dashboard.current_system_stats.memory_used)} / {formatBytes(dashboard.current_system_stats.memory_total)}
                      </div>
                      <div className="text-xs text-green-300">
                        Available: {formatBytes(dashboard.current_system_stats.memory_available)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Disk */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-purple-100">
                      <HardDrive className="w-5 h-5 mr-2 text-purple-400" />
                      Disk Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-white">
                        {dashboard.current_system_stats.disk_percent.toFixed(1)}%
                      </div>
                      <Progress
                        value={dashboard.current_system_stats.disk_percent}
                        className="bg-purple-900/50"
                      />
                      <div className="text-sm text-purple-200">
                        {formatBytes(dashboard.current_system_stats.disk_used)} / {formatBytes(dashboard.current_system_stats.disk_total)}
                      </div>
                      <div className="text-xs text-purple-300">
                        Free: {formatBytes(dashboard.current_system_stats.disk_free)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Network */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-orange-100">
                      <Network className="w-5 h-5 mr-2 text-orange-400" />
                      Network I/O
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-lg font-bold text-white">
                        ↑ {formatBytes(dashboard.current_system_stats.network_bytes_sent)}
                      </div>
                      <div className="text-lg font-bold text-white">
                        ↓ {formatBytes(dashboard.current_system_stats.network_bytes_recv)}
                      </div>
                      <div className="text-sm text-orange-200">
                        Packets: {dashboard.current_system_stats.network_packets_sent.toLocaleString()} / {dashboard.current_system_stats.network_packets_recv.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Containers and Processes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Container Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                      Container Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {dashboard.containers_summary.running}
                        </div>
                        <div className="text-sm text-slate-300">Running</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-400">
                          {dashboard.containers_summary.stopped}
                        </div>
                        <div className="text-sm text-slate-300">Stopped</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {dashboard.containers_summary.total}
                        </div>
                        <div className="text-sm text-slate-300">Total</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {dashboard.containers_summary.paused}
                        </div>
                        <div className="text-sm text-slate-300">Paused</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Processes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Users className="w-5 h-5 mr-2 text-yellow-400" />
                      Top Processes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboard.top_processes.slice(0, 5).map((process) => (
                        <div
                          key={process.id}
                          className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center text-xs text-white font-mono">
                              {process.pid}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {process.name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {process.username}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-white font-mono">
                              {process.memory_percent.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatBytes(process.memory_rss)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* System Load */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Activity className="w-5 h-5 mr-2 text-red-400" />
                    System Load Average
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-white font-mono">
                        {dashboard.current_system_stats.load_avg_1m.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-300">1 minute</div>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-white font-mono">
                        {dashboard.current_system_stats.load_avg_5m.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-300">5 minutes</div>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-white font-mono">
                        {dashboard.current_system_stats.load_avg_15m.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-300">15 minutes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemMonitorPage;