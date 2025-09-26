'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { timeEntriesAPI } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Clock, Edit2, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { TimeEntry } from '@/types/api';
import {
  formatMinutesToHourString,
  formatMinutesToDecimalHours,
  getTimeRoundingDetails,
} from '@/lib/time-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TimeEntriesListProps {
  jobId: number;
  refreshTrigger?: number; // Can be used to trigger refresh from parent
}

interface GroupedTimeEntry extends TimeEntry {
  totalMinutes: number;
  formattedTime: string;
  decimalHours: number;
}

export function TimeEntriesList({
  jobId,
  refreshTrigger,
}: TimeEntriesListProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [timeEntries, setTimeEntries] = useState<GroupedTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      const entries = await timeEntriesAPI.getTimeEntries();

      // Filter entries for this job and current user
      const jobEntries = entries.filter(
        (entry) =>
          entry.jobb === jobId && entry.user === parseInt(user?.id || '0')
      );

      // Transform entries to include calculated fields
      const transformedEntries: GroupedTimeEntry[] = jobEntries.map((entry) => {
        const totalMinutes = entry.timer || 0;
        return {
          ...entry,
          totalMinutes,
          formattedTime: formatMinutesToHourString(totalMinutes),
          decimalHours: formatMinutesToDecimalHours(totalMinutes),
        };
      });

      // Sort by date (most recent first)
      transformedEntries.sort((a, b) => {
        if (!a.dato || !b.dato) return 0;
        return new Date(b.dato).getTime() - new Date(a.dato).getTime();
      });

      setTimeEntries(transformedEntries);
    } catch (error) {
      console.error('Failed to load time entries:', error);
      toast({
        title: 'Failed to load time entries',
        description: 'Could not load existing time entries for this job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load entries on mount and when refresh trigger changes
  useEffect(() => {
    if (user) {
      loadTimeEntries();
    }
  }, [jobId, user, refreshTrigger]);

  const handleDelete = async (entryId: number) => {
    try {
      setDeleting(entryId);
      await timeEntriesAPI.deleteTimeEntry(entryId);

      // Remove from local state
      setTimeEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      toast({
        title: 'Time entry deleted',
        description: 'The time entry has been removed successfully',
      });
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      toast({
        title: 'Failed to delete',
        description: 'Could not delete the time entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getTotalHours = () => {
    const totalMinutes = timeEntries.reduce(
      (sum, entry) => sum + entry.totalMinutes,
      0
    );
    return {
      minutes: totalMinutes,
      formatted: formatMinutesToHourString(totalMinutes),
      decimal: formatMinutesToDecimalHours(totalMinutes),
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalHours = getTotalHours();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Entries
          {timeEntries.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              Total: {totalHours.formatted} ({totalHours.decimal}h)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No time entries recorded yet</p>
            <p className="text-sm mt-1">
              Use the timer or add manual entries above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="font-medium text-foreground">
                      {entry.formattedTime}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({entry.decimalHours}h)
                      </span>
                    </div>
                    {entry.dato && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(entry.dato), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                  {entry.beskrivelse && (
                    <p className="text-sm text-muted-foreground">
                      {entry.beskrivelse}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Created:{' '}
                    {format(parseISO(entry.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Edit time entry"
                    disabled // TODO: Implement edit functionality
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete time entry"
                        disabled={deleting === entry.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this time entry of{' '}
                          {entry.formattedTime}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(entry.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary for multiple entries */}
        {timeEntries.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {timeEntries.length} entries
              </span>
              <span className="font-medium text-foreground">
                Total: {totalHours.formatted} ({totalHours.decimal}h)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
