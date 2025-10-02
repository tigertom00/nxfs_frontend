'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeEntriesAPI, timeTrackingAPI } from '@/lib/api';
import { UserTimeStats } from '@/lib/api';
import { useAuthStore } from '@/stores';
import {
  Play,
  Square,
  Clock,
  PlusCircle,
  List,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ManualTimeEntry } from './manual-time-entry';
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
  startTime: number | null;
  elapsed: number; // seconds
  sessionId: string | null;
}

export function TimerWidget({ jobId, ordreNr }: TimerWidgetProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsed: 0,
    sessionId: null,
  });
  const [activeTab, setActiveTab] = useState('timer');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showStopModal, setShowStopModal] = useState(false);
  const [userStats, setUserStats] = useState<UserTimeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationRef = useRef<Notification | null>(null);

  // Load saved timer state on mount
  useEffect(() => {
    try {
      // Check if localStorage is available (mobile-safe)
      if (typeof Storage === 'undefined') {
        return;
      }

      const savedTimer = localStorage.getItem(`timer-${jobId}`);
      if (savedTimer) {
        try {
          const parsed = JSON.parse(savedTimer);
          setTimer(parsed);

          // If timer was running, calculate elapsed time since last save
          if (parsed.isRunning && parsed.startTime) {
            const now = Date.now();
            const additionalElapsed = Math.floor(
              (now - parsed.startTime) / 1000
            );
            setTimer((prev) => ({
              ...prev,
              elapsed: prev.elapsed + additionalElapsed,
              startTime: now,
            }));
          }
        } catch (parseError) {
          // Clear corrupted data
          localStorage.removeItem(`timer-${jobId}`);
        }
      }
    } catch (storageError) {
    }
  }, [jobId]);

  // Save timer state whenever it changes
  useEffect(() => {
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.setItem(`timer-${jobId}`, JSON.stringify(timer));
      }
    } catch (storageError) {
    }
  }, [timer, jobId]);

  // Update timer display every second when running
  useEffect(() => {
    if (timer.isRunning && timer.startTime) {
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
    }
  }, [timer.isRunning, timer.startTime]);

  // Browser notification for running timer
  useEffect(() => {
    if (timer.isRunning) {
      // Request notification permission (mobile-safe)
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch((error) => {
        });
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
        } catch (error) {
        }
      }
    } else {
      // Close notification when timer stops
      if (notificationRef.current) {
        try {
          notificationRef.current.close();
        } catch (error) {
        }
      }
    }

    return () => {
      if (notificationRef.current) {
        try {
          notificationRef.current.close();
        } catch (error) {
        }
      }
    };
  }, [timer.isRunning, timer.elapsed, jobId]);

  const formatTime = (seconds: number): string => {
    return formatSecondsToTimeString(seconds);
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      setStatsLoading(true);
      const stats = await timeTrackingAPI.getUserStats();
      setUserStats(stats);
    } catch (error) {
      // Don't show error toast for stats - it's supplementary information
    } finally {
      setStatsLoading(false);
    }
  };

  // Load user stats on mount and when user changes
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const startTimer = () => {
    try {
      const now = Date.now();
      const sessionId = `${user?.id}-${jobId}-${now}`;

      setTimer({
        isRunning: true,
        startTime: now,
        elapsed: 0,
        sessionId,
      });

      toast({
        title: 'Timer started',
        description: `Started tracking time for Job #${jobId}`,
      });

    } catch (error) {
      toast({
        title: 'Failed to start timer',
        description:
          'An error occurred while starting the timer. Please try again.',
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

  const handleTimerSave = async (description?: string) => {
    if (!user) return;

    try {
      // Apply smart rounding to elapsed time
      const roundedSeconds = roundSecondsToNearestHalfHour(timer.elapsed);
      const roundedMinutes = Math.round(roundedSeconds / 60);

      // API expects numeric job ID
      const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;

      // Parse user ID safely
      const userId = parseInt(user.id);
      if (isNaN(userId)) {
        toast({
          title: 'Invalid user ID',
          description: 'Cannot save time entry - user ID is invalid',
          variant: 'destructive',
        });
        return;
      }

      const timeEntryData = {
        jobb: jobIdToUse.toString(),
        user: userId,
        timer: roundedMinutes, // Store as minutes
        dato: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        beskrivelse:
          description ||
          `Timer session - ${formatTime(roundedSeconds)}${roundedSeconds !== timer.elapsed ? ` (rounded from ${formatTime(timer.elapsed)})` : ''}`,
      };

      const result = await timeEntriesAPI.createTimeEntry(timeEntryData);

      toast({
        title: 'Time saved',
        description: `${formatTime(roundedSeconds)} saved to Job #${jobId}${roundedSeconds !== timer.elapsed ? ' (rounded)' : ''}`,
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

  const handleTimerCancel = () => {
    // Don't save, just stop the timer
    handleTimerReset();
    setShowStopModal(false);

    toast({
      title: 'Timer stopped',
      description: 'Time was not saved',
      variant: 'destructive',
    });
  };

  const handleTimerReset = () => {
    setTimer({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      sessionId: null,
    });

    // Clear saved timer
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem(`timer-${jobId}`);
      }
    } catch (storageError) {
    }
  };

  const handleManualEntrySuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    loadUserStats(); // Refresh stats after manual entry
    setActiveTab('entries'); // Switch to entries tab after adding
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Timer
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-0">
          <div className="bg-card border rounded-lg p-4 space-y-4">
            {/* User Statistics */}
            {userStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    TIME OVERVIEW
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Today</div>
                    <div className="text-sm font-semibold">
                      {(userStats.today.hours / 60).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userStats.today.entries} entries
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Yesterday
                    </div>
                    <div className="text-sm font-semibold">
                      {(userStats.yesterday.hours / 60).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userStats.yesterday.entries} entries
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Your Total
                    </div>
                    <div className="text-sm font-semibold">
                      {(userStats.total_user.hours / 60).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userStats.total_user.entries} entries
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      All Users
                    </div>
                    <div className="text-sm font-semibold">
                      {(userStats.total_all_users.hours / 60).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userStats.total_all_users.entries} entries
                    </div>
                  </div>
                </div>
              </div>
            )}

            {statsLoading && (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="ml-2 text-xs text-muted-foreground">
                  Loading stats...
                </span>
              </div>
            )}

            {/* Timer Display */}
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
              {timer.isRunning && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1 animate-pulse">
                  ● Running
                </div>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex gap-3">
              {!timer.isRunning ? (
                <Button
                  onClick={startTimer}
                  className="flex-1 h-12"
                  variant="default"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Timer
                </Button>
              ) : (
                <Button
                  onClick={stopTimer}
                  className="flex-1 h-12"
                  variant="destructive"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop & Save
                </Button>
              )}
            </div>

            {/* Auto-save Status */}
            <div className="text-center text-xs text-muted-foreground">
              {timer.isRunning
                ? 'Timer will auto-save when stopped (with 30-min rounding)'
                : 'Click start to begin tracking time'}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-0">
          <ManualTimeEntry jobId={jobId} onSuccess={handleManualEntrySuccess} />
        </TabsContent>

        <TabsContent value="entries" className="space-y-0">
          <TimeEntriesList
            jobId={jobId}
            ordreNr={ordreNr}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Timer Stop Confirmation Modal */}
      <TimerStopModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        onConfirm={handleTimerSave}
        onCancel={handleTimerCancel}
        elapsedSeconds={timer.elapsed}
        jobId={jobId}
      />
    </div>
  );
}
