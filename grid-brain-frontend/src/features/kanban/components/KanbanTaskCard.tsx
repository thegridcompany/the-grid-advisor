'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { KanbanTaskCardProps } from '../types';
import { PriorityBadge } from './atoms/PriorityBadge';
import { DragHandle } from './atoms/DragHandle';
import { Highlight } from './atoms/Highlight';
import { UsersIcon, HashIcon, PencilIcon, Trash2Icon } from './atoms/Icons';

const KanbanTaskCardComponent: React.FC<KanbanTaskCardProps> = ({
  task,
  className,
  searchQuery,
  isFocused,
  onEditTask,
  onDeleteTask,
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
    },
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
        'bg-[#21262D] border border-[#30363D] rounded-lg p-3 shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer',
        'h-full flex flex-col relative group',
        'border-l-4',
        task.priority ? priorityColors[task.priority] : 'border-l-gray-400',
        isDragging && 'opacity-50 rotate-3 scale-105',
        isFocused && 'ring-2 ring-offset-2 ring-blue-500 ring-offset-[#0D1117]',
        className
      )}
      {...attributes}
    >
      <div className="flex items-start gap-3 h-full">
        <DragHandle
          ariaLabel={`Drag task: ${task.title}`}
          listeners={listeners}
          className="pt-1 text-gray-400"
        />

        <div className="flex flex-col flex-1 min-w-0 h-full">
          <div className="flex-grow">
            <h4 className="font-medium text-gray-200 text-sm">
              <Highlight text={task.title} query={searchQuery || ''} />
            </h4>

            {task.description && (
              <p className="text-xs text-gray-400 mt-1.5 line-clamp-3">
                {task.description}
              </p>
            )}
          </div>

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card drag
                onEditTask(task);
              }}
              className="p-1 rounded-md hover:bg-gray-700"
            >
              <PencilIcon className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card drag
                onDeleteTask(task.id);
              }}
              className="p-1 rounded-md hover:bg-red-900/50"
            >
              <Trash2Icon className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="flex items-center gap-1">
                <HashIcon className="w-3 h-3" />
                <span className="text-xs font-mono">{task.id}</span>
              </div>
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-3 h-3" />
                  <span className="text-xs">{task.assignee}</span>
                </div>
              )}
            </div>

            {task.priority && <PriorityBadge priority={task.priority} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export const KanbanTaskCard = React.memo(KanbanTaskCardComponent);