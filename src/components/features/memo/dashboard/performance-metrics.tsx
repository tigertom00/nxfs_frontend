'use client';

import { DashboardStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  Target,
  Gauge,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Zap,
} from 'lucide-react';

interface PerformanceMetricsProps {
  stats: DashboardStats;
}

export function PerformanceMetrics({ stats }: PerformanceMetricsProps) {
  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Calculate performance scores
  const jobPerformanceScore = Math.round(
    (stats.jobs.completion_rate * 0.6 +
     (stats.jobs.completed / Math.max(stats.jobs.total, 1)) * 0.4) * 100
  );

  const materialEfficiencyScore = Math.round(
    (stats.materials.approval_rate * 0.5 +
     (stats.materials.in_stock / Math.max(stats.materials.total, 1)) * 0.3 +
     (1 - stats.materials.discontinued / Math.max(stats.materials.total, 1)) * 0.2) * 100
  );

  const supplierUtilizationScore = Math.round(
    stats.suppliers.utilization_rate * 100
  );

  const overallScore = Math.round(
    (jobPerformanceScore * 0.4 +
     materialEfficiencyScore * 0.4 +
     supplierUtilizationScore * 0.2)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <Progress value={overallScore} className="h-3" />
            </div>
            <Badge variant={getScoreBadgeVariant(overallScore)} className="text-sm">
              {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>

          <Separator />

          {/* Score Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Job Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getScoreColor(jobPerformanceScore)}`}>
                  {jobPerformanceScore}
                </span>
                <Progress value={jobPerformanceScore} className="w-20 h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Material Efficiency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getScoreColor(materialEfficiencyScore)}`}>
                  {materialEfficiencyScore}
                </span>
                <Progress value={materialEfficiencyScore} className="w-20 h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Supplier Utilization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getScoreColor(supplierUtilizationScore)}`}>
                  {supplierUtilizationScore}
                </span>
                <Progress value={supplierUtilizationScore} className="w-20 h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Metrics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Job Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-lg font-bold">{formatPercentage(stats.jobs.completion_rate)}</div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
                <Progress value={stats.jobs.completion_rate * 100} className="h-1" />
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold">{formatHours(stats.jobs.total_hours)}</div>
                <div className="text-xs text-muted-foreground">Total Hours</div>
                <div className="text-xs text-muted-foreground">
                  {stats.jobs.total} jobs total
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Material Metrics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Material Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-lg font-bold">{formatPercentage(stats.materials.approval_rate)}</div>
                <div className="text-xs text-muted-foreground">Approval Rate</div>
                <Progress value={stats.materials.approval_rate * 100} className="h-1" />
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold">
                  {formatPercentage(stats.materials.in_stock / Math.max(stats.materials.total, 1))}
                </div>
                <div className="text-xs text-muted-foreground">In Stock Rate</div>
                <Progress
                  value={(stats.materials.in_stock / Math.max(stats.materials.total, 1)) * 100}
                  className="h-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold">{stats.materials.favorites}</div>
                <div className="text-xs text-muted-foreground">Favorites</div>
              </div>
              <div>
                <div className="text-sm font-bold">{stats.materials.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div>
                <div className="text-sm font-bold text-red-600">{stats.materials.discontinued}</div>
                <div className="text-xs text-muted-foreground">Discontinued</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Utilization Metrics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-600" />
              <span className="font-medium text-sm">Utilization</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Supplier Utilization</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {stats.suppliers.with_materials}/{stats.suppliers.total}
                  </span>
                  <Progress value={stats.suppliers.utilization_rate * 100} className="w-16 h-2" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Category Coverage</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {stats.categories.with_materials}/{stats.categories.total}
                  </span>
                  <Progress value={stats.categories.utilization_rate * 100} className="w-16 h-2" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Time Tracking Activity</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {stats.time_tracking.entries_this_month}
                  </span>
                  <span className="text-xs text-muted-foreground">this month</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}