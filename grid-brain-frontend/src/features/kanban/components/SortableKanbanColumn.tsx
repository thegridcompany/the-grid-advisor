'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanColumn } from './KanbanColumn';
import { Column, Task } from '../types';

interface SortableKanbanColumnProps {
  column: Column;
  tasks: Task[];
  searchQuery?: string;
  isFocused?: boolean;
  focusedTaskId?: string | null;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isAddingCard?: boolean;
  onToggleAddingCard?: () => void;
}

// This component makes a KanbanColumn sortable.
export const SortableKanbanColumn: React.FC<SortableKanbanColumnProps> = ({ column, tasks, searchQuery, isFocused, focusedTaskId, onEditTask, onDeleteTask, isAddingCard, onToggleAddingCard }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: column.id,
    data: {
      type: 'Column',
      column,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    flexShrink: 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={isFocused ? 'ring-2 ring-offset-2 ring-offset-[#0D1117] ring-blue-500 rounded-lg' : ''}>
      <KanbanColumn
        id={column.id}
        title={column.title}
        tasks={tasks}
        taskIds={column.taskIds}
        limit={column.limit}
        color={column.color}
        dragHandleListeners={listeners}
        searchQuery={searchQuery}
        focusedTaskId={focusedTaskId}
        isFocused={isFocused}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        isAddingCard={isAddingCard}
        onToggleAddingCard={onToggleAddingCard}
      />
    </div>
  );
}; 