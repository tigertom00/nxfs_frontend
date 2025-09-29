'use client';

import { DashboardStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  Package,
  Building2,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardOverviewProps {
  stats: DashboardStats;
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const overviewCards = [
    {
      title: 'Total Jobs',
      value: stats.jobs.total,
      subtitle: `${stats.jobs.active} active, ${stats.jobs.completed} completed`,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      progress: stats.jobs.completion_rate * 100,
      progressLabel: 'Completion Rate',
    },
    {
      title: 'Total Hours',
      value: formatHours(stats.jobs.total_hours),
      subtitle: `Across all projects`,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      progress: Math.min(100, (stats.jobs.total_hours / 1000) * 100),
      progressLabel: 'Utilization',
    },
    {
      title: 'Materials',
      value: stats.materials.total,
      subtitle: `${stats.materials.favorites} favorites, ${stats.materials.approved} approved`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      progress: stats.materials.approval_rate * 100,
      progressLabel: 'Approval Rate',
    },
    {
      title: 'Suppliers',
      value: stats.suppliers.total,
      subtitle: `${stats.suppliers.with_materials} with materials`,
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      progress: stats.suppliers.utilization_rate * 100,
      progressLabel: 'Utilization Rate',
    },
    {
      title: 'Categories',
      value: stats.categories.total,
      subtitle: `${stats.categories.with_materials} with materials`,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      progress: stats.categories.utilization_rate * 100,
      progressLabel: 'Coverage',
    },
    {
      title: 'Time Entries',
      value: stats.time_tracking.total_entries,
      subtitle: `${stats.time_tracking.entries_this_month} this month`,
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900',
      progress: Math.min(100, (stats.time_tracking.entries_this_month / 100) * 100),
      progressLabel: 'Monthly Activity',
    },
    {
      title: 'In Stock',
      value: stats.materials.in_stock,
      subtitle: `${stats.materials.discontinued} discontinued`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      progress: (stats.materials.in_stock / stats.materials.total) * 100,
      progressLabel: 'Stock Rate',
    },
    {
      title: 'Performance',
      value: formatPercentage(stats.jobs.completion_rate),
      subtitle: 'Job completion rate',
      icon: TrendingUp,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100 dark:bg-rose-900',
      progress: stats.jobs.completion_rate * 100,
      progressLabel: 'Efficiency',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {overviewCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{card.progressLabel}</span>
                    <span className="font-medium">{Math.round(card.progress)}%</span>
                  </div>
                  <Progress
                    value={card.progress}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}