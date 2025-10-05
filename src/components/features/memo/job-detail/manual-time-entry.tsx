'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { timeEntriesAPI } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Clock, Calendar as CalendarIcon, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIntl } from '@/hooks/use-intl';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';
import {
  roundToNearestHalfHour,
  formatMinutesToHourString,
  formatMinutesToDecimalHours,
  getTimeRoundingDetails,
  type TimeRoundingResult,
} from '@/lib/time-utils';

interface ManualTimeEntryProps {
  jobId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TIME_INCREMENTS = [8.0];

export function ManualTimeEntry({
  jobId,
  onSuccess,
  onCancel,
}: ManualTimeEntryProps) {
  const { toast } = useToast();
  const { t } = useIntl();
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState<number>(1.0);
  const [description, setDescription] = useState('');
  const [showRoundingInfo, setShowRoundingInfo] = useState(false);

  // Calculate rounding details for current time
  const currentMinutes = hours * 60;
  const roundingDetails = getTimeRoundingDetails(currentMinutes);

  const handleQuickTime = (timeHours: number) => {
    setHours(timeHours);
    setShowRoundingInfo(false);
  };

  const handleCustomTimeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 24) {
      setHours(numValue);
      setShowRoundingInfo(true);
    }
  };

  const adjustTime = (delta: number) => {
    const newHours = Math.max(0.5, Math.min(24, hours + delta));
    setHours(newHours);
    setShowRoundingInfo(true);
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add time entries',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Apply rounding to get final minutes
      const finalMinutes = roundingDetails.roundedMinutes;

      const timeEntryData = {
        jobb: jobId,
        user: parseInt(user.id),
        timer: finalMinutes, // Store as minutes
        dato: format(date, 'yyyy-MM-dd'),
        beskrivelse:
          description.trim() ||
          `Manual entry - ${roundingDetails.roundedFormatted}`,
      };

      await timeEntriesAPI.createTimeEntry(timeEntryData);

      toast({
        title: 'Time entry added',
        description: `${roundingDetails.roundedFormatted} added to Job #${jobId}`,
      });

      // Reset form
      setHours(1.0);
      setDescription('');
      setDate(new Date());
      setShowRoundingInfo(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Failed to add time entry',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('memo.timeEntry.manualEntry')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>{t('memo.timeEntry.date')}</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, 'PPP', {
                        locale: language === 'no' ? nb : undefined,
                      })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustDate(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustDate(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <Label>{t('memo.timeEntry.duration')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={hours}
                onChange={(e) => handleCustomTimeChange(e.target.value)}
                step="0.5"
                min="0.5"
                max="24"
                className="text-center"
              />
              <span className="text-sm text-muted-foreground">
                {t('memo.dashboard.hoursToday').toLowerCase().split(' ')[0]}
              </span>
              <Button
                type="button"
                variant={hours === 8.0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickTime(8.0)}
              >
                8t
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustTime(-0.5)}
                disabled={hours <= 0.5}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustTime(0.5)}
                disabled={hours >= 24}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rounding Information */}
          {showRoundingInfo && roundingDetails.wasRounded && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  Time will be rounded:
                </p>
                <p className="text-muted-foreground">
                  {roundingDetails.originalFormatted} →{' '}
                  {roundingDetails.roundedFormatted}
                  <span className="ml-2 text-xs">
                    ({roundingDetails.roundedUp ? 'rounded up' : 'rounded down'}
                    )
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>
              {t('memo.timeEntry.description')} ({t('common.or')})
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('memo.timer.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? `${t('common.saving')}` : t('memo.timeEntry.save')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
