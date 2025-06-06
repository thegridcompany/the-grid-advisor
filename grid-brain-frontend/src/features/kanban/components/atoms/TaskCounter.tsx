'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TaskCounterProps {
  count: number;
  limit?: number;
  className?: string;
}

export const TaskCounter: React.FC<TaskCounterProps> = ({
  count,
  limit,
  className,
}) => {
  const isOverLimit = limit && count > limit;

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <span
        className={cn(
          'text-sm',
          isOverLimit 
            ? 'text-red-600 dark:text-red-400 font-semibold' 
            : 'text-gray-500 dark:text-gray-400'
        )}
      >
        {count}
      </span>
      {limit && (
        <>
          <span className="text-gray-400 dark:text-gray-500 text-sm">/</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">{limit}</span>
        </>
      )}
      <span className="text-gray-500 dark:text-gray-400 text-sm">
        {count === 1 ? 'task' : 'tasks'}
      </span>
    </div>
  );
}; 