'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import ChatBot from '@/components/features/chat/chatbot';
import { ReportGenerator } from '@/components/features/memo/reports/report-generator';
import { ReportViewer } from '@/components/features/memo/reports/report-viewer';
import { ReportTemplates } from '@/components/features/memo/reports/report-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  BarChart3,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MemoReportsPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  const handleReportGenerated = (type: string, data: any) => {
    setSelectedReport(type);
    setReportData(data);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Trigger refresh of current report if one is selected
    if (selectedReport && reportData) {
      // This would re-generate the current report
      setTimeout(() => setRefreshing(false), 1000);
    } else {
      setRefreshing(false);
    }
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
                📊 Reports & Analytics
              </h1>
              <p className="text-muted-foreground">
                Generate comprehensive reports and export data
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
                onClick={() => router.push('/memo/dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/memo')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Report types</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Export Formats</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">CSV, PDF, Excel</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Date Range</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Custom</div>
                <p className="text-xs text-muted-foreground">Flexible periods</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filters</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Advanced</div>
                <p className="text-xs text-muted-foreground">Multi-criteria</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Reports Interface */}
          <Tabs defaultValue="generator" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Generate Reports
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="viewer" className="flex items-center gap-2" disabled={!reportData}>
                <Download className="h-4 w-4" />
                View Results
                {reportData && (
                  <Badge variant="secondary" className="ml-1">
                    Ready
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Report Generator Tab */}
            <TabsContent value="generator" className="space-y-6">
              <ReportGenerator
                onReportGenerated={handleReportGenerated}
                loading={loading}
                setLoading={setLoading}
              />
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <ReportTemplates
                onTemplateSelected={(template) => {
                  // Handle template selection
                  console.log('Template selected:', template);
                }}
              />
            </TabsContent>

            {/* Report Viewer Tab */}
            <TabsContent value="viewer" className="space-y-6">
              {reportData ? (
                <ReportViewer
                  reportType={selectedReport}
                  reportData={reportData}
                  onExport={(format) => {
                    console.log('Export format:', format);
                    // Handle export
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Report Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate a report first to view and export results.
                      </p>
                      <Button
                        onClick={() => {
                          const tabs = document.querySelector('[value="generator"]') as HTMLElement;
                          tabs?.click();
                        }}
                      >
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      <ChatBot />
    </>
  );
}