'use client';

import React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  listeners?: Record<string, unknown>; // @dnd-kit listeners
}

export const DragHandle: React.FC<DragHandleProps> = ({
  ariaLabel = 'Drag to move',
  size = 'md',
  className,
  listeners,
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      className={cn(
        'flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
        'transition-colors duration-200 p-1 -m-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
        'cursor-grab active:cursor-grabbing',
        className
      )}
      aria-label={ariaLabel}
      {...listeners}
    >
      <GripVertical className={sizeClasses[size]} />
    </button>
  );
}; 