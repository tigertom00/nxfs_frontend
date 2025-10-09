'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  timeEntriesAPI,
  timeTrackingAPI,
  timerSessionAPI,
  ActiveTimerSession,
} from '@/lib/api';
import { UserTimeStats } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Play, Square, Clock, List, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIntl } from '@/hooks/use-intl';
import { TimeEntriesList } from './time-entries-list';
import { TimerStopModal } from './timer-stop-modal';
import {
  roundSecondsToNearestHalfHour,
  formatSecondsToTimeString,
} from '@/lib/time-utils';

interface TimerWidgetProps {
  jobId: number;
  ordreNr?: string; // Order number for API filtering
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsed: number; // seconds
  serverSessionId: number | null; // Server session ID
  serverStartTime: string | null; // ISO timestamp from server
}

export function TimerWidget({ jobId, ordreNr }: TimerWidgetProps) {
  const { toast } = useToast();
  const { t } = useIntl();
  const { user } = useAuthStore();
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    startTime: null,
    elapsed: 0,
    serverSessionId: null,
    serverStartTime: null,
  });
  const [activeTab, setActiveTab] = useState('timer');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showStopModal, setShowStopModal] = useState(false);
  const [userStats, setUserStats] = useState<UserTimeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationRef = useRef<Notification | null>(null);

  // Load active timer session from server on mount
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!user) {
        return;
      }

      try {
        const activeSession = await timerSessionAPI.getActiveTimerSession();

        if (activeSession) {
          // Check if this session is for the current job
          const sessionJobId = ordreNr || jobId.toString();

          if (activeSession.jobb === sessionJobId) {
            // Restore timer from server session
            setTimer({
              isRunning: true,
              isPaused: activeSession.is_paused || false,
              startTime: Date.now(), // Local timestamp for display updates
              elapsed: activeSession.elapsed_seconds,
              serverSessionId: activeSession.id,
              serverStartTime: activeSession.start_time,
            });

            toast({
              title: 'Timer resumed',
              description: `Resumed timer from server (${formatSecondsToTimeString(activeSession.elapsed_seconds)} elapsed)`,
            });
          } else {
            // Active session for a different job - inform user
            toast({
              title: 'Active timer on another job',
              description: `You have an active timer on job ${activeSession.jobb}. Stop it before starting a new one.`,
              variant: 'destructive',
            });
          }
        } else {
          // No active session - try to restore from localStorage as fallback
          try {
            if (typeof Storage !== 'undefined') {
              const savedTimer = localStorage.getItem(`timer-${jobId}`);
              if (savedTimer) {
                const parsed = JSON.parse(savedTimer);
                // Only restore if it has a server session ID (old format without server ID is ignored)
                if (parsed.serverSessionId) {
                  // Verify with server that this session still exists
                  // If not, clear localStorage
                  localStorage.removeItem(`timer-${jobId}`);
                }
              }
            }
          } catch (storageError) {
            // Ignore localStorage errors
          }
        }
      } catch (error) {
        // Failed to load from server - not critical
        console.error('Failed to load active timer session:', error);
      }
    };

    loadActiveSession();
  }, [jobId, ordreNr, user]);

  // Save timer state whenever it changes
  useEffect(() => {
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.setItem(`timer-${jobId}`, JSON.stringify(timer));
      }
    } catch (storageError) {}
  }, [timer, jobId]);

  // Update timer display every second when running (but not when paused)
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused && timer.startTime) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => ({
          ...prev,
          elapsed: prev.elapsed + 1,
        }));
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (intervalRef.current) {
      // Clear interval when paused
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timer.isRunning, timer.isPaused, timer.startTime]);

  // Periodic ping to keep server session alive (every 30 seconds)
  useEffect(() => {
    if (timer.isRunning && timer.serverSessionId) {
      // Start ping interval
      pingIntervalRef.current = setInterval(async () => {
        try {
          if (timer.serverSessionId) {
            await timerSessionAPI.pingTimerSession(timer.serverSessionId);
          }
        } catch (error) {
          console.error('Failed to ping timer session:', error);
          // Don't show error to user - this is a background operation
          // If ping fails repeatedly, the session may become stale
        }
      }, 30000); // 30 seconds

      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      };
    }
  }, [timer.isRunning, timer.serverSessionId]);

  // Browser notification for running timer
  useEffect(() => {
    if (timer.isRunning) {
      // Request notification permission (mobile-safe)
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch((error) => {});
      }

      // Show persistent notification (mobile-compatible)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          notificationRef.current = new Notification('NXFS Timer Running', {
            body: `Job #${jobId} - ${formatTime(timer.elapsed)}`,
            icon: '/favicon.ico',
            tag: `timer-${jobId}`,
            // Remove requireInteraction for mobile compatibility
            silent: false,
          });
        } catch (error) {}
      }
    } else {
      // Close notification when timer stops
      if (notificationRef.current) {
        try {
          notificationRef.current.close();
        } catch (error) {}
      }
    }

    return () => {
      if (notificationRef.current) {
        try {
          notificationRef.current.close();
        } catch (error) {}
      }
    };
  }, [timer.isRunning, timer.elapsed, jobId]);

  const formatTime = (seconds: number): string => {
    return formatSecondsToTimeString(seconds);
  };

  const loadUserStats = async () => {
    if (!user) {
      return;
    }

    try {
      setStatsLoading(true);

      // API expects ordre_nr string
      const jobIdToUse = ordreNr || jobId.toString();
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

  // Load user stats on mount and when user/job changes
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user, jobId, ordreNr]);

  const startTimer = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to start the timer',
        variant: 'destructive',
      });
      return;
    }

    // If timer is paused, resume it
    if (timer.isPaused && timer.serverSessionId) {
      try {
        const updatedSession = await timerSessionAPI.resumeTimerSession(
          timer.serverSessionId
        );

        // Ensure elapsed_seconds is a valid number and not NaN
        const elapsedSeconds =
          typeof updatedSession.elapsed_seconds === 'number' &&
          !isNaN(updatedSession.elapsed_seconds)
            ? updatedSession.elapsed_seconds
            : timer.elapsed || 0; // Fallback to current elapsed or 0 if invalid

        console.log('Resume - Updated session:', updatedSession);
        console.log('Resume - Elapsed seconds:', elapsedSeconds);

        setTimer((prev) => ({
          ...prev,
          isPaused: false,
          isRunning: true,
          startTime: Date.now(), // Reset local start time for display updates
          elapsed: elapsedSeconds,
        }));

        toast({
          title: 'Timer resumed',
          description: `Timer is now running again (${Math.floor(elapsedSeconds / 60)}m elapsed)`,
        });
        return;
      } catch (error) {
        toast({
          title: 'Failed to resume timer',
          description:
            error instanceof Error ? error.message : 'Could not resume timer',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const jobIdToUse = ordreNr || jobId.toString();

      // First, check if there's an active session on the server
      const activeSession = await timerSessionAPI.getActiveTimerSession();

      if (activeSession) {
        // If it's for this job, resume it
        if (activeSession.jobb === jobIdToUse) {
          setTimer({
            isRunning: true,
            isPaused: activeSession.is_paused || false,
            startTime: Date.now(),
            elapsed: activeSession.elapsed_seconds,
            serverSessionId: activeSession.id,
            serverStartTime: activeSession.start_time,
          });

          toast({
            title: 'Timer resumed',
            description: `Resumed existing timer (${formatSecondsToTimeString(activeSession.elapsed_seconds)} elapsed)`,
          });
          return;
        } else {
          // Active session for different job - user needs to stop it first
          toast({
            title: 'Active timer on another job',
            description: `You have an active timer on job ${activeSession.jobb}. Please stop it before starting a new one.`,
            variant: 'destructive',
          });
          return;
        }
      }

      // No active session - create a new one
      const session = await timerSessionAPI.startTimerSession({
        jobb: jobIdToUse,
      });

      if (!session.id) {
        toast({
          title: 'Timer start failed',
          description:
            'Server did not return a valid session. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const now = Date.now();

      setTimer({
        isRunning: true,
        isPaused: false,
        startTime: now,
        elapsed: 0,
        serverSessionId: session.id,
        serverStartTime: session.start_time,
      });

      toast({
        title: 'Timer started',
        description: `Started tracking time for Job #${jobId}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to start timer',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred while starting the timer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopTimer = async () => {
    if (!timer.isRunning || !user) {
      return;
    }

    setShowStopModal(true);
  };

  const handleTimerSave = async (
    description?: string,
    adjustedSeconds?: number
  ) => {
    if (!user || !timer.serverSessionId) {
      return;
    }

    try {
      // Stop the server timer session
      // The backend will handle:
      // 1. Calculate elapsed time (or use adjusted time)
      // 2. Round to nearest 0.5 hours
      // 3. Create time entry
      // 4. Delete active session
      const payload: any = description ? { beskrivelse: description } : {};

      // If time was adjusted, pass it to the backend
      if (adjustedSeconds !== undefined && adjustedSeconds !== timer.elapsed) {
        payload.elapsed_seconds = adjustedSeconds;
      }

      const timeEntry = await timerSessionAPI.stopTimerSession(
        timer.serverSessionId,
        Object.keys(payload).length > 0 ? payload : undefined
      );

      toast({
        title: 'Time saved',
        description: `Time entry created successfully`,
      });

      // Trigger refresh of time entries list and user stats
      setRefreshTrigger((prev) => prev + 1);
      loadUserStats(); // Refresh stats after saving

      // Stop timer and reset
      handleTimerReset();
      setShowStopModal(false);
    } catch (error) {
      toast({
        title: 'Failed to save time',
        description: `Time entry could not be saved. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      throw error; // Let modal handle the error state
    }
  };

  const handleTimerPause = async () => {
    // Pause the timer on the backend
    if (!timer.serverSessionId) {
      setShowStopModal(false);
      return;
    }

    try {
      const updatedSession = await timerSessionAPI.pauseTimerSession(
        timer.serverSessionId
      );

      // Ensure elapsed_seconds is valid before updating
      const elapsedSeconds =
        typeof updatedSession.elapsed_seconds === 'number' &&
        !isNaN(updatedSession.elapsed_seconds)
          ? updatedSession.elapsed_seconds
          : timer.elapsed;

      // Update local state to reflect pause with server's elapsed time
      setTimer((prev) => ({
        ...prev,
        isPaused: true,
        elapsed: elapsedSeconds, // Use server's calculated elapsed time
      }));

      setShowStopModal(false);

      toast({
        title: 'Timer paused',
        description: 'Timer paused on server. You can resume it later.',
      });
    } catch (error) {
      console.error('Failed to pause timer:', error);
      // Error toast already shown by API
    }
  };

  const handleTimerDelete = async () => {
    // When deleting, remove the server session without creating a time entry
    if (timer.serverSessionId) {
      try {
        await timerSessionAPI.deleteTimerSession(timer.serverSessionId);
      } catch (error) {
        console.error('Failed to delete timer session:', error);
        toast({
          title: 'Failed to delete timer',
          description: 'Could not delete timer session',
          variant: 'destructive',
        });
        throw error;
      }
    }

    // Reset timer locally
    handleTimerReset();
    setShowStopModal(false);

    toast({
      title: 'Timer deleted',
      description: 'Time was not saved. Timer has been deleted.',
    });
  };

  const handleTimerReset = () => {
    setTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsed: 0,
      serverSessionId: null,
      serverStartTime: null,
    });

    // Clear saved timer from localStorage
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem(`timer-${jobId}`);
      }
    } catch (storageError) {
      // Ignore localStorage errors
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const handleManualEntrySuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    loadUserStats(); // Refresh stats after manual entry
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="timer"
            className="flex items-center gap-2 data-[state=active]:bg-yellow-gradient data-[state=active]:text-foreground"
          >
            <Clock className="h-4 w-4" />
            {t('memo.timer.timer')}
          </TabsTrigger>
          <TabsTrigger
            value="entries"
            className="flex items-center gap-2 data-[state=active]:bg-yellow-gradient data-[state=active]:text-foreground"
          >
            <List className="h-4 w-4" />
            {t('memo.timeEntry.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-0">
          <div className="bg-card border rounded-lg p-4 space-y-4 hover-lift">
            {/* Timer Display - Moved to top */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  TIMER
                </span>
              </div>
              <div className="text-3xl font-mono font-bold">
                {formatTime(timer.elapsed)}
              </div>
              {timer.isRunning && !timer.isPaused && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1 animate-pulse">
                  ● {t('memo.timer.running')}
                </div>
              )}
              {timer.isPaused && (
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">
                  ⏸ {t('memo.timer.paused')}
                </div>
              )}
            </div>

            {/* Timer Controls - Moved to top */}
            <div className="flex gap-3">
              {!timer.isRunning ? (
                <Button
                  onClick={startTimer}
                  className="flex-1 h-12 bg-yellow-gradient hover:bg-yellow-gradient-hover text-foreground"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {t('memo.timer.start')}
                </Button>
              ) : timer.isPaused ? (
                <>
                  <Button
                    onClick={startTimer}
                    className="flex-1 h-12 bg-yellow-gradient hover:bg-yellow-gradient-hover text-foreground"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {t('memo.timer.resume')}
                  </Button>
                  <Button
                    onClick={stopTimer}
                    className="flex-1 h-12"
                    variant="destructive"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    {t('memo.timer.stop')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={stopTimer}
                  className="flex-1 h-12"
                  variant="destructive"
                >
                  <Square className="h-5 w-5 mr-2" />
                  {t('memo.timer.stop')}
                </Button>
              )}
            </div>

            {/* Auto-save Status */}
            <div className="text-center text-xs text-muted-foreground">
              {timer.isPaused
                ? t('memo.timer.timerPausedMessage')
                : timer.isRunning
                  ? t('memo.timer.timerWillAutoSave')
                  : t('memo.timer.clickToStart')}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-0">
          <TimeEntriesList
            jobId={jobId}
            ordreNr={ordreNr}
            refreshTrigger={refreshTrigger}
            onManualEntrySuccess={handleManualEntrySuccess}
          />
        </TabsContent>
      </Tabs>

      {/* Timer Stop Confirmation Modal */}
      <TimerStopModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        onConfirm={handleTimerSave}
        onCancel={handleTimerPause}
        onDelete={handleTimerDelete}
        elapsedSeconds={timer.elapsed}
        jobId={jobId}
      />
    </div>
  );
}
