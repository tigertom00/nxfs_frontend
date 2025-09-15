'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-6 w-3/4' />
            <div className='flex space-x-2'>
              <Skeleton className='h-6 w-16' />
              <Skeleton className='h-6 w-20' />
            </div>
          </div>
          <div className='flex space-x-1'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <div className='flex space-x-4'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}