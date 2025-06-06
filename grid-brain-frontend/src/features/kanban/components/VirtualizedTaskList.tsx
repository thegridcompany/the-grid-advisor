'use client';

import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SortableContext } from '@dnd-kit/sortable';

import { KanbanTaskCard } from './KanbanTaskCard';
import { Task } from '../types';

interface VirtualizedTaskListProps {
  tasks: Task[];
  taskIds: string[];
  searchQuery?: string;
  focusedTaskId?: string | null;
}

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({ tasks, taskIds, searchQuery, focusedTaskId }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110, // Estimate size of a task card (p-3, title, desc, meta) -> approx 100-120px
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <SortableContext items={taskIds} strategy={() => null}>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const task = tasks[virtualItem.index];
            if (!task) {
              return null;
            }
            return (
              <div
                key={task.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '4px',
                }}
              >
                <KanbanTaskCard
                  task={task}
                  searchQuery={searchQuery}
                  isFocused={focusedTaskId === task.id}
                />
              </div>
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}; 