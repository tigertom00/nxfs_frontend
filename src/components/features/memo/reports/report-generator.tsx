'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Briefcase,
  Package,
  Clock,
  BarChart3,
  FileText,
  Filter,
  Calendar,
  Download,
} from 'lucide-react';
import { jobsAPI, materialsAPI, timeTrackingAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ReportGeneratorProps {
  onReportGenerated: (type: string, data: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function ReportGenerator({
  onReportGenerated,
  loading,
  setLoading,
}: ReportGeneratorProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [filters, setFilters] = useState({
    jobStatus: 'all',
    materialCategories: [] as string[],
    suppliers: [] as string[],
    users: [] as string[],
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const reportTypes = [
    {
      id: 'job_completion',
      name: 'Job Completion Report',
      description: 'Analyze job completion rates, timelines, and efficiency',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      metrics: [
        'completion_rate',
        'average_completion_time',
        'total_hours',
        'job_distribution',
        'efficiency_trends',
      ],
    },
    {
      id: 'material_usage',
      name: 'Material Usage Report',
      description: 'Track material consumption, costs, and inventory trends',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      metrics: [
        'usage_frequency',
        'cost_analysis',
        'inventory_levels',
        'supplier_breakdown',
        'category_trends',
      ],
    },
    {
      id: 'time_tracking',
      name: 'Time Tracking Report',
      description: 'Analyze time allocation, productivity, and labor costs',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      metrics: [
        'total_hours',
        'productivity_score',
        'time_distribution',
        'cost_per_hour',
        'efficiency_trends',
      ],
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      description: 'Complete overview combining all aspects of operations',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      metrics: [
        'overall_performance',
        'key_metrics',
        'trend_analysis',
        'recommendations',
        'executive_summary',
      ],
    },
  ];

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDateThirtyDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const handleDateRangeQuickSelect = (range: string) => {
    const endDate = getCurrentDate();
    let startDate = '';

    switch (range) {
      case 'last_7_days':
        const date7 = new Date();
        date7.setDate(date7.getDate() - 7);
        startDate = date7.toISOString().split('T')[0];
        break;
      case 'last_30_days':
        startDate = getDateThirtyDaysAgo();
        break;
      case 'last_90_days':
        const date90 = new Date();
        date90.setDate(date90.getDate() - 90);
        startDate = date90.toISOString().split('T')[0];
        break;
      case 'this_month':
        const thisMonth = new Date();
        thisMonth.setDate(1);
        startDate = thisMonth.toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        startDate = lastMonth.toISOString().split('T')[0];
        const lastMonthEnd = new Date(lastMonth);
        lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
        lastMonthEnd.setDate(0);
        setDateRange({
          startDate: startDate,
          endDate: lastMonthEnd.toISOString().split('T')[0],
        });
        return;
    }

    setDateRange({ startDate, endDate });
  };

  const generateMockReport = async (type: string) => {
    // Since we don't have the actual API endpoints yet, let's generate mock data
    // based on the existing API data we can fetch

    setLoading(true);
    try {
      let reportData;

      switch (type) {
        case 'job_completion':
          // Fetch jobs data and create a completion report
          const jobs = await jobsAPI.getJobs({
            created_after: dateRange.startDate,
            created_before: dateRange.endDate,
          });

          let jobsArray = Array.isArray(jobs) ? jobs : jobs.results || [];

          // Apply job status filter
          if (filters.jobStatus === 'active') {
            jobsArray = jobsArray.filter((job) => !job.ferdig);
          } else if (filters.jobStatus === 'completed') {
            jobsArray = jobsArray.filter((job) => job.ferdig);
          }
          // If filters.jobStatus === 'all', use all jobs (no filtering)

          const completedJobs = jobsArray.filter((job) => job.ferdig);
          const activeJobs = jobsArray.filter((job) => !job.ferdig);

          reportData = {
            period: {
              start_date: dateRange.startDate,
              end_date: dateRange.endDate,
            },
            summary: {
              total_jobs: jobsArray.length,
              completed_jobs: completedJobs.length,
              active_jobs: activeJobs.length,
              completion_rate:
                jobsArray.length > 0
                  ? completedJobs.length / jobsArray.length
                  : 0,
              total_hours: jobsArray.reduce(
                (sum, job) => sum + (job.total_hours || 0),
                0
              ),
              average_completion_time:
                completedJobs.length > 0
                  ? completedJobs.reduce(
                      (sum, job) => sum + (job.total_hours || 0),
                      0
                    ) / completedJobs.length
                  : 0,
            },
            jobs_by_status: {
              completed: completedJobs,
              active: activeJobs,
            },
            trends: {
              daily_completions: generateMockTrendData(
                dateRange.startDate,
                dateRange.endDate
              ),
            },
          };
          break;

        case 'material_usage':
          // Fetch materials data and create usage report
          const materials = await materialsAPI.getMaterials();
          const materialsArray = Array.isArray(materials)
            ? materials
            : materials.results || [];

          reportData = {
            period: {
              start_date: dateRange.startDate,
              end_date: dateRange.endDate,
            },
            summary: {
              total_materials_used: materialsArray.length,
              unique_materials: materialsArray.length,
              total_cost: materialsArray.length * 125.5, // Mock cost
              most_used_category:
                materialsArray[0]?.kategori?.kategori || 'Unknown',
            },
            top_materials: materialsArray
              .slice(0, 10)
              .map((material, index) => ({
                material,
                usage_count: Math.floor(Math.random() * 50) + 1,
                total_quantity: Math.floor(Math.random() * 100) + 10,
                jobs_used_in: Math.floor(Math.random() * 20) + 1,
              })),
            usage_by_category: generateMockCategoryUsage(materialsArray),
            cost_analysis: materialsArray.slice(0, 5).map((material) => ({
              material_id: material.id,
              material_name: material.tittel || 'Unknown',
              total_cost: Math.random() * 1000 + 100,
              usage_count: Math.floor(Math.random() * 30) + 1,
              cost_per_use: Math.random() * 50 + 5,
            })),
          };
          break;

        case 'time_tracking':
          // Fetch time tracking data
          const timeEntries = await timeTrackingAPI.getTimeEntries({
            dato_after: dateRange.startDate,
            dato_before: dateRange.endDate,
          });

          const timeArray = Array.isArray(timeEntries)
            ? timeEntries
            : timeEntries.results || [];
          const totalHours = timeArray.reduce(
            (sum, entry) => sum + (entry.timer || 0),
            0
          );

          reportData = {
            period: {
              start_date: dateRange.startDate,
              end_date: dateRange.endDate,
            },
            summary: {
              total_hours: totalHours,
              total_entries: timeArray.length,
              average_daily_hours:
                totalHours /
                getDaysBetweenDates(dateRange.startDate, dateRange.endDate),
              most_productive_day: getMostProductiveDay(timeArray),
            },
            time_by_job: generateTimeByJobData(timeArray),
            time_by_user: generateTimeByUserData(timeArray),
            daily_breakdown: generateDailyTimeBreakdown(
              timeArray,
              dateRange.startDate,
              dateRange.endDate
            ),
          };
          break;

        case 'comprehensive':
          // Generate comprehensive report combining all data
          reportData = {
            period: {
              start_date: dateRange.startDate,
              end_date: dateRange.endDate,
            },
            executive_summary: {
              total_jobs: 45,
              completion_rate: 0.78,
              total_materials: 234,
              total_hours: 312.5,
              overall_efficiency: 0.85,
            },
            key_metrics: generateMockKeyMetrics(),
            trends: generateMockTrendData(
              dateRange.startDate,
              dateRange.endDate
            ),
            recommendations: [
              'Increase material inventory for high-usage items',
              'Optimize job scheduling to improve completion rates',
              'Consider additional training for time management',
              'Review supplier contracts for cost optimization',
            ],
          };
          break;

        default:
          throw new Error('Unknown report type');
      }

      onReportGenerated(type, reportData);
      toast({
        title: 'Report Generated',
        description: `${reportTypes.find((r) => r.id === type)?.name} has been generated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for mock data generation
  const generateMockTrendData = (startDate: string, endDate: string) => {
    const days = getDaysBetweenDates(startDate, endDate);
    const trends: Array<{
      date: string;
      completed: number;
      started: number;
    }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      trends.push({
        date: date.toISOString().split('T')[0],
        completed: Math.floor(Math.random() * 5) + 1,
        started: Math.floor(Math.random() * 3) + 1,
      });
    }
    return trends;
  };

  const generateMockCategoryUsage = (materials: any[]) => {
    const categories = [
      ...new Set(materials.map((m) => m.kategori?.kategori).filter(Boolean)),
    ];
    return categories.map((category) => ({
      category: category || 'Unknown',
      material_count: materials.filter((m) => m.kategori?.kategori === category)
        .length,
      usage_count: Math.floor(Math.random() * 100) + 10,
    }));
  };

  const generateTimeByJobData = (timeEntries: any[]) => {
    const jobGroups = timeEntries.reduce((acc, entry) => {
      const jobId = entry.jobb;
      if (!acc[jobId]) {
        acc[jobId] = { entries: [], totalHours: 0 };
      }
      acc[jobId].entries.push(entry);
      acc[jobId].totalHours += entry.timer || 0;
      return acc;
    }, {});

    return Object.entries(jobGroups).map(([jobId, data]: [string, any]) => ({
      job: { ordre_nr: jobId, tittel: `Job ${jobId}` },
      total_hours: data.totalHours,
      entries_count: data.entries.length,
      efficiency_score: Math.random() * 0.4 + 0.6, // 0.6-1.0
    }));
  };

  const generateTimeByUserData = (timeEntries: any[]) => {
    const userGroups = timeEntries.reduce((acc, entry) => {
      const userId = entry.user;
      if (!acc[userId]) {
        acc[userId] = { entries: [], totalHours: 0 };
      }
      acc[userId].entries.push(entry);
      acc[userId].totalHours += entry.timer || 0;
      return acc;
    }, {});

    return Object.entries(userGroups).map(([userId, data]: [string, any]) => ({
      user_id: parseInt(userId),
      user_name: `User ${userId}`,
      total_hours: data.totalHours,
      entries_count: data.entries.length,
    }));
  };

  const generateDailyTimeBreakdown = (
    timeEntries: any[],
    startDate: string,
    endDate: string
  ) => {
    const days = getDaysBetweenDates(startDate, endDate);
    const breakdown: Array<{
      date: string;
      hours: number;
      entries: number;
    }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEntries = timeEntries.filter((entry) => entry.dato === dateStr);
      const dayHours = dayEntries.reduce(
        (sum, entry) => sum + (entry.timer || 0),
        0
      );

      breakdown.push({
        date: dateStr,
        hours: dayHours,
        entries: dayEntries.length,
      });
    }

    return breakdown;
  };

  const generateMockKeyMetrics = () => [
    { name: 'Job Completion Rate', value: '78%', trend: 'up', change: '+5%' },
    {
      name: 'Average Hours per Job',
      value: '6.9h',
      trend: 'down',
      change: '-2%',
    },
    { name: 'Material Efficiency', value: '92%', trend: 'up', change: '+3%' },
    { name: 'Cost per Job', value: '€1,245', trend: 'down', change: '-8%' },
  ];

  const getDaysBetweenDates = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMostProductiveDay = (timeEntries: any[]) => {
    const dayGroups = timeEntries.reduce((acc, entry) => {
      const day = new Date(entry.dato).toLocaleDateString('en-US', {
        weekday: 'long',
      });
      acc[day] = (acc[day] || 0) + (entry.timer || 0);
      return acc;
    }, {});

    return (
      Object.entries(dayGroups).reduce((a, b) =>
        dayGroups[a[0]] > dayGroups[b[0]] ? a : b
      )[0] || 'Monday'
    );
  };

  const canGenerateReport = () => {
    return reportType && dateRange.startDate && dateRange.endDate;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Report Type Selection */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Report Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    reportType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setReportType(type.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${type.bgColor}`}>
                      <type.icon className={`h-4 w-4 ${type.color}`} />
                    </div>
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {type.metrics.slice(0, 3).map((metric) => (
                      <Badge key={metric} variant="outline" className="text-xs">
                        {metric.replace('_', ' ')}
                      </Badge>
                    ))}
                    {type.metrics.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{type.metrics.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Last 7 Days', value: 'last_7_days' },
                  { label: 'Last 30 Days', value: 'last_30_days' },
                  { label: 'Last 90 Days', value: 'last_90_days' },
                  { label: 'This Month', value: 'this_month' },
                  { label: 'Last Month', value: 'last_month' },
                ].map((range) => (
                  <Button
                    key={range.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangeQuickSelect(range.value)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration & Generate */}
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job Status</Label>
              <Select
                value={filters.jobStatus}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, jobStatus: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="completed">Completed only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Include Metrics</Label>
              <div className="space-y-2">
                {reportType &&
                  reportTypes
                    .find((r) => r.id === reportType)
                    ?.metrics.map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric}
                          checked={selectedMetrics.includes(metric)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMetrics((prev) => [...prev, metric]);
                            } else {
                              setSelectedMetrics((prev) =>
                                prev.filter((m) => m !== metric)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={metric} className="text-sm">
                          {metric
                            .replace('_', ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              className="w-full"
              onClick={() => generateMockReport(reportType)}
              disabled={!canGenerateReport() || loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            {!canGenerateReport() && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Select report type and date range to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
