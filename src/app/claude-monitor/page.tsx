'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore } from '@/stores';
import { claudeUsageAPI, type DashboardData } from '@/lib/api';
import { UsageMetrics } from '@/components/features/claude-usage/usage-metrics';
import { TimeToReset } from '@/components/features/claude-usage/time-to-reset';
import { BurnRateDisplay } from '@/components/features/claude-usage/burn-rate-display';
import { ModelDistributionChart } from '@/components/features/claude-usage/model-distribution-chart';
import { TokenUsageGraph } from '@/components/features/claude-usage/token-usage-graph';
import { toast } from 'sonner';

export default function ClaudeMonitorPage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Authentication check
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    if (hasError && !loading) return; // Don't retry if already errored

    try {
      const dashboardData = await claudeUsageAPI.getDashboard(6);
      setData(dashboardData);
      setHasError(false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch Claude usage data:', error);
      setHasError(true);
      // Only show toast on initial load, not on refresh
      if (loading) {
        toast.error('Claude Usage API is not available. Please check if the backend endpoint is configured.');
      }
      setLoading(false);
      setAutoRefresh(false); // Stop auto-refresh on error
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || hasError) return;

    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, hasError]);

  // Loading state
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to sign in
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                ✦ ✧ ✦ ✧ CLAUDE CODE USAGE MONITOR ✧ ✦ ✧ ✦
              </h1>
            </div>
            <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                API Not Available
              </h2>
              <p className="text-muted-foreground mb-4">
                The Claude Usage API endpoint is not responding. This could mean:
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-2 mb-6">
                <li>• The backend service is not running</li>
                <li>• The API endpoint needs to be configured</li>
                <li>• There's no usage data available yet</li>
              </ul>
              <button
                onClick={() => {
                  setHasError(false);
                  setLoading(true);
                  setAutoRefresh(true);
                  fetchDashboard();
                }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </motion.div>
        </main>
        <ChatBot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                ✦ ✧ ✦ ✧ CLAUDE CODE USAGE MONITOR ✧ ✦ ✧ ✦
              </h1>
              <p className="text-muted-foreground">
                Real-time monitoring of Claude API usage and rate limits
              </p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                autoRefresh
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {autoRefresh ? '▶ Live' : '⏸ Paused'}
            </button>
          </div>

          {/* Critical Info - Time to Reset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <TimeToReset rateLimit={data.rate_limit} />
          </motion.div>

          {/* Usage Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <UsageMetrics
              summary={data.summary}
              rateLimit={data.rate_limit}
            />
          </motion.div>

          {/* Burn Rate & Model Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BurnRateDisplay
                burnRate={data.burn_rate}
                predictions={data.rate_limit.predictions}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ModelDistributionChart models={data.model_distribution} />
            </motion.div>
          </div>

          {/* Token Usage Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TokenUsageGraph />
          </motion.div>
        </motion.div>
      </main>
      <ChatBot />
    </div>
  );
}
