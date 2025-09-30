'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { timeEntriesAPI, timeTrackingAPI } from '@/lib/api';
import { DateGroupedTimeEntries, TimeEntryWithJob, UserBasic } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Clock, Edit2, Trash2, Calendar, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { TimeEntry } from '@/lib/api';
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
  ordreNr?: string; // Order number for API filtering
  refreshTrigger?: number; // Can be used to trigger refresh from parent
}

interface GroupedTimeEntry extends TimeEntry {
  totalMinutes: number;
  formattedTime: string;
  decimalHours: number;
}

export function TimeEntriesList({
  jobId,
  ordreNr,
  refreshTrigger,
}: TimeEntriesListProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [groupedEntries, setGroupedEntries] = useState<DateGroupedTimeEntries>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      // API expects numeric job ID
      const jobIdToUse = ordreNr ? parseInt(ordreNr) : jobId;

      console.log('Loading grouped time entries with params:', {
        jobb: jobIdToUse.toString(),
        user_id: parseInt(user?.id || '0'),
      });

      const groupedData = await timeTrackingAPI.getTimeEntriesByDate({
        jobb: jobIdToUse.toString(),
        user_id: parseInt(user?.id || '0'),
      });

      console.log('Grouped time entries response:', groupedData);
      setGroupedEntries(groupedData);

      // Auto-expand today's date if it exists
      const today = new Date().toISOString().split('T')[0];
      if (groupedData[today]) {
        setExpandedDates(new Set([today]));
      }
    } catch (error) {
      console.error('Failed to load grouped time entries:', error);
      toast({
        title: 'Failed to load time entries',
        description: 'Could not load existing time entries for this job',
        variant: 'destructive',
      });
      setGroupedEntries({});
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

  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleDelete = async (entryId: number) => {
    try {
      setDeleting(entryId);
      await timeEntriesAPI.deleteTimeEntry(entryId);

      // Reload the grouped data after deletion
      loadTimeEntries();

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
    const totalMinutes = Object.values(groupedEntries).reduce(
      (sum, dateGroup) => sum + (dateGroup.total_hours * 60),
      0
    );
    return {
      minutes: totalMinutes,
      formatted: formatMinutesToHourString(totalMinutes),
      decimal: formatMinutesToDecimalHours(totalMinutes),
    };
  };

  const getTotalEntries = () => {
    return Object.values(groupedEntries).reduce(
      (sum, dateGroup) => sum + dateGroup.entries.length,
      0
    );
  };

  // Helper function to safely get user display info
  const getUserDisplay = (user?: UserBasic | number) => {
    if (!user || typeof user === 'number') {
      return { displayName: 'Unknown', initials: '?', avatar: null };
    }
    const displayName = user.display_name || user.username;
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      displayName,
      initials,
      avatar: user.profile_picture,
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
                <div className="h-12 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalHours = getTotalHours();
  const totalEntries = getTotalEntries();
  const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Entries
          {totalEntries > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              Total: {totalHours.formatted} ({totalHours.decimal}h)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No time entries recorded yet</p>
            <p className="text-sm mt-1">
              Use the timer or add manual entries above
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDates.map((date) => {
              const dateGroup = groupedEntries[date];
              const isExpanded = expandedDates.has(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              const isYesterday = date === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

              let displayDate = format(parseISO(date), 'EEE. dd.MM.yyyy');
              if (isToday) displayDate = `i dag. ${format(parseISO(date), 'dd.MM.yyyy')}`;
              if (isYesterday) displayDate = `i går. ${format(parseISO(date), 'dd.MM.yyyy')}`;

              return (
                <div key={date} className="border rounded-lg overflow-hidden">
                  {/* Date header */}
                  <div
                    onClick={() => toggleDateExpansion(date)}
                    className="flex items-center justify-between p-3 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">
                        {displayDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {dateGroup.entries.length} entries
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          {formatMinutesToDecimalHours(dateGroup.total_hours * 60)}h
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Entries list */}
                  {isExpanded && (
                    <div className="divide-y">
                      {dateGroup.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-sm">
                                {formatMinutesToHourString(entry.timer)}
                              </div>
                              {(entry.jobb_tittel || entry.jobb_details?.tittel) && (
                                <span className="text-xs text-muted-foreground">
                                  {entry.jobb_tittel || entry.jobb_details?.tittel}
                                </span>
                              )}
                              {entry.user && typeof entry.user !== 'number' && (
                                <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full ml-auto">
                                  <Avatar className="h-3 w-3">
                                    <AvatarImage src={getUserDisplay(entry.user).avatar || undefined} />
                                    <AvatarFallback className="text-[6px]">
                                      {getUserDisplay(entry.user).initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{getUserDisplay(entry.user).displayName}</span>
                                </span>
                              )}
                            </div>
                            {entry.beskrivelse && (
                              <p className="text-xs text-muted-foreground">
                                {entry.beskrivelse}
                              </p>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Created: {format(parseISO(entry.created_at), 'HH:mm')}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit time entry"
                              disabled // TODO: Implement edit functionality
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  title="Delete time entry"
                                  disabled={deleting === entry.id}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this time entry of{' '}
                                    {formatMinutesToHourString(entry.timer)}? This action cannot be undone.
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
                </div>
              );
            })}
          </div>
        )}

        {/* Summary for grouped entries */}
        {totalEntries > 1 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {totalEntries} entries across {sortedDates.length} days
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
