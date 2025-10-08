'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Save, Pause, Trash2, Plus, Minus } from 'lucide-react';
import { useIntl } from '@/hooks/use-intl';
import {
  formatSecondsToTimeString,
  roundSecondsToNearestHalfHour,
} from '@/lib/time-utils';

interface TimerStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (description?: string, adjustedSeconds?: number) => void;
  onCancel: () => void;
  onDelete: () => void;
  elapsedSeconds: number;
  jobId: number;
}

export function TimerStopModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  onDelete,
  elapsedSeconds,
  jobId,
}: TimerStopModalProps) {
  const { t } = useIntl();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [adjustedSeconds, setAdjustedSeconds] = useState<number>(0);
  const [initialSeconds, setInitialSeconds] = useState<number>(0);

  // Only initialize when modal opens - ignore elapsedSeconds updates while open
  useEffect(() => {
    if (isOpen) {
      // Modal is opening - capture the initial time
      setAdjustedSeconds(elapsedSeconds);
      setInitialSeconds(elapsedSeconds);
      setDescription('');
    }
  }, [isOpen]); // Remove elapsedSeconds dependency

  const originalTime = formatSecondsToTimeString(initialSeconds);
  const roundedSeconds = roundSecondsToNearestHalfHour(adjustedSeconds);
  const roundedTime = formatSecondsToTimeString(roundedSeconds);
  const wasRounded = roundedSeconds !== adjustedSeconds;
  const wasAdjusted = adjustedSeconds !== initialSeconds;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(description.trim() || undefined, adjustedSeconds);
      // Don't reset here - modal will reset when it reopens
      setLoading(false);
    } catch (error) {
      setLoading(false);
      // Error is handled in parent component
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      // Don't reset here - modal will reset when it reopens
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const adjustTime = (minutes: number) => {
    const newSeconds = Math.max(0, adjustedSeconds + minutes * 60);
    setAdjustedSeconds(newSeconds);
  };

  const handleCancel = () => {
    onCancel();
    // Don't reset here - modal will reset when it reopens
  };

  const handleClose = () => {
    onClose();
    // Don't reset here - modal will reset when it reopens
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('memo.timer.stopConfirm')}
          </DialogTitle>
          <DialogDescription>
            {t('memo.timer.stopDescription')} #{jobId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions at top for mobile */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="w-full"
            >
              <Pause className="h-4 w-4 mr-1" />
              {t('memo.timer.pause')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-1" />
              {t('common.save')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('common.delete')}
            </Button>
          </div>

          {/* Time Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('memo.timer.originalTime')}
              </span>
              <span className="font-mono font-medium">{originalTime}</span>
            </div>

            {/* Time adjustment controls */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-medium">
                {t('memo.timer.adjustTime')}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustTime(-30)}
                  disabled={loading || adjustedSeconds === 0}
                >
                  <Minus className="h-3 w-3" />
                  30m
                </Button>
                <span className="font-mono font-bold text-lg min-w-[80px] text-center">
                  {formatSecondsToTimeString(adjustedSeconds)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustTime(30)}
                  disabled={loading}
                >
                  <Plus className="h-3 w-3" />
                  30m
                </Button>
              </div>
            </div>

            {wasAdjusted && (
              <p className="text-xs text-muted-foreground text-center">
                {t('memo.timer.timeAdjusted')}{' '}
                {adjustedSeconds > initialSeconds ? '+' : ''}
                {((adjustedSeconds - initialSeconds) / 60).toFixed(0)}{' '}
                {t('memo.timer.minutes')}
              </p>
            )}

            {wasRounded && (
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {t('memo.timer.roundedTime')}
                </span>
                <span className="font-mono font-medium text-primary">
                  {roundedTime}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium">
                {t('memo.timer.timeToSave')}
              </span>
              <span className="font-mono font-bold text-lg">
                {wasRounded
                  ? roundedTime
                  : formatSecondsToTimeString(adjustedSeconds)}
              </span>
            </div>

            {wasRounded && (
              <p className="text-xs text-muted-foreground">
                {t('memo.timer.timeHasBeenRounded')}{' '}
                {roundedSeconds > adjustedSeconds
                  ? t('memo.timer.roundedUp')
                  : t('memo.timer.roundedDown')}{' '}
                {t('memo.timer.roundedToNearest')}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="timer-description">
              {t('memo.timeEntry.description')} ({t('common.or')})
            </Label>
            <Textarea
              id="timer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`${t('memo.timer.stopConfirm')} #${jobId}...`}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t('memo.timer.addDetailsSession')}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t('memo.timer.timeWillBeSaved')} #{jobId}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
