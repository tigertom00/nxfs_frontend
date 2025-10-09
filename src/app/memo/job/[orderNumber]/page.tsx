'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import { useAuthStore } from '@/stores';
import { jobsAPI, Job, timeTrackingAPI, UserTimeStats } from '@/lib/api';
import { JobHeader } from '@/components/features/memo/job-detail/job-header';
import { TimerWidget } from '@/components/features/memo/job-detail/timer-widget';
import { JobberTaskCard } from '@/components/features/memo/job-detail/jobber-task-card';
import { MaterialManager } from '@/components/features/memo/job-detail/material-manager';
import { PhotoGallery } from '@/components/features/memo/job-detail/photo-gallery';
import { ThemeInitializer } from '@/components/features/memo/shared/theme-initializer';
import { formatMinutesToDecimalHours } from '@/lib/time-utils';
import { TrendingUp } from 'lucide-react';
import { useIntl } from '@/hooks/use-intl';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const { t } = useIntl();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserTimeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load job details
  useEffect(() => {
    const loadJob = async () => {
      if (!orderNumber || !isAuthenticated) {
        return;
      }

      try {
        setLoading(true);
        const jobData = await jobsAPI.getJob(orderNumber);
        setJob(jobData);
      } catch (error) {
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

  // Load user stats for time overview
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user || !job) {
        return;
      }

      try {
        setStatsLoading(true);

        const jobIdToUse = orderNumber || job.ordre_nr;
        const userId = parseInt(user.id);

        // Get time entries for this job (current user)
        const userJobEntries = await timeTrackingAPI.getTimeEntriesByDate({
          jobb: jobIdToUse,
          user_id: userId,
        });

        // Get time entries for this job (all users)
        const allUsersJobEntries = await timeTrackingAPI.getTimeEntriesByDate({
          jobb: jobIdToUse,
        });

        // Calculate stats from the entries
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const calculateStats = (entries: any) => {
          if (!entries || !entries.entries_by_date) {
            return { hours: 0, entries: 0 };
          }

          const entriesArray = Array.isArray(entries.entries_by_date)
            ? entries.entries_by_date
            : Object.values(entries.entries_by_date || {});

          return entriesArray.reduce(
            (acc: any, dateGroup: any) => {
              return {
                hours: acc.hours + (dateGroup.total_hours || 0),
                entries: acc.entries + (dateGroup.entries?.length || 0),
              };
            },
            { hours: 0, entries: 0 }
          );
        };

        const getTodayStats = (entries: any) => {
          if (!entries || !entries.entries_by_date) {
            return { hours: 0, entries: 0 };
          }

          const entriesArray = Array.isArray(entries.entries_by_date)
            ? entries.entries_by_date
            : Object.values(entries.entries_by_date || {});

          const todayGroup = entriesArray.find((g: any) => g.date === today);
          return {
            hours: todayGroup?.total_hours || 0,
            entries: todayGroup?.entries?.length || 0,
          };
        };

        const getYesterdayStats = (entries: any) => {
          if (!entries || !entries.entries_by_date) {
            return { hours: 0, entries: 0 };
          }

          const entriesArray = Array.isArray(entries.entries_by_date)
            ? entries.entries_by_date
            : Object.values(entries.entries_by_date || {});

          const yesterdayGroup = entriesArray.find(
            (g: any) => g.date === yesterday
          );
          return {
            hours: yesterdayGroup?.total_hours || 0,
            entries: yesterdayGroup?.entries?.length || 0,
          };
        };

        // Build stats object for this job
        const stats = {
          today: getTodayStats(userJobEntries),
          yesterday: getYesterdayStats(userJobEntries),
          total_user: calculateStats(userJobEntries),
          total_all_users: calculateStats(allUsersJobEntries),
        };

        setUserStats(stats);
      } catch (error) {
        // Don't show error toast for stats - it's supplementary information
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, [user, job, orderNumber]);

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
          <TimerWidget jobId={parseInt(job.ordre_nr)} ordreNr={job.ordre_nr} />

          {/* Tasks */}
          <JobberTaskCard
            jobId={parseInt(job.ordre_nr)}
            ordreNr={job.ordre_nr}
          />

          {/* Material Manager */}
          <MaterialManager
            jobId={parseInt(job.ordre_nr)}
            ordreNr={job.ordre_nr}
          />

          {/* Photo Gallery */}
          <PhotoGallery jobId={parseInt(job.ordre_nr)} ordreNr={job.ordre_nr} />

          {/* Job Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Job Details</h3>
            <div className="p-4 border rounded-lg bg-card space-y-4 hover-lift">
              <div className="space-y-2">
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
                    <span className="text-sm text-muted-foreground">
                      Phone:
                    </span>
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
                    <p className="font-medium">
                      ⏱️ {formatMinutesToDecimalHours(job.total_hours)}h
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {job.ferdig ? '✅ Completed' : '🚧 In Progress'}
                  </p>
                </div>
              </div>

              {/* Time Overview Section */}
              {userStats && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('memo.timer.timeOverview')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground">
                        {t('memo.timer.todayYou')}
                      </div>
                      <div className="text-sm font-semibold">
                        {(userStats.today.hours / 60).toFixed(1)}t
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userStats.today.entries} {t('memo.timer.entries')}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground">
                        {t('memo.timer.yesterdayYou')}
                      </div>
                      <div className="text-sm font-semibold">
                        {(userStats.yesterday.hours / 60).toFixed(1)}t
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userStats.yesterday.entries} {t('memo.timer.entries')}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground">
                        {t('memo.timer.yourTotal')}
                      </div>
                      <div className="text-sm font-semibold">
                        {(userStats.total_user.hours / 60).toFixed(1)}t
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userStats.total_user.entries} {t('memo.timer.entries')}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground">
                        {t('memo.timer.allUsers')}
                      </div>
                      <div className="text-sm font-semibold">
                        {(userStats.total_all_users.hours / 60).toFixed(1)}t
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userStats.total_all_users.entries}{' '}
                        {t('memo.timer.entries')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {statsLoading && (
                <div className="flex items-center justify-center py-3 border-t">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t('memo.timer.loadingStats')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
