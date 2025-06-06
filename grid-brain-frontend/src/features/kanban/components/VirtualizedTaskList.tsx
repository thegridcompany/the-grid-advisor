'use client';

import React from 'react';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Task } from '../types';

interface VirtualizedTaskListProps {
  tasks: Task[];
  taskIds: string[];
  searchQuery?: string;
  focusedTaskId?: string | null;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  taskIds,
  searchQuery,
  focusedTaskId,
  onEditTask,
  onDeleteTask,
}) => {
  // Tasks are already filtered in KanbanBoard, just render them in correct order
  const orderedTasks = taskIds
    .map(taskId => tasks.find(task => task.id === taskId))
    .filter((task): task is Task => task !== undefined);

  return (
    <div className="space-y-3 py-1">
      {orderedTasks.map((task) => (
        <div key={task.id} className="flex-shrink-0">
          <KanbanTaskCard
            task={task}
            searchQuery={searchQuery}
            isFocused={focusedTaskId === task.id}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        </div>
      ))}
    </div>
  );
}; 