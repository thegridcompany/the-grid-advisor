'use client';

import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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

const Row = ({ index, style, data }: ListChildComponentProps<{
  tasks: Task[];
  taskIds: string[];
  searchQuery?: string;
  focusedTaskId?: string | null;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}>) => {
  const { tasks, taskIds, searchQuery, focusedTaskId, onEditTask, onDeleteTask } = data;
  const taskId = taskIds[index];
  const task = tasks.find((t: Task) => t.id === taskId);

  if (!task) return null;

  return (
    <div style={style} className="px-2 py-2">
                <KanbanTaskCard
                  task={task}
                  searchQuery={searchQuery}
                  isFocused={focusedTaskId === task.id}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              </div>
            );
};

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  taskIds,
  searchQuery,
  focusedTaskId,
  onEditTask,
  onDeleteTask,
}) => {
  const itemData = { tasks, taskIds, searchQuery, focusedTaskId, onEditTask, onDeleteTask };
  const rowHeight = 136; // Increased from 128 to account for more padding

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemCount={taskIds.length}
          itemSize={rowHeight}
          itemData={itemData}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}; 