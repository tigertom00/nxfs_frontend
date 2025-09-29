'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { dashboardAPI, DashboardStats, RecentActivity } from '@/lib/api';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import ChatBot from '@/components/features/chat/chatbot';
import { DashboardOverview } from '@/components/features/memo/dashboard/dashboard-overview';
import { DashboardStats as DashboardStatsComponent } from '@/components/features/memo/dashboard/dashboard-stats';
import { RecentActivityFeed } from '@/components/features/memo/dashboard/recent-activity-feed';
import { QuickActionsPanel } from '@/components/features/memo/dashboard/quick-actions-panel';
import { PerformanceMetrics } from '@/components/features/memo/dashboard/performance-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  RefreshCw,
  ExternalLink,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MemoDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [quickAccess, setQuickAccess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);

      const [statsData, activityData, quickAccessData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getQuickAccess(),
      ]);

      setDashboardStats(statsData);
      setRecentActivity(activityData);
      setQuickAccess(quickAccessData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Show loading or redirect while checking auth
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <ThemeInitializer />
        <Navbar />
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-muted rounded"></div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                📊 Memo Dashboard
              </h1>
              <p className="text-muted-foreground">
                Work order management overview and analytics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/memo/reports')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/memo')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to Jobs
              </Button>
            </div>
          </div>

          {/* Dashboard Overview Stats */}
          {dashboardStats && (
            <DashboardOverview stats={dashboardStats} />
          )}

          {/* Main Dashboard Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="quickactions" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Stats */}
                {dashboardStats && (
                  <DashboardStatsComponent stats={dashboardStats} />
                )}

                {/* Recent Activity */}
                {recentActivity && (
                  <RecentActivityFeed activity={recentActivity} />
                )}
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {dashboardStats && (
                <PerformanceMetrics stats={dashboardStats} />
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              {recentActivity && (
                <div className="grid grid-cols-1 gap-6">
                  <RecentActivityFeed activity={recentActivity} expanded />
                </div>
              )}
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="quickactions" className="space-y-6">
              {quickAccess && (
                <QuickActionsPanel quickAccess={quickAccess} />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      <ChatBot />
    </>
  );
}