'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { KanbanTaskCardProps } from '../types';
import { PriorityBadge } from './atoms/PriorityBadge';
import { DragHandle } from './atoms/DragHandle';
import { Highlight } from './atoms/Highlight';

const KanbanTaskCardComponent: React.FC<KanbanTaskCardProps> = ({
  task,
  className,
  searchQuery,
  isFocused,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: 'border-l-green-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer',
        'border-l-4',
        task.priority ? priorityColors[task.priority] : 'border-l-gray-300',
        isDragging && 'opacity-50 rotate-3 scale-105',
        isFocused && 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900',
        className
      )}
      {...attributes}
    >
      {/* Drag Handle and Content Container */}
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <DragHandle
          ariaLabel={`Drag task: ${task.title}`}
          listeners={listeners}
        />

        {/* Card Content */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
            <Highlight text={task.title} query={searchQuery || ''} />
          </h4>

          {/* Task Description */}
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Task Metadata */}
          <div className="flex items-center justify-between mt-2">
            {/* Task ID */}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              #{task.id}
            </span>

            {/* Priority Badge */}
            {task.priority && (
              <PriorityBadge priority={task.priority} />
            )}
          </div>

          {/* Assignee */}
          {task.assignee && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Assigned to: {task.assignee}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const KanbanTaskCard = React.memo(KanbanTaskCardComponent); 