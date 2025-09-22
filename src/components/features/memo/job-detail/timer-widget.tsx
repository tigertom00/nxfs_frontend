'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { timeEntriesAPI } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Play, Square, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimerWidgetProps {
  jobId: number;
}

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsed: number; // seconds
  sessionId: string | null;
}

export function TimerWidget({ jobId }: TimerWidgetProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsed: 0,
    sessionId: null,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const notificationRef = useRef<Notification>();

  // Load saved timer state on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem(`timer-${jobId}`);
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        setTimer(parsed);

        // If timer was running, calculate elapsed time since last save
        if (parsed.isRunning && parsed.startTime) {
          const now = Date.now();
          const additionalElapsed = Math.floor((now - parsed.startTime) / 1000);
          setTimer((prev) => ({
            ...prev,
            elapsed: prev.elapsed + additionalElapsed,
            startTime: now,
          }));
        }
      } catch (error) {
        console.error('Failed to parse saved timer:', error);
      }
    }
  }, [jobId]);

  // Save timer state whenever it changes
  useEffect(() => {
    localStorage.setItem(`timer-${jobId}`, JSON.stringify(timer));
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
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Show persistent notification
      if ('Notification' in window && Notification.permission === 'granted') {
        notificationRef.current = new Notification('NXFS Timer Running', {
          body: `Job #${jobId} - ${formatTime(timer.elapsed)}`,
          icon: '/favicon.ico',
          tag: `timer-${jobId}`,
          requireInteraction: true,
        });
      }
    } else {
      // Close notification when timer stops
      if (notificationRef.current) {
        notificationRef.current.close();
      }
    }

    return () => {
      if (notificationRef.current) {
        notificationRef.current.close();
      }
    };
  }, [timer.isRunning, timer.elapsed, jobId]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
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
  };

  const stopTimer = async () => {
    if (!timer.isRunning || !user) return;

    const confirmSave = window.confirm(
      `Save ${formatTime(timer.elapsed)} to Job #${jobId}?\n\nThis will create a time entry record.`
    );

    if (confirmSave) {
      try {
        // Convert elapsed seconds to hours (rounded to 2 decimals)
        const hours = Math.round((timer.elapsed / 3600) * 100) / 100;

        await timeEntriesAPI.createTimeEntry({
          jobb: jobId,
          user: parseInt(user.id),
          timer: timer.elapsed,
          dato: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          beskrivelse: `Timer session - ${formatTime(timer.elapsed)}`,
        });

        toast({
          title: 'Time saved',
          description: `${formatTime(timer.elapsed)} saved to Job #${jobId}`,
        });
      } catch (error) {
        console.error('Failed to save time entry:', error);
        toast({
          title: 'Failed to save time',
          description: 'Time entry could not be saved. Please try again.',
          variant: 'destructive',
        });
        return; // Don't stop timer if save failed
      }
    }

    // Stop timer and reset
    setTimer({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      sessionId: null,
    });

    // Clear saved timer
    localStorage.removeItem(`timer-${jobId}`);

    if (!confirmSave) {
      toast({
        title: 'Timer stopped',
        description: 'Time was not saved',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
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
          ? 'Timer will auto-save when stopped'
          : 'Click start to begin tracking time'}
      </div>
    </div>
  );
}
