'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeEntriesAPI, timeTrackingAPI } from '@/lib/api';
import { DateGroupedTimeEntries, TimeEntryWithJob, UserBasic } from '@/lib/api';
import { useAuthStore } from '@/stores';
import {
  Clock,
  Edit2,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIntl } from '@/hooks/use-intl';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from 'date-fns';
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
import { EditTimeEntryDialog } from './edit-time-entry-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

type DateFilter =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'all';

const getDateRange = (
  filter: DateFilter
): { start_date?: string; end_date?: string } => {
  const now = new Date();

  switch (filter) {
    case 'this_week':
      return {
        start_date: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end_date: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    case 'last_week':
      const lastWeek = subWeeks(now, 1);
      return {
        start_date: format(
          startOfWeek(lastWeek, { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        ),
        end_date: format(
          endOfWeek(lastWeek, { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        ),
      };
    case 'this_month':
      return {
        start_date: format(startOfMonth(now), 'yyyy-MM-dd'),
        end_date: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        start_date: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end_date: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    case 'all':
    default:
      return {};
  }
};

export function TimeEntriesList({
  jobId,
  ordreNr,
  refreshTrigger,
}: TimeEntriesListProps) {
  const { toast } = useToast();
  const { t } = useIntl();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('job');
  const [jobEntries, setJobEntries] = useState<DateGroupedTimeEntries>({});
  const [userEntries, setUserEntries] = useState<DateGroupedTimeEntries>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userDateFilter, setUserDateFilter] = useState<DateFilter>('this_week');
  const [jobDateFilter, setJobDateFilter] = useState<DateFilter>('this_week');

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      // API expects ordre_nr string (not numeric ID)
      const jobIdToUse = ordreNr || jobId.toString();

      // Parse user ID safely
      const userId = parseInt(user?.id || '0');

      // Get date range based on selected filters
      const userDateRange = getDateRange(userDateFilter);
      const jobDateRange = getDateRange(jobDateFilter);

      // Load both job-specific entries and all user entries in parallel
      const [jobResponse, userResponse] = await Promise.all([
        // Job-specific entries (all users for this job) with date filter
        timeTrackingAPI.getTimeEntriesByDate({
          jobb: jobIdToUse,
          ...jobDateRange,
        }),
        // All user entries (current user only, all jobs) with date filter
        timeTrackingAPI.getTimeEntriesByDate({
          user_id: userId,
          ...userDateRange,
        }),
      ]);

      // Helper function to transform response
      const transformResponse = (response: any): DateGroupedTimeEntries => {
        let groupedData: DateGroupedTimeEntries = {};

        if (response && typeof response === 'object') {
          // Check if response has entries_by_date array (new backend format)
          if (
            'entries_by_date' in response &&
            Array.isArray(response.entries_by_date)
          ) {
            const entriesArray = response.entries_by_date as Array<{
              date: string;
              total_hours: number;
              entries: TimeEntryWithJob[];
            }>;

            // Transform array to object with dates as keys
            entriesArray.forEach((item) => {
              if (item.date) {
                groupedData[item.date] = item;
              }
            });
          } else if (!Array.isArray(response)) {
            // Old format: already an object with dates as keys
            groupedData = response as DateGroupedTimeEntries;
          }
        }

        return groupedData;
      };

      const jobData = transformResponse(jobResponse);
      const userData = transformResponse(userResponse);

      setJobEntries(jobData);
      setUserEntries(userData);

      // Auto-expand today's date if it exists
      const today = new Date().toISOString().split('T')[0];
      if (jobData[today] || userData[today]) {
        setExpandedDates(new Set([today]));
      }
    } catch (error) {
      toast({
        title: 'Failed to load time entries',
        description: 'Could not load existing time entries',
        variant: 'destructive',
      });
      setJobEntries({});
      setUserEntries({});
    } finally {
      setLoading(false);
    }
  };

  // Load entries on mount and when refresh trigger or date filters change
  useEffect(() => {
    if (user) {
      loadTimeEntries();
    }
  }, [jobId, user, refreshTrigger, userDateFilter, jobDateFilter]);

  const toggleDateExpansion = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    // Reload the grouped data after edit
    loadTimeEntries();
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
      toast({
        title: 'Failed to delete',
        description: 'Could not delete the time entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getTotalHours = (entries: DateGroupedTimeEntries) => {
    // Note: total_hours is actually in minutes despite the name
    const totalMinutes = Object.values(entries).reduce(
      (sum, dateGroup) => sum + (dateGroup?.total_hours || 0),
      0
    );
    return {
      minutes: totalMinutes,
      formatted: formatMinutesToHourString(totalMinutes),
      decimal: formatMinutesToDecimalHours(totalMinutes),
    };
  };

  const getTotalEntries = (entries: DateGroupedTimeEntries) => {
    return Object.values(entries).reduce(
      (sum, dateGroup) => sum + (dateGroup?.entries?.length || 0),
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

  // Render function for entries list
  const renderEntriesList = (
    entries: DateGroupedTimeEntries,
    emptyMessage: string
  ) => {
    const totalHours = getTotalHours(entries);
    const totalEntries = getTotalEntries(entries);
    const sortedDates = Object.keys(entries || {}).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    if (sortedDates.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2">
          {sortedDates.map((date) => {
            const dateGroup = entries[date];
            if (!dateGroup) return null; // Skip if no data

            const isExpanded = expandedDates.has(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            const isYesterday =
              date ===
              new Date(Date.now() - 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            // Parse date once and cache it
            let displayDate: string;
            try {
              // Validate date string before parsing
              if (!date || typeof date !== 'string') {
                throw new Error('Invalid date format');
              }
              const parsedDate = parseISO(date);
              // Check if date is valid
              if (isNaN(parsedDate.getTime())) {
                throw new Error('Invalid date value');
              }
              displayDate = format(parsedDate, 'EEE. dd.MM.yyyy');
              if (isToday)
                displayDate = `i dag. ${format(parsedDate, 'dd.MM.yyyy')}`;
              if (isYesterday)
                displayDate = `i går. ${format(parsedDate, 'dd.MM.yyyy')}`;
            } catch (error) {
              displayDate = date; // Fallback to raw date string
            }

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
                    <span className="font-medium text-sm">{displayDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {dateGroup?.entries?.length || 0}{' '}
                      {t('memo.timeEntry.entriesAcrossDays')}
                    </span>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatMinutesToDecimalHours(
                          dateGroup?.total_hours || 0
                        )}
                        h
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entries list */}
                {isExpanded && dateGroup?.entries && (
                  <div className="divide-y">
                    {dateGroup.entries.map((entry) => {
                      // Safely get user display info
                      let userDisplay: {
                        displayName: string;
                        initials: string;
                        avatar: string | null;
                      } | null = null;
                      try {
                        if (entry.user && typeof entry.user !== 'number') {
                          userDisplay = getUserDisplay(entry.user);
                        }
                      } catch (error) {}

                      // Safely format created_at time
                      let createdTime = 'N/A';
                      try {
                        if (entry.created_at) {
                          createdTime = format(
                            parseISO(entry.created_at),
                            'HH:mm'
                          );
                        }
                      } catch (error) {
                        createdTime = entry.created_at || 'N/A';
                      }

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-sm">
                                {formatMinutesToDecimalHours(entry.timer)}h
                              </div>
                              {(entry.jobb_tittel ||
                                entry.jobb_details?.tittel) && (
                                <span className="text-xs text-muted-foreground">
                                  {entry.jobb_tittel ||
                                    entry.jobb_details?.tittel}
                                </span>
                              )}
                              {userDisplay && (
                                <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full ml-auto">
                                  <Avatar className="h-3 w-3">
                                    <AvatarImage
                                      src={userDisplay.avatar || undefined}
                                    />
                                    <AvatarFallback className="text-[6px]">
                                      {userDisplay.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{userDisplay.displayName}</span>
                                </span>
                              )}
                            </div>
                            {entry.beskrivelse && (
                              <p className="text-xs text-muted-foreground">
                                {entry.beskrivelse}
                              </p>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {t('memo.timeEntry.createdAt')} {createdTime}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title={t('memo.timeEntry.editTimeEntry')}
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  title={t('memo.timeEntry.deleteTimeEntry')}
                                  disabled={deleting === entry.id}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t('memo.timeEntry.deleteTimeEntry')}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('memo.timeEntry.deleteTimeEntryConfirm')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t('common.cancel')}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(entry.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary for grouped entries */}
        {totalEntries > 1 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {totalEntries} {t('memo.timeEntry.entriesAcrossDays')}{' '}
                {sortedDates.length} {t('memo.timeEntry.days')}
              </span>
              <span className="font-medium text-foreground">
                {t('memo.timeEntry.total')} {totalHours.decimal}h
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('memo.timeEntry.title')}
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('memo.timeEntry.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="job" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {t('memo.timeEntry.jobView')}
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('memo.timeEntry.userView')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="job" className="mt-4">
              <div className="mb-4 flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={jobDateFilter}
                  onValueChange={(value) =>
                    setJobDateFilter(value as DateFilter)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={t('memo.timeEntry.selectPeriod')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_week">
                      {t('memo.timeEntry.thisWeek')}
                    </SelectItem>
                    <SelectItem value="last_week">
                      {t('memo.timeEntry.lastWeek')}
                    </SelectItem>
                    <SelectItem value="this_month">
                      {t('memo.timeEntry.thisMonth')}
                    </SelectItem>
                    <SelectItem value="last_month">
                      {t('memo.timeEntry.lastMonth')}
                    </SelectItem>
                    <SelectItem value="all">
                      {t('memo.timeEntry.allTime')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {jobDateFilter === 'this_week' &&
                    `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
                  {jobDateFilter === 'last_week' &&
                    `${format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
                  {jobDateFilter === 'this_month' &&
                    format(new Date(), 'MMMM yyyy')}
                  {jobDateFilter === 'last_month' &&
                    format(subMonths(new Date(), 1), 'MMMM yyyy')}
                  {jobDateFilter === 'all' && t('memo.timeEntry.allEntries')}
                </span>
              </div>
              {renderEntriesList(
                jobEntries,
                t('memo.timeEntry.noEntriesForJob')
              )}
            </TabsContent>

            <TabsContent value="user" className="mt-4">
              <div className="mb-4 flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={userDateFilter}
                  onValueChange={(value) =>
                    setUserDateFilter(value as DateFilter)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={t('memo.timeEntry.selectPeriod')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_week">
                      {t('memo.timeEntry.thisWeek')}
                    </SelectItem>
                    <SelectItem value="last_week">
                      {t('memo.timeEntry.lastWeek')}
                    </SelectItem>
                    <SelectItem value="this_month">
                      {t('memo.timeEntry.thisMonth')}
                    </SelectItem>
                    <SelectItem value="last_month">
                      {t('memo.timeEntry.lastMonth')}
                    </SelectItem>
                    <SelectItem value="all">
                      {t('memo.timeEntry.allTime')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {userDateFilter === 'this_week' &&
                    `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
                  {userDateFilter === 'last_week' &&
                    `${format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
                  {userDateFilter === 'this_month' &&
                    format(new Date(), 'MMMM yyyy')}
                  {userDateFilter === 'last_month' &&
                    format(subMonths(new Date(), 1), 'MMMM yyyy')}
                  {userDateFilter === 'all' && t('memo.timeEntry.allEntries')}
                </span>
              </div>
              {renderEntriesList(userEntries, t('memo.timeEntry.noEntries'))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EditTimeEntryDialog
        entry={editingEntry}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
