'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Package,
  Briefcase,
  Users,
  DollarSign,
} from 'lucide-react';

interface ReportViewerProps {
  reportType: string;
  reportData: any;
  onExport: (format: 'csv' | 'pdf' | 'excel') => void;
}

export function ReportViewer({
  reportType,
  reportData,
  onExport,
}: ReportViewerProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>(
    'pdf'
  );

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('no-NO', { minimumFractionDigits: 2 })}`;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO');
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const handleExport = () => {
    // Simulate export process
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExport(exportFormat);
  };

  const renderJobCompletionReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.total_jobs}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.summary.completed_jobs} completed,{' '}
              {reportData.summary.active_jobs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(reportData.summary.completion_rate)}
            </div>
            <Progress
              value={reportData.summary.completion_rate * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(reportData.summary.total_hours)}
            </div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Completion Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(reportData.summary.average_completion_time)}
            </div>
            <p className="text-xs text-muted-foreground">Per job</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ...reportData.jobs_by_status.completed,
                ...reportData.jobs_by_status.active,
              ]
                .slice(0, 10)
                .map((job) => (
                  <TableRow key={job.ordre_nr}>
                    <TableCell className="font-medium">
                      #{job.ordre_nr}
                    </TableCell>
                    <TableCell>{job.tittel || 'Untitled'}</TableCell>
                    <TableCell>
                      <Badge variant={job.ferdig ? 'default' : 'secondary'}>
                        {job.ferdig ? 'Completed' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatHours(job.total_hours || 0)}</TableCell>
                    <TableCell>{formatDate(job.created_at)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderMaterialUsageReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materials Used
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.total_materials_used}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.summary.unique_materials} unique items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.summary.total_cost)}
            </div>
            <p className="text-xs text-muted-foreground">Material costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {reportData.summary.most_used_category}
            </div>
            <p className="text-xs text-muted-foreground">Most used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <Progress value={92} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Top Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Top Used Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>EL-Number</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Jobs Used In</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.top_materials.slice(0, 8).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.material.tittel || 'Unknown Material'}
                  </TableCell>
                  <TableCell>
                    {item.material.el_nr && (
                      <Badge variant="outline">{item.material.el_nr}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.usage_count}</TableCell>
                  <TableCell>{item.total_quantity}</TableCell>
                  <TableCell>{item.jobs_used_in}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Cost per Use</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.cost_analysis.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.material_name}
                  </TableCell>
                  <TableCell>{formatCurrency(item.total_cost)}</TableCell>
                  <TableCell>{item.usage_count}</TableCell>
                  <TableCell>{formatCurrency(item.cost_per_use)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderTimeTrackingReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(reportData.summary.total_hours)}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.summary.total_entries} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(reportData.summary.average_daily_hours)}
            </div>
            <p className="text-xs text-muted-foreground">Per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Productive
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {reportData.summary.most_productive_day}
            </div>
            <p className="text-xs text-muted-foreground">Day of week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Time by Job */}
      <Card>
        <CardHeader>
          <CardTitle>Time by Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Efficiency Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.time_by_job.slice(0, 8).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    #{item.job.ordre_nr} - {item.job.tittel}
                  </TableCell>
                  <TableCell>{formatHours(item.total_hours)}</TableCell>
                  <TableCell>{item.entries_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{formatPercentage(item.efficiency_score)}</span>
                      <Progress
                        value={item.efficiency_score * 100}
                        className="w-16 h-2"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderComprehensiveReport = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {reportData.executive_summary.total_jobs}
              </div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatPercentage(reportData.executive_summary.completion_rate)}
              </div>
              <div className="text-sm text-muted-foreground">
                Completion Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {reportData.executive_summary.total_materials}
              </div>
              <div className="text-sm text-muted-foreground">Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatHours(reportData.executive_summary.total_hours)}
              </div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatPercentage(
                  reportData.executive_summary.overall_efficiency
                )}
              </div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.key_metrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{metric.name}</div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.trend)}
                  <span
                    className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span>{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportContent = () => {
    switch (reportType) {
      case 'job_completion':
        return renderJobCompletionReport();
      case 'material_usage':
        return renderMaterialUsageReport();
      case 'time_tracking':
        return renderTimeTrackingReport();
      case 'comprehensive':
        return renderComprehensiveReport();
      default:
        return <div>Unknown report type</div>;
    }
  };

  const getReportTitle = () => {
    const titles = {
      job_completion: 'Job Completion Report',
      material_usage: 'Material Usage Report',
      time_tracking: 'Time Tracking Report',
      comprehensive: 'Comprehensive Report',
    };
    return titles[reportType] || 'Report';
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {getReportTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Period: {formatDate(reportData.period.start_date)} -{' '}
                {formatDate(reportData.period.end_date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as 'csv' | 'pdf' | 'excel')
                }
                className="border border-border rounded px-3 py-1 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
              <Button
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
}
