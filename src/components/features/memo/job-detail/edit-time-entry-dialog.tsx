'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { timeTrackingAPI } from '@/lib/api';
import { TimeEntry } from '@/lib/api';
import { Clock, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  formatMinutesToDecimalHours,
  getTimeRoundingDetails,
} from '@/lib/time-utils';

interface EditTimeEntryDialogProps {
  entry: TimeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTimeEntryDialog({
  entry,
  isOpen,
  onClose,
  onSuccess,
}: EditTimeEntryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<number>(1.0);
  const [description, setDescription] = useState('');
  const [showRoundingInfo, setShowRoundingInfo] = useState(false);

  // Initialize form with entry data when dialog opens
  useEffect(() => {
    if (entry && isOpen) {
      setHours(formatMinutesToDecimalHours(entry.timer));
      setDescription(entry.beskrivelse || '');
      setShowRoundingInfo(false);
    }
  }, [entry, isOpen]);

  // Calculate rounding details for current time
  const currentMinutes = hours * 60;
  const roundingDetails = getTimeRoundingDetails(currentMinutes);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry) {return;}

    setLoading(true);

    try {
      // Apply rounding to get final minutes
      const finalMinutes = roundingDetails.roundedMinutes;

      await timeTrackingAPI.updateTimeEntry(entry.id, {
        timer: finalMinutes,
        beskrivelse: description.trim() || undefined,
      });

      toast({
        title: 'Time entry updated',
        description: `Updated to ${formatMinutesToDecimalHours(finalMinutes)}t`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      // Error handled by API
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!entry) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Time Entry
          </DialogTitle>
          <DialogDescription>
            Modify the time entry for Job #{entry.jobb}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time Input */}
          <div className="space-y-2">
            <Label>Time (hours)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustTime(-0.5)}
                disabled={hours <= 0.5}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => handleCustomTimeChange(e.target.value)}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustTime(0.5)}
                disabled={hours >= 24}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Rounding info */}
            {showRoundingInfo && roundingDetails.wasRounded && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <p>
                  {formatMinutesToDecimalHours(currentMinutes)}t will be rounded
                  to{' '}
                  {formatMinutesToDecimalHours(roundingDetails.roundedMinutes)}t
                  ({roundingDetails.roundedMinutes} minutes)
                </p>
                <p className="mt-1">
                  Difference: {(roundingDetails.roundedMinutes - roundingDetails.originalMinutes) > 0 ? '+' : ''}
                  {roundingDetails.roundedMinutes - roundingDetails.originalMinutes} minutes
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
