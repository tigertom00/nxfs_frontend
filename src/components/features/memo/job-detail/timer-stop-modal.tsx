'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Save, X } from 'lucide-react';
import {
  formatSecondsToTimeString,
  roundSecondsToNearestHalfHour,
} from '@/lib/time-utils';

interface TimerStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (description?: string) => void;
  onCancel: () => void;
  elapsedSeconds: number;
  jobId: number;
}

export function TimerStopModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  elapsedSeconds,
  jobId,
}: TimerStopModalProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const originalTime = formatSecondsToTimeString(elapsedSeconds);
  const roundedSeconds = roundSecondsToNearestHalfHour(elapsedSeconds);
  const roundedTime = formatSecondsToTimeString(roundedSeconds);
  const wasRounded = roundedSeconds !== elapsedSeconds;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(description.trim() || undefined);
      // Reset state
      setDescription('');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      // Error is handled in parent component
    }
  };

  const handleCancel = () => {
    onCancel();
    setDescription('');
  };

  const handleClose = () => {
    onClose();
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Stop Timer & Save Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Original time:
              </span>
              <span className="font-mono font-medium">{originalTime}</span>
            </div>

            {wasRounded && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Rounded time:
                </span>
                <span className="font-mono font-medium text-primary">
                  {roundedTime}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium">Time to save:</span>
              <span className="font-mono font-bold text-lg">
                {wasRounded ? roundedTime : originalTime}
              </span>
            </div>

            {wasRounded && (
              <p className="text-xs text-muted-foreground">
                Time has been{' '}
                {roundedSeconds > elapsedSeconds
                  ? 'rounded up'
                  : 'rounded down'}{' '}
                to the nearest 30-minute increment
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="timer-description">Description (Optional)</Label>
            <Textarea
              id="timer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Timer session for Job #${jobId}...`}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add details about what you worked on during this session
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Don't Save
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Time'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Time will be saved to Job #{jobId}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
