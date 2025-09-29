'use client';

import { DashboardStats as StatsType } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  Package,
  Briefcase,
  Building2,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface DashboardStatsProps {
  stats: StatsType;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Detailed Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Jobs Statistics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Jobs Overview</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Jobs</span>
                <Badge variant="outline">{stats.jobs.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {stats.jobs.active}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {stats.jobs.completed}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{formatPercentage(stats.jobs.completion_rate)}</span>
                </div>
                <Progress value={stats.jobs.completion_rate * 100} className="h-2" />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Total: {formatHours(stats.jobs.total_hours)}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Materials Statistics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-600" />
            <span className="font-medium">Materials Overview</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Materials</span>
                <Badge variant="outline">{stats.materials.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Favorites</span>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <Star className="h-3 w-3 mr-1" />
                  {stats.materials.favorites}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats.materials.approved}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In Stock</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {stats.materials.in_stock}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Discontinued</span>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.materials.discontinued}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Approval Rate</div>
              <div className="space-y-1">
                <div className="text-lg font-bold">{formatPercentage(stats.materials.approval_rate)}</div>
                <Progress value={stats.materials.approval_rate * 100} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                Stock Rate: {formatPercentage(stats.materials.in_stock / stats.materials.total)}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Suppliers & Categories */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Suppliers</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="outline">{stats.suppliers.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">With Materials</span>
                <Badge variant="secondary">{stats.suppliers.with_materials}</Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Utilization Rate</div>
                <Progress value={stats.suppliers.utilization_rate * 100} className="h-2" />
                <div className="text-xs text-right">{formatPercentage(stats.suppliers.utilization_rate)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Categories</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="outline">{stats.categories.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">With Materials</span>
                <Badge variant="secondary">{stats.categories.with_materials}</Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Coverage</div>
                <Progress value={stats.categories.utilization_rate * 100} className="h-2" />
                <div className="text-xs text-right">{formatPercentage(stats.categories.utilization_rate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Tracking */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            <span className="font-medium">Time Tracking</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Entries</span>
              <Badge variant="outline">{stats.time_tracking.total_entries}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                {stats.time_tracking.entries_this_month}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}