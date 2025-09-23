'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { jobsAPI } from '@/lib/api';
import { Job } from '@/types/api';
import { JobSelector } from '@/components/features/memo/landing/job-selector';
import { NewJobModal } from '@/components/features/memo/landing/new-job-modal';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import ChatBot from '@/components/features/chat/chatbot';

export default function MemoPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await jobsAPI.getJobs();
        setJobs(jobsData);

        // Auto-select most recent job if available
        if (jobsData.length > 0) {
          setSelectedJob(jobsData[0]);
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadJobs();
    }
  }, [isAuthenticated]);

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
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              📱 NXFS Memo
            </h1>
            <p className="text-muted-foreground">Work Order Management</p>
          </div>

          {/* Job Selector */}
          <JobSelector
            jobs={jobs}
            selectedJob={selectedJob}
            onJobSelect={handleJobSelect}
            onNewJob={handleNewJob}
            loading={loading}
          />

          {/* Recent Jobs */}
          {jobs.length > 0 && (
            <div className="space-y-3">
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
