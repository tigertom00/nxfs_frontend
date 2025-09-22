'use client';

import { Job } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobHeaderProps {
  job: Job;
  onBack: () => void;
}

export function JobHeader({ job, onBack }: JobHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Job Navigation Arrows */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Info Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Job #{job.ordre_nr}</h1>
        {job.tittel && (
          <h2 className="text-lg text-muted-foreground">{job.tittel}</h2>
        )}
        {job.adresse && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            📍 {job.adresse.split(',')[0]}
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            job.ferdig
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 purple:bg-green-50 purple:text-green-700'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 purple:bg-purple-100 purple:text-purple-800'
          }`}
        >
          {job.ferdig ? '✅ Completed' : '🚧 In Progress'}
        </div>
      </div>
    </div>
  );
}
