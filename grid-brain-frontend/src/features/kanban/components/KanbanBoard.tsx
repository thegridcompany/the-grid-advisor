'use client';

import React, { useState, Suspense, lazy } from 'react';
import { DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
// import { arrayMove } from '@dnd-kit/sortable'; // This logic will move to the reducer
import { KanbanContextContainer } from './KanbanContext';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { SortableKanbanColumn } from './SortableKanbanColumn';
import { KanbanToolbar } from './KanbanToolbar';
import { Task, Column, KanbanBoardProps } from '../types'; // Added Column back
import { useKanbanState, useKanbanDispatch } from '../state/kanbanContext';
import { useIsClient } from '@/hooks/useIsClient'; // Import the new hook
import { useHotkeys } from '@/hooks/useHotkeys';
import { cn } from '@/lib/utils';

const LazyFilterPanel = lazy(() =>
  import('./FilterPanel').then(module => ({ default: module.FilterPanel }))
);

// Default sample data - ensure these are exported for the provider
export const defaultTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design login page mockups',
    description: 'Create wireframes and high-fidelity mockups for the authentication flow',
    priority: 'high',
    assignee: 'Designer'
  },
  {
    id: 'task-2',
    title: 'Set up authentication API',
    description: 'Implement JWT-based authentication with FastAPI',
    priority: 'high',
    assignee: 'Backend Dev'
  },
  {
    id: 'task-3',
    title: 'Write unit tests for user service',
    description: 'Add comprehensive test coverage for user-related functionality',
    priority: 'medium',
    assignee: 'QA Engineer'
  },
  {
    id: 'task-4',
    title: 'Research drag and drop libraries',
    description: 'Evaluate @dnd-kit vs react-beautiful-dnd for Kanban implementation',
    priority: 'low',
    assignee: 'Frontend Dev'
  },
  {
    id: 'task-5',
    title: 'Database schema design',
    description: 'Design PostgreSQL schema for board and task management',
    priority: 'high',
    assignee: 'Backend Dev'
  }
];

export const defaultColumns: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    taskIds: ['task-1', 'task-2', 'task-4']
  },
  {
    id: 'sprint',
    title: 'Sprint',
    taskIds: ['task-3']
  },
  {
    id: 'done',
    title: 'Done',
    taskIds: ['task-5']
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  // onTaskUpdate, // Removed
  // onColumnUpdate, // Removed
  isLoading: isLoadingProp,
  className 
}) => {
  const { tasks, columns, columnOrder, isLoading: isLoadingState } = useKanbanState();
  const { moveTask, addColumn, moveColumn } = useKanbanDispatch();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<Task>>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(columnOrder[0] || null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [isDragInProgress, setIsDragInProgress] = useState(false); // Prevent double drag events
  const isClient = useIsClient(); // Use the hook

  const isLoading = isLoadingProp !== undefined ? isLoadingProp : isLoadingState;

  useHotkeys([
    ['ArrowRight', () => {
      if (!focusedId) return;
      const index = columnOrder.indexOf(focusedId);
      if (index > -1 && index < columnOrder.length - 1) {
        setFocusedId(columnOrder[index + 1]);
        setFocusedTaskId(null); // Reset task focus when changing column
      }
    }],
    ['ArrowLeft', () => {
      if (!focusedId) return;
      const index = columnOrder.indexOf(focusedId);
      if (index > 0) {
        setFocusedId(columnOrder[index - 1]);
        setFocusedTaskId(null); // Reset task focus when changing column
      }
    }],
    ['ArrowDown', () => {
      if (!focusedId) return;
      const column = columns[focusedId];
      if (!column || column.taskIds.length === 0) return;

      const currentTaskIndex = focusedTaskId ? column.taskIds.indexOf(focusedTaskId) : -1;
      const nextTaskIndex = (currentTaskIndex + 1) % column.taskIds.length;
      setFocusedTaskId(column.taskIds[nextTaskIndex]);
    }],
    ['ArrowUp', () => {
      if (!focusedId) return;
      const column = columns[focusedId];
      if (!column || column.taskIds.length === 0) return;

      const currentTaskIndex = focusedTaskId ? column.taskIds.indexOf(focusedTaskId) : -1;
      if (currentTaskIndex === -1) {
        // If no task is focused, focus the last one
        setFocusedTaskId(column.taskIds[column.taskIds.length - 1]);
      } else {
        const prevTaskIndex = (currentTaskIndex - 1 + column.taskIds.length) % column.taskIds.length;
        setFocusedTaskId(column.taskIds[prevTaskIndex]);
      }
    }],
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = () => {
    setIsFilterPanelOpen(true);
  };

  const handleApplyFilters = (newFilters: Partial<Task>) => {
    setFilters(newFilters);
    setIsFilterPanelOpen(false);
  };

  const handleAddNewColumn = () => {
    // Potremmo aprire un modale per chiedere il titolo, ma per ora usiamo un default.
    addColumn("New Column");
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Column') {
      setActiveColumn(active.data.current?.column);
    } else if (type === 'Task') {
      const task = tasks[active.id as string];
      if (task) setActiveTask(task);
    }
    setIsDragInProgress(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setActiveColumn(null);
    
    // Prevent double drag end events
    if (!isDragInProgress) {
      console.log('[handleDragEnd] Ignoring duplicate drag end event');
      return;
    }
    setIsDragInProgress(false);
    
    const { active, over } = event;

    if (!over) {
      console.log('[handleDragEnd] No drop target, cancelling drag');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      return; // Dropped on itself
    }

    const isActiveAColumn = active.data.current?.type === 'Column';

    if (isActiveAColumn) {
      const sourceIndex = columnOrder.indexOf(activeId);
      const targetIndex = columnOrder.indexOf(overId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        await moveColumn(sourceIndex, targetIndex);
      }
      return;
    }

    // Determine source column and task index
    let sourceColumnId: string | undefined;
    let sourceTaskIndex = -1;

    for (const colId of columnOrder) {
      const col = columns[colId];
      if (!col) continue; // Aggiunto controllo per colonna non definita
      const taskIndex = col.taskIds.indexOf(activeId);
      if (taskIndex !== -1) {
        sourceColumnId = colId;
        sourceTaskIndex = taskIndex;
        break;
      }
    }

    if (!sourceColumnId) {
      console.warn('Source column not found for task:', activeId);
      return;
    }

    // Determine target column and task index
    let targetColumnId: string | undefined = overId; // Initially assume overId is a column id
    let targetTaskIndex = -1;

    if (columns[overId]) { // overId is a columnId
      targetColumnId = overId;
      // When dropping on a column, usually append to end or a predefined spot
      // For now, let's assume it implies the end if not over another task
      targetTaskIndex = columns[overId].taskIds.length;
    } else { // overId is a taskId
      for (const colId of columnOrder) {
        const col = columns[colId];
        if (!col) continue; // Aggiunto controllo
        const taskIndex = col.taskIds.indexOf(overId);
        if (taskIndex !== -1) {
          targetColumnId = colId;
          targetTaskIndex = taskIndex;
          break;
        }
      }
    }
    
    if (!targetColumnId) {
        console.warn('Target column could not be determined for overId:', overId);
        return;
    }

    console.log('Drag ended:', { activeId, sourceColumnId, sourceTaskIndex, targetColumnId, targetTaskIndex, overId });

    await moveTask({
        taskId: activeId,
        sourceColumnId: sourceColumnId,
        sourceIndex: sourceTaskIndex,
        targetColumnId: targetColumnId,
        targetIndex: targetTaskIndex, 
    });

    // The onTaskMove prop is removed, logic is now in the reducer via dispatch
    // if (onTaskMove) { ... }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading Kanban board...</div>;
  }

  // Conditionally render D&D context only on client
  if (!isClient) {
    // You can return a placeholder or null during SSR for the D&D part
    // For example, a simpler non-interactive version or just the board structure without cards
    // Or simply null if the D&D part is critical and needs client JS.
    // Returning the basic structure might be better to avoid layout shifts.
    return (
      <div className={cn("p-6", className)}>
        <KanbanToolbar 
          onSearch={handleSearch} 
          onFilter={handleFilter}
          onAddNewColumn={handleAddNewColumn} 
          filterActive={Object.keys(filters).length > 0}
        />
        <Suspense fallback={<div>Loading...</div>}>
          {isFilterPanelOpen && <LazyFilterPanel onApplyFilters={handleApplyFilters} initialFilters={filters} onClose={() => setIsFilterPanelOpen(false)} />}
        </Suspense>
        <div className="flex gap-4 overflow-x-auto mt-4 pb-4">
          {columnOrder.map(columnId => {
            const column = columns[columnId];
            if (!column) return null;
            const columnTasks = column.taskIds.map(taskId => tasks[taskId]).filter(Boolean);
            const filteredTasks = columnTasks.filter(task => 
              task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
              (Object.keys(filters).length === 0 || 
                (filters.priority ? task.priority === filters.priority : true)
                // Add other filters here
              )
            );
            return (
              <SortableKanbanColumn 
                key={column.id} 
                column={column} 
                tasks={filteredTasks} 
                searchQuery={searchQuery}
                isFocused={focusedId === column.id}
                focusedTaskId={focusedTaskId}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Debug: Check for duplicate task IDs before rendering
  const allRenderingTaskIds: string[] = [];
  columnOrder.forEach(columnId => {
    const column = columns[columnId];
    if (column) {
      allRenderingTaskIds.push(...column.taskIds);
    }
  });
  const uniqueRenderingTaskIds = new Set(allRenderingTaskIds);
  if (allRenderingTaskIds.length !== uniqueRenderingTaskIds.size) {
    console.error('[KanbanBoard] DUPLICATE TASK IDS DETECTED DURING RENDER!', {
      totalCount: allRenderingTaskIds.length,
      uniqueCount: uniqueRenderingTaskIds.size,
      allTaskIds: allRenderingTaskIds,
      duplicates: allRenderingTaskIds.filter((id, index, arr) => arr.indexOf(id) !== index),
      columnBreakdown: Object.fromEntries(
        columnOrder.map(columnId => [columnId, columns[columnId]?.taskIds || []])
      )
    });
  }

  return (
    <KanbanContextContainer onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={cn("p-6", className)}>
        <KanbanToolbar 
          onSearch={handleSearch} 
          onFilter={handleFilter}
          onAddNewColumn={handleAddNewColumn} 
          filterActive={Object.keys(filters).length > 0}
        />
        <Suspense fallback={<div>Loading...</div>}>
          {isFilterPanelOpen && <LazyFilterPanel onApplyFilters={handleApplyFilters} initialFilters={filters} onClose={() => setIsFilterPanelOpen(false)} />}
        </Suspense>
        <div className="flex gap-4 overflow-x-auto mt-4 pb-4">
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            {columnOrder.map(columnId => {
              const column = columns[columnId];
              if (!column) {
                console.warn(`Column with id ${columnId} not found in columns object.`);
                return null;
              }
              const columnTasks = column.taskIds.map(taskId => tasks[taskId]).filter(Boolean);
              
              const filteredTasks = columnTasks.filter(task => 
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                (Object.keys(filters).length === 0 || 
                  (filters.priority ? task.priority === filters.priority : true)
                  // Add other filters here
                )
              );

              return (
                <SortableKanbanColumn 
                  key={column.id} 
                  column={column} 
                  tasks={filteredTasks} 
                  searchQuery={searchQuery}
                  isFocused={focusedId === column.id}
                  focusedTaskId={focusedTaskId}
                />
              );
            })}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask && <KanbanTaskCard task={activeTask} />}
          {activeColumn && (
            <KanbanColumn
              id={activeColumn.id}
              title={activeColumn.title}
              taskIds={activeColumn.taskIds}
              tasks={activeColumn.taskIds.map(id => tasks[id])}
            />
          )}
        </DragOverlay>
      </div>
    </KanbanContextContainer>
  );
}; 