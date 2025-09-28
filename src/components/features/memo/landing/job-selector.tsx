'use client';

import { Job } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase } from 'lucide-react';

interface JobSelectorProps {
  jobs: Job[];
  selectedJob: Job | null;
  onJobSelect: (job: Job) => void;
  onNewJob: () => void;
  loading: boolean;
}

export function JobSelector({
  jobs,
  selectedJob,
  onJobSelect,
  onNewJob,
  loading,
}: JobSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Selection Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Select Active Job:
        </label>
        <Select
          value={selectedJob?.ordre_nr.toString() || ''}
          onValueChange={(value) => {
            const job = jobs.find((j) => j.ordre_nr.toString() === value);
            if (job) onJobSelect(job);
          }}
        >
          <SelectTrigger className="h-12">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Choose a job..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {jobs.length === 0 ? (
              <SelectItem value="no-jobs" disabled>
                No jobs available
              </SelectItem>
            ) : (
              jobs.map((job) => (
                <SelectItem key={job.ordre_nr} value={job.ordre_nr.toString()}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Job #{job.ordre_nr}</span>
                    {job.tittel && (
                      <span className="text-sm text-muted-foreground">
                        {job.tittel}
                      </span>
                    )}
                    {job.adresse && (
                      <span className="text-xs text-muted-foreground">
                        📍 {job.adresse.split(',')[0]}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* New Job Button */}
      <Button
        onClick={onNewJob}
        className="w-full h-12 text-base"
        variant="default"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create New Job
      </Button>

      {/* Enter Selected Job Button */}
      {selectedJob && (
        <Button
          onClick={() => onJobSelect(selectedJob)}
          className="w-full h-12 text-base"
          variant="outline"
        >
          <Briefcase className="h-5 w-5 mr-2" />
          Enter Job #{selectedJob.ordre_nr}
        </Button>
      )}
    </div>
  );
}
