// This is the main Kanban Board component. It orchestrates all the state and actions.
'use client';

import React, { useState, Suspense, lazy, useMemo } from 'react';
import { DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
// import { arrayMove } from '@dnd-kit/sortable'; // This logic will move to the reducer
import { KanbanContextContainer } from './KanbanContext';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { SortableKanbanColumn } from './SortableKanbanColumn';
import { KanbanToolbar } from './KanbanToolbar';
import { Task, Column, KanbanBoardProps } from '../types';

interface Command {
  id: string;
  label: string;
  action: () => void;
  hotkey?: string;
  disabled?: boolean;
}

import { useKanbanState, useKanbanDispatch } from '../state/kanbanContext';
import { useProject } from '@/contexts/ProjectContext';
import { useIsClient } from '@/hooks/useIsClient'; // Import the new hook
import { useHotkeys } from '@/hooks/useHotkeys';
import { cn } from '@/lib/utils';
import { EditTaskModal } from './EditTaskModal';
import { CommandPalette } from './CommandPalette';

const LazyFilterPanel = lazy(() =>
  import('./FilterPanel').then(module => ({ default: module.FilterPanel }))
);

// NOTA: I dati di default sono stati rimossi. Il componente ora si affida
// esclusivamente ai dati caricati dal provider di contesto (`KanbanProvider`).
// Questo previene errori di tipo e assicura che il componente sia sempre
// sincronizzato con lo stato reale dell'applicazione.

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  isLoading: isLoadingProp,
  className 
}) => {
  const { currentProject } = useProject();
  const { tasks, columns, columnOrder, isLoading: isLoadingState } = useKanbanState();
  const { moveTask, addColumn, moveColumn, updateTask, deleteTask, deleteColumn } = useKanbanDispatch();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<Task>>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(columnOrder[0] || null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [isDragInProgress, setIsDragInProgress] = useState(false); // Prevent double drag events
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingTaskInColumn, setAddingTaskInColumn] = useState<string | null>(null);
  const isClient = useIsClient(); // Use the hook

  const isLoading = isLoadingProp !== undefined ? isLoadingProp : isLoadingState;

  // Helper function to filter tasks based on search and filters
  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      // Search filter - check multiple fields
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());

      // Priority filter
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      
      // Add more filters here as needed
      // const matchesAssignee = !filters.assignee || task.assignee === filters.assignee;
      
      return matchesSearch && matchesPriority;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = () => {
    setIsFilterPanelOpen(true);
  };

  const handleApplyFilters = (newFilters: Partial<Task>) => {
    setFilters(newFilters);
    // Don't close panel anymore - keep it open for better UX
  };

  const handleAddNewColumn = () => {
    if (!currentProject) {
      console.warn('No project selected');
      return;
    }
    addColumn({ name: "New Column", projectId: currentProject.id });
  };

  useHotkeys([
    // Navigation
    ['ArrowRight', () => {
      if (!focusedId) return;
      const index = columnOrder.indexOf(focusedId);
      if (index > -1 && index < columnOrder.length - 1) {
        setFocusedId(columnOrder[index + 1]);
        setFocusedTaskId(null);
      }
    }],
    ['ArrowLeft', () => {
      if (!focusedId) return;
      const index = columnOrder.indexOf(focusedId);
      if (index > 0) {
        setFocusedId(columnOrder[index - 1]);
        setFocusedTaskId(null);
      }
    }],
    ['ArrowDown', () => {
      if (!focusedId) return;
      const column = columns[focusedId];
      if (!column || column.taskIds.length === 0) return;
      const currentTaskIndex = focusedTaskId ? column.taskIds.indexOf(focusedTaskId) : -1;
      setFocusedTaskId(column.taskIds[(currentTaskIndex + 1) % column.taskIds.length]);
    }],
    ['ArrowUp', () => {
      if (!focusedId) return;
      const column = columns[focusedId];
      if (!column || column.taskIds.length === 0) return;
      const currentTaskIndex = focusedTaskId ? column.taskIds.indexOf(focusedTaskId) : -1;
      const newIndex = (currentTaskIndex - 1 + column.taskIds.length) % column.taskIds.length;
      setFocusedTaskId(column.taskIds[newIndex]);
    }],

    // Task Actions (no modifier)
    ['Enter', () => {
      if (focusedTaskId) {
        const task = tasks[focusedTaskId];
        if (task) handleEditTask(task);
      }
    }],
    ['d', () => {
      if (focusedTaskId) {
        const task = tasks[focusedTaskId];
        if (task && window.confirm(`Delete task "${task.title}"?`)) {
          deleteTask(task.id);
        }
      }
    }],

    // Column Actions (requires Shift)
    ['Shift+N', () => {
      if (focusedId) {
        setAddingTaskInColumn(focusedId);
        setFocusedTaskId(null);
      }
    }],
    ['Shift+D', () => {
      if (focusedId) {
        const column = columns[focusedId];
        if (column && window.confirm(`Delete column "${column.title}"?`)) {
          deleteColumn(column.id);
        }
      }
    }],

    // General Actions
    ['c', handleAddNewColumn],
    ['f', handleFilter],
  ], { priority: 1 });

  const dynamicCommands = useMemo(() => {
    const allCommands: Command[] = [
      { id: 'add-column', label: 'Add New Column', action: handleAddNewColumn, hotkey: 'c' },
      { id: 'toggle-filters', label: 'Toggle Filters', action: handleFilter, hotkey: 'f' },
    ];

    const focusedColumn = focusedId ? columns[focusedId] : null;
    const focusedTask = focusedTaskId ? tasks[focusedTaskId] : null;

    // Column-specific commands
    allCommands.push({
      id: 'add-task',
      label: 'Add New Task in Column',
      action: () => {
        if (focusedId) {
          setAddingTaskInColumn(focusedId);
          setFocusedTaskId(null);
        }
      },
      hotkey: 'Shift+N',
      disabled: !focusedColumn,
    });
    allCommands.push({
      id: 'delete-column',
      label: 'Delete Focused Column',
      action: () => {
        if (focusedColumn) {
          if (window.confirm(`Are you sure you want to delete "${focusedColumn.title}"?`)) {
            deleteColumn(focusedColumn.id);
          }
        }
      },
      hotkey: 'Shift+D',
      disabled: !focusedColumn,
    });

    // Task-specific commands
    allCommands.push({
      id: 'edit-task',
      label: 'Edit Focused Task',
      action: () => focusedTask && handleEditTask(focusedTask),
      hotkey: 'Enter',
      disabled: !focusedTask,
    });
    allCommands.push({
      id: 'delete-task',
      label: 'Delete Focused Task',
      action: () => {
        if (focusedTask) {
          if (window.confirm(`Are you sure you want to delete "${focusedTask.title}"?`)) {
            deleteTask(focusedTask.id);
          }
        }
      },
      hotkey: 'd',
      disabled: !focusedTask,
    });

    return allCommands;
  }, [focusedId, focusedTaskId, columns, tasks, deleteTask, deleteColumn]);

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
        // La firma della funzione richiede anche il columnId
        await moveColumn(sourceIndex, targetIndex, activeId);
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

    if (sourceColumnId && targetColumnId && sourceTaskIndex !== -1 && targetTaskIndex !== -1) {
      await moveTask(activeId, sourceColumnId, targetColumnId, targetTaskIndex);
    }

    // The onTaskMove prop is removed, logic is now in the reducer via dispatch
    // if (onTaskMove) { ... }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };
  
  const handleSaveTask = (updatedTask: Task) => {
    // La funzione si aspetta l'ID del task e un oggetto con i campi da aggiornare
    const { id, ...updatePayload } = updatedTask;
    updateTask(id, updatePayload);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  // Show message if no project is selected
  if (!currentProject) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            No Project Selected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a project to view the Kanban board.
          </p>
        </div>
      </div>
    );
  }

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
          activeFiltersCount={Object.keys(filters).length}
        />
        <Suspense fallback={<div>Loading...</div>}>
          {isFilterPanelOpen && <LazyFilterPanel onApplyFilters={handleApplyFilters} initialFilters={filters} onClose={() => setIsFilterPanelOpen(false)} />}
        </Suspense>
        <div className="flex gap-4 overflow-x-auto mt-4 pb-4">
          {columnOrder.map(columnId => {
            const column = columns[columnId];
            if (!column) return null;
            const columnTasks = column.taskIds.map(taskId => tasks[taskId]).filter(Boolean);
            const filteredTasks = filterTasks(columnTasks);
            return (
              <SortableKanbanColumn 
                key={column.id} 
                column={column} 
                tasks={filteredTasks} 
                searchQuery={searchQuery}
                isFocused={focusedId === column.id}
                focusedTaskId={focusedTaskId}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                isAddingCard={addingTaskInColumn === column.id}
                onToggleAddingCard={() => setAddingTaskInColumn(prev => prev === column.id ? null : column.id)}
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
      <div className={cn("flex flex-col h-screen bg-[#0D1117] text-white", className)}>
        <div className="p-4 sm:p-6">
        <KanbanToolbar 
          onSearch={handleSearch} 
          onFilter={handleFilter}
          onAddNewColumn={handleAddNewColumn} 
          filterActive={Object.keys(filters).length > 0}
          activeFiltersCount={Object.keys(filters).length}
        />
        </div>
        <Suspense fallback={<div className="px-6">Loading filters...</div>}>
          {isFilterPanelOpen && <LazyFilterPanel onApplyFilters={handleApplyFilters} initialFilters={filters} onClose={() => setIsFilterPanelOpen(false)} />}
        </Suspense>
        <div className="flex-grow flex flex-nowrap gap-4 overflow-x-auto px-4 sm:px-6 pb-4">
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            {columnOrder.map((colId) => {
              const column = columns[colId];
              if (!column) return null;
              const columnTasks = column.taskIds.map(taskId => tasks[taskId]).filter(Boolean);
              const filteredTasks = filterTasks(columnTasks);

              return (
                <SortableKanbanColumn
                  key={column.id}
                  column={column}
                  tasks={filteredTasks}
                  searchQuery={searchQuery}
                  isFocused={focusedId === column.id}
                  focusedTaskId={focusedId === column.id ? focusedTaskId : null}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  isAddingCard={addingTaskInColumn === column.id}
                  onToggleAddingCard={() => setAddingTaskInColumn(prev => prev === column.id ? null : column.id)}
                />
              );
            })}
          </SortableContext>
          <div className="flex-grow"></div>
        </div>

        <DragOverlay>
          {activeTask && <KanbanTaskCard task={activeTask} onEditTask={() => {}} onDeleteTask={() => {}} />}
          {activeColumn && (
            <KanbanColumn
              id={activeColumn.id}
              title={activeColumn.title}
              taskIds={activeColumn.taskIds}
              tasks={activeColumn.taskIds.map(id => tasks[id])}
              onEditTask={() => {}}
              onDeleteTask={() => {}}
            />
          )}
        </DragOverlay>

        <CommandPalette commands={dynamicCommands} />

        {editingTask && (
          <EditTaskModal
            isOpen={!!editingTask}
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleSaveTask}
          />
        )}
      </div>
    </KanbanContextContainer>
  );
}; 