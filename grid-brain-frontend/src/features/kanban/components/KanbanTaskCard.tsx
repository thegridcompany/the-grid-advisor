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
    disabled: isFocused,
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
        'bg-[#21262D] border border-[#30363D] rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer',
        'flex flex-col relative group overflow-hidden',
        'border-l-4',
        task.priority ? priorityColors[task.priority] : 'border-l-gray-400',
        isDragging && 'opacity-50 rotate-3 scale-105',
        isFocused && 'ring-2 ring-offset-2 ring-blue-500 ring-offset-[#0D1117]',
        className
      )}
      {...attributes}
    >
      {/* Header con titolo e icone CRUD */}
      <div className="flex items-start justify-between gap-2 p-3 pb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <DragHandle
            ariaLabel={`Drag task: ${task.title}`}
            listeners={listeners}
            className="mt-0.5 text-gray-400 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-200 text-sm leading-tight">
              <Highlight text={task.title} query={searchQuery || ''} />
            </h4>
          </div>
        </div>
        
        {/* Icone CRUD sempre visibili su mobile, hover su desktop */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTask(task);
            }}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            title="Edit task"
          >
            <PencilIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-200" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="p-1.5 rounded-md hover:bg-red-900/50 transition-colors"
            title="Delete task"
          >
            <Trash2Icon className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Descrizione */}
      {task.description && (
        <div className="px-3 pb-2">
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>
      )}

      {/* Footer con metadata */}
      <div className="px-3 pb-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-500 min-w-0">
            <div className="flex items-center gap-1">
              <HashIcon className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs font-mono">{task.id}</span>
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1 min-w-0">
                <UsersIcon className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs truncate">{task.assignee}</span>
              </div>
            )}
          </div>
          {task.priority && (
            <div className="flex-shrink-0">
              <PriorityBadge priority={task.priority} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const KanbanTaskCard = React.memo(KanbanTaskCardComponent);