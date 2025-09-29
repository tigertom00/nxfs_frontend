'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { jobsAPI, Job, JobSearchParams } from '@/lib/api';
import { JobSelector } from '@/components/features/memo/landing/job-selector';
import { NewJobModal } from '@/components/features/memo/landing/new-job-modal';
import { JobSearchFilters } from '@/components/features/memo/landing/job-search-filters';
import { JobListView } from '@/components/features/memo/landing/job-list-view';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import ChatBot from '@/components/features/chat/chatbot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Grid, List } from 'lucide-react';

export default function MemoPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'mobile' | 'list'>('mobile');

  // Search and filter state
  const [searchParams, setSearchParams] = useState<JobSearchParams>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load jobs with search/filter parameters
  const loadJobs = async (params: JobSearchParams = {}, page: number = 1) => {
    try {
      setLoading(true);

      // Build search parameters
      const searchParameters: JobSearchParams = {
        ...params,
        page,
        page_size: pageSize,
      };

      // Add status filter
      if (statusFilter !== 'all') {
        searchParameters.ferdig = statusFilter === 'completed';
      }

      // Add search query
      if (searchQuery.trim()) {
        searchParameters.search = searchQuery.trim();
      }

      const jobsData = await jobsAPI.getJobs(searchParameters);

      // Handle paginated vs non-paginated response
      if (typeof jobsData === 'object' && 'results' in jobsData) {
        // Paginated response
        setJobs(jobsData.results);
        setTotalCount(jobsData.count);
        setTotalPages(Math.ceil(jobsData.count / pageSize));
      } else {
        // Direct array response
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setTotalCount(jobsData.length);
        setTotalPages(1);
      }

      // Auto-select most recent job if available and in mobile mode
      if (viewMode === 'mobile' && jobs.length > 0) {
        setSelectedJob(jobs[0]);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load jobs on component mount and when parameters change
  useEffect(() => {
    if (isAuthenticated) {
      loadJobs(searchParams, currentPage);
    }
  }, [isAuthenticated, searchParams, currentPage, searchQuery, statusFilter]);

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    // Navigate to job detail view
    router.push(`/memo/job/${job.ordre_nr}`);
  };

  const handleNewJob = () => {
    setShowNewJobModal(true);
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs([newJob, ...jobs]);
    setSelectedJob(newJob);
    setShowNewJobModal(false);
    // Navigate to the new job
    router.push(`/memo/job/${newJob.ordre_nr}`);
  };

  // Search and filter handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'completed') => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    loadJobs(searchParams, currentPage);
  };

  // Get stats for current filter
  const getJobStats = () => {
    const activeJobs = jobs.filter(job => !job.ferdig).length;
    const completedJobs = jobs.filter(job => job.ferdig).length;
    return { activeJobs, completedJobs, totalJobs: jobs.length };
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

  const stats = getJobStats();

  return (
    <>
      <ThemeInitializer />
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                📱 NXFS Memo
              </h1>
              <p className="text-muted-foreground">Work Order Management</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Grid className="h-4 w-4 mr-2" />
                Mobile View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
              <Button onClick={handleNewJob}>
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalJobs} in current view
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.activeJobs}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
                <p className="text-xs text-muted-foreground">Finished</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentPage}</div>
                <p className="text-xs text-muted-foreground">of {totalPages}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <JobSearchFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilter}
            totalCount={totalCount}
            loading={loading}
            onRefresh={handleRefresh}
          />

          {/* View Content */}
          {viewMode === 'mobile' ? (
            <div className="max-w-md mx-auto">
              {/* Mobile View - Original Design */}
              <JobSelector
                jobs={jobs}
                selectedJob={selectedJob}
                onJobSelect={handleJobSelect}
                onNewJob={handleNewJob}
                loading={loading}
              />

              {/* Recent Jobs */}
              {jobs.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-lg font-semibold">Recent Jobs</h3>
                  <div className="space-y-2">
                    {jobs.slice(0, 5).map((job) => (
                      <button
                        key={job.ordre_nr}
                        onClick={() => handleJobSelect(job)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors hover-lift"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">Job #{job.ordre_nr}</span>
                            {job.tittel && (
                              <span className="text-muted-foreground">
                                {' '}
                                - {job.tittel}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.adresse && job.adresse.split(',')[0]}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* List View - Advanced Table */
            <JobListView
              jobs={jobs}
              loading={loading}
              onJobSelect={handleJobSelect}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {/* New Job Modal */}
          <NewJobModal
            isOpen={showNewJobModal}
            onClose={() => setShowNewJobModal(false)}
            onJobCreated={handleJobCreated}
          />
        </div>
      </div>
      <ChatBot />
    </>
  );
}
