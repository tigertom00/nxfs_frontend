'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { jobsAPI, Job } from '@/lib/api';
import { JobHeader } from '@/components/features/memo/job-detail/job-header';
import { TimerWidget } from '@/components/features/memo/job-detail/timer-widget';
import { MaterialManager } from '@/components/features/memo/job-detail/material-manager';
import { PhotoGallery } from '@/components/features/memo/job-detail/photo-gallery';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import { MobileDebugConsole } from '@/components/shared';
import { formatMinutesToDecimalHours } from '@/lib/time-utils';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load job details
  useEffect(() => {
    const loadJob = async () => {
      if (!orderNumber || !isAuthenticated) return;

      try {
        setLoading(true);
        const jobData = await jobsAPI.getJob(orderNumber);
        setJob(jobData);
      } catch (error) {
        console.error('Failed to load job:', error);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [orderNumber, isAuthenticated]);

  const handleBackToJobs = () => {
    router.push('/memo');
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
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-16 bg-muted rounded mb-4"></div>
            <div className="h-32 bg-muted rounded mb-4"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">
            {error || 'Job not found'}
          </h2>
          <button
            onClick={handleBackToJobs}
            className="text-primary hover:underline"
          >
            ← Back to Jobs
          </button>
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
          {/* Job Header with Navigation */}
          <JobHeader job={job} onBack={handleBackToJobs} />

          {/* Timer Widget */}
          <TimerWidget jobId={job.ordre_nr} />

          {/* Material Manager */}
          <MaterialManager jobId={job.ordre_nr} />

          {/* Photo Gallery */}
          <PhotoGallery jobId={job.ordre_nr} />

          {/* Job Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Job Details</h3>
            <div className="p-4 border rounded-lg bg-card space-y-2">
              {job.adresse && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Address:
                  </span>
                  <p className="font-medium">📍 {job.adresse}</p>
                </div>
              )}
              {job.telefon_nr && (
                <div>
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <p className="font-medium">📞 {job.telefon_nr}</p>
                </div>
              )}
              {job.beskrivelse && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Description:
                  </span>
                  <p className="font-medium">{job.beskrivelse}</p>
                </div>
              )}
              {job.total_hours && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Total Hours:
                  </span>
                  <p className="font-medium">⏱️ {formatMinutesToDecimalHours(job.total_hours)}h</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <p className="font-medium">
                  {job.ferdig ? '✅ Completed' : '🚧 In Progress'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Debug Console for troubleshooting */}
      <MobileDebugConsole />
    </>
  );
}
