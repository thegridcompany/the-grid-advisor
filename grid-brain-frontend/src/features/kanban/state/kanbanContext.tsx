'use client';

import React, { createContext, useReducer, useContext, ReactNode, Dispatch, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Task, Column, KanbanState, KanbanAction, KanbanTaskStatus, KanbanTaskPriority } from '../types';
import * as kanbanApi from '../services/kanbanApi';


// Default empty state if nothing in localStorage or passed as initial
const defaultGlobalState: KanbanState = {
  tasks: {},
  columns: {},
  columnOrder: [],
  isLoading: false,
  error: undefined,
};

// Reducer function
const kanbanReducer = (state: KanbanState, action: KanbanAction): KanbanState => {
  const executionId = Math.random().toString(36).substring(7);
  console.log(`[kanbanReducer ${executionId}] action:`, action.type, action);
  switch (action.type) {
    case 'FETCH_BOARD_DATA_START':
      return { ...state, isLoading: true, error: undefined };
    case 'FETCH_BOARD_DATA_SUCCESS': {
      const { columns, tasks } = action.payload;

      const tasksById = tasks.reduce((acc: Record<string, Task>, task: Task) => {
        acc[task.id] = task;
        return acc;
      }, {});
      
      const columnsById = columns.reduce((acc: Record<string, Column>, column: Column) => {
        const columnTasks = tasks.filter((t: Task) => t.column_id === column.id).sort((a: Task, b: Task) => a.position - b.position);
        acc[column.id] = {
            ...column,
            title: column.name,
            tasks: columnTasks,
            taskIds: columnTasks.map((t: Task) => t.id)
        };
        return acc;
      }, {});

      const columnOrder = columns.sort((a, b) => a.position - b.position).map(c => c.id);

      return {
        ...state,
        isLoading: false,
        tasks: tasksById,
        columns: columnsById,
        columnOrder: columnOrder,
        error: undefined,
      };
    }
    case 'FETCH_BOARD_DATA_FAILURE':
      return { ...state, isLoading: false, error: action.payload };

    case 'SAVE_TASK_MOVE_START':
      return { ...state, error: undefined };
    
    case 'MOVE_TASK': { 
      const { taskId, sourceColumnId, targetColumnId, newPosition } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;

      const newColumns = JSON.parse(JSON.stringify(state.columns));
      
      // Remove from source
      const sourceCol = newColumns[sourceColumnId];
      if (sourceCol) {
        sourceCol.taskIds = sourceCol.taskIds.filter((id: string) => id !== taskId);
        sourceCol.tasks = sourceCol.tasks.filter((t: Task) => t.id !== taskId);
      }

      // Add to target
      const targetCol = newColumns[targetColumnId];
      if (targetCol) {
          const updatedTask = { ...task, column_id: targetColumnId, position: newPosition ?? 0 };
          targetCol.tasks.splice(newPosition ?? 0, 0, updatedTask);
          // Re-calculate positions for all tasks in the target column
          targetCol.tasks.forEach((t: Task, i: number) => t.position = i);
          targetCol.taskIds = targetCol.tasks.map((t: Task) => t.id);
          
          return {
              ...state,
              columns: newColumns,
              tasks: { ...state.tasks, [taskId]: updatedTask }
          };
      }
      return state;
    }

    case 'SAVE_TASK_MOVE_SUCCESS':
      console.log('[Reducer] SAVE_TASK_MOVE_SUCCESS - keeping optimistic update, only clearing loading state');
      return {
        ...state,
        isLoading: false,
        error: undefined,
      };
    case 'SAVE_TASK_MOVE_FAILURE':
      console.error("SAVE_TASK_MOVE_FAILURE:", action.payload.error);
      return { ...state, isLoading: false, error: action.payload.error };

    case 'MOVE_TASK_ROLLBACK':
      console.warn('[Reducer] Rolling back task move');
      return {
        ...state,
        columns: action.payload.columns,
        columnOrder: action.payload.columnOrder,
        error: action.payload.error,
      };

    case 'ADD_COLUMN': {
      const { newColumn } = action.payload;
      return {
        ...state,
        columns: {
          ...state.columns,
          [newColumn.id]: {
              ...newColumn,
              title: newColumn.name,
              tasks: [],
              taskIds: []
          },
        },
        columnOrder: [...state.columnOrder, newColumn.id],
      };
    }

    case 'UPDATE_COLUMN_TITLE': {
      const { columnId, newTitle } = action.payload;
      const columnToUpdate = state.columns[columnId];
      if (!columnToUpdate) {
        return state; // Column not found
      }
      const updatedColumn = { ...columnToUpdate, title: newTitle, name: newTitle };
      return {
        ...state,
        columns: {
          ...state.columns,
          [columnId]: updatedColumn,
        },
      };
    }

    case 'SET_STATE_FROM_PERSISTENCE': 
      console.warn('[kanbanReducer] SET_STATE_FROM_PERSISTENCE is deprecated.');
      return state;

    case 'UPDATE_COLUMN_COLOR': {
      const { columnId, color } = action.payload;
      const columnToUpdate = state.columns[columnId];
      if (!columnToUpdate) {
        return state;
      }
      const updatedColumn = { ...columnToUpdate, color };
      return {
        ...state,
        columns: {
          ...state.columns,
          [columnId]: updatedColumn,
        },
      };
    }

    case 'MOVE_COLUMN': {
      const { sourceIndex, targetIndex } = action.payload;
      const newColumnOrder = Array.from(state.columnOrder);
      const [movedItem] = newColumnOrder.splice(sourceIndex, 1);
      newColumnOrder.splice(targetIndex, 0, movedItem);
      return { ...state, columnOrder: newColumnOrder };
    }
    
    case 'DELETE_COLUMN': {
      const { columnId } = action.payload;
      const { [columnId]: deletedColumn, ...remainingColumns } = state.columns;
      if (!deletedColumn) {
        return state;
      }
      const taskIdsToDelete = new Set(deletedColumn.taskIds);
      const remainingTasks = { ...state.tasks };
      taskIdsToDelete.forEach(taskId => {
        delete remainingTasks[taskId];
      });

      return {
        ...state,
        columns: remainingColumns,
        tasks: remainingTasks,
        columnOrder: state.columnOrder.filter(id => id !== columnId),
      };
    }

    case 'ADD_TASK': {
      const { columnId, newTask } = action.payload;
      const column = state.columns[columnId];
      if (!column) {
        console.warn(`[Reducer ADD_TASK] Column with id ${columnId} not found.`);
        return state;
      }

      const newTasks = { ...state.tasks, [newTask.id]: newTask };
      const newColumn = { ...column, tasks: [...column.tasks, newTask].sort((a,b) => a.position - b.position) };
      newColumn.taskIds = newColumn.tasks.map(t => t.id);
      
      return {
        ...state,
        tasks: newTasks,
        columns: { ...state.columns, [columnId]: newColumn },
      };
    }

    case 'UPDATE_TASK': {
      const { updatedTask } = action.payload;
      const oldTask = state.tasks[updatedTask.id];
      if (!oldTask) return state;

      const newTasks = { ...state.tasks, [updatedTask.id]: updatedTask };

      if (oldTask.column_id !== updatedTask.column_id) {
          const newColumns = JSON.parse(JSON.stringify(state.columns));
          
          const sourceCol = newColumns[oldTask.column_id];
          if(sourceCol) {
              sourceCol.tasks = sourceCol.tasks.filter((t: Task) => t.id !== updatedTask.id);
              sourceCol.taskIds = sourceCol.tasks.map((t: Task) => t.id);
          }

          const targetCol = newColumns[updatedTask.column_id];
          if(targetCol) {
              targetCol.tasks.push(updatedTask);
              targetCol.tasks.sort((a: Task, b: Task) => a.position - b.position);
              targetCol.taskIds = targetCol.tasks.map((t: Task) => t.id);
          }

          return { ...state, tasks: newTasks, columns: newColumns };
      } else {
          const column = state.columns[updatedTask.column_id];
          const newColumn = {
              ...column,
              tasks: column.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
          };
          return {
              ...state,
              tasks: newTasks,
              columns: { ...state.columns, [updatedTask.column_id]: newColumn }
          };
      }
    }

    case 'DELETE_TASK': {
      const { taskId } = action.payload;
      const { [taskId]: deletedTask, ...remainingTasks } = state.tasks;
      if (!deletedTask) {
        return state;
      }

      const column = state.columns[deletedTask.column_id];
      if (!column) {
        return state;
      }
      
      const newColumn = {
        ...column,
        tasks: column.tasks.filter(t => t.id !== taskId),
        taskIds: column.taskIds.filter(id => id !== taskId),
      };

      return {
        ...state,
        tasks: remainingTasks,
        columns: {
          ...state.columns,
          [deletedTask.column_id]: newColumn,
        },
      };
    }

    default:
      return state;
  }
};

const KanbanContext = createContext<{ state: KanbanState; dispatch: Dispatch<KanbanAction> } | undefined>(undefined);
const KanbanDispatchContext = createContext<KanbanDispatch | undefined>(undefined);

// Interface for our dispatch context
interface KanbanDispatch {
  dispatch: Dispatch<KanbanAction>;
  addTask: (payload: { columnId: string; title: string; projectId: string }) => Promise<void>;
  addColumn: (payload: { name: string; projectId: string }) => Promise<void>;
  updateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  moveColumn: (sourceIndex: number, targetIndex: number, columnId: string) => Promise<void>;
  updateColumnColor: (columnId: string, color: string) => Promise<void>;
  updateTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceColumnId: string, destColumnId: string, newPosition: number) => Promise<void>;
  loadBoard: (projectId: string) => Promise<void>;
}

// Props for the provider
interface KanbanProviderProps {
  children: ReactNode;
  projectId: string;
}

// Provider component
export const KanbanProvider: React.FC<KanbanProviderProps> = ({ children, projectId }) => {
  const [state, dispatch] = useReducer(kanbanReducer, defaultGlobalState);
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const loadBoard = useCallback(async (currentProjectId: string) => {
    if (!accessToken) return;
    dispatch({ type: 'FETCH_BOARD_DATA_START' });
    try {
      const boardData = await kanbanApi.fetchBoardData(currentProjectId, accessToken);
      dispatch({ type: 'FETCH_BOARD_DATA_SUCCESS', payload: boardData });
    } catch (error) {
      console.error('Failed to load board data:', error);
      dispatch({ type: 'FETCH_BOARD_DATA_FAILURE', payload: (error as Error).message });
    }
  }, [accessToken]);

  useEffect(() => {
    if (projectId && accessToken) {
      loadBoard(projectId);
    }
  }, [projectId, accessToken, loadBoard]);


  const addColumn = async (payload: { name: string; projectId: string }) => {
    if (!accessToken) return;
    const { name, projectId } = payload;
    const position = state.columnOrder.length;
    try {
      // API expects project_id
      const newColumn = await kanbanApi.createColumn({ name, project_id: projectId, position }, accessToken);
      dispatch({ type: 'ADD_COLUMN', payload: { newColumn } });
    } catch (error) {
      console.error("Failed to add column:", error);
    }
  };

  const updateColumnTitle = async (columnId: string, newTitle: string) => {
    if (!accessToken) return;
    // Optimistic update
    dispatch({ type: 'UPDATE_COLUMN_TITLE', payload: { columnId, newTitle } });
    try {
      await kanbanApi.updateColumn(columnId, { name: newTitle }, accessToken);
    } catch (error) {
      console.error("Failed to update column title:", error);
      // Here you might want to add a rollback mechanism
    }
  };

  const updateColumnColor = async (columnId: string, color: string) => {
    if (!accessToken) return;
    dispatch({ type: 'UPDATE_COLUMN_COLOR', payload: { columnId, color } });
    try {
      await kanbanApi.updateColumn(columnId, { color }, accessToken);
    } catch (error) {
      console.error("Failed to update column color:", error);
      // Rollback logic could be added here
    }
  };

  const moveColumn = async (sourceIndex: number, targetIndex: number, columnId: string) => {
    if (!accessToken) return;
    
    // Optimistic update
    dispatch({ type: 'MOVE_COLUMN', payload: { sourceIndex, targetIndex } });

    try {
        // Here we'd need to update all affected columns' positions on the backend
        // For now, just updating the moved one. A more robust solution might be a dedicated endpoint.
        await kanbanApi.updateColumn(columnId, { position: targetIndex }, accessToken);
    } catch (error) {
        console.error("Failed to move column:", error);
        // Rollback on failure by reversing the move
        dispatch({ type: 'MOVE_COLUMN', payload: { sourceIndex: targetIndex, targetIndex: sourceIndex } });
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!accessToken) return;
    const originalState = { ...state };
    // Optimistic delete
    dispatch({ type: 'DELETE_COLUMN', payload: { columnId } });
    try {
      await kanbanApi.deleteColumn(columnId, accessToken);
    } catch (error) {
      console.error("Failed to delete column:", error);
      // Rollback on failure
      dispatch({ type: 'FETCH_BOARD_DATA_SUCCESS', payload: { columns: Object.values(originalState.columns), tasks: Object.values(originalState.tasks) } });
    }
  };

  const addTask = async (payload: { columnId: string; title: string; projectId: string }) => {
    if (!accessToken) return;
    const { columnId, title, projectId } = payload;
    const column = state.columns[columnId];
    if (!column) {
      console.error(`Cannot add task to non-existent column ${columnId}`);
      return;
    }
    const position = column.tasks.length;
    
    try {
      const newTaskData = {
        title,
        project_id: projectId,
        column_id: columnId,
        position,
        description: '', 
        status: KanbanTaskStatus.TODO,
        priority: KanbanTaskPriority.MEDIUM,
        due_date: null
      };
      const newTask = await kanbanApi.createTask(newTaskData, accessToken);
      dispatch({ type: 'ADD_TASK', payload: { columnId, newTask } });
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const updateTask = async (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => {
      if (!accessToken) return;
      const originalTask = state.tasks[taskId];
      if (!originalTask) return;

      const updatedTask = { ...originalTask, ...updatedFields };

      // Optimistic update
      dispatch({ type: 'UPDATE_TASK', payload: { updatedTask } });

      try {
          await kanbanApi.updateTask(taskId, updatedFields, accessToken);
      } catch (error) {
          console.error("Failed to update task:", error);
          // Rollback
          dispatch({ type: 'UPDATE_TASK', payload: { updatedTask: originalTask } });
      }
  };

  const deleteTask = async (taskId: string) => {
      if (!accessToken) return;
      const taskToDelete = state.tasks[taskId];
      if (!taskToDelete) return;
      
      // Optimistic delete
      dispatch({ type: 'DELETE_TASK', payload: { taskId } });

      try {
          await kanbanApi.deleteTask(taskId, accessToken);
      } catch (error) {
          console.error("Failed to delete task:", error);
          // Rollback
          dispatch({ type: 'ADD_TASK', payload: { columnId: taskToDelete.column_id, newTask: taskToDelete } });
      }
  };

  const moveTask = async (taskId: string, sourceColumnId: string, destColumnId: string, newPosition: number) => {
    if (!accessToken) return;
    
    const originalState = {
        columns: JSON.parse(JSON.stringify(state.columns)),
        columnOrder: [...state.columnOrder],
    };

    // Optimistic update
    dispatch({ type: 'MOVE_TASK', payload: { taskId, sourceColumnId, targetColumnId: destColumnId, newPosition, sourceIndex: 0, targetIndex: null } });
    
    dispatch({ type: 'SAVE_TASK_MOVE_START' });

    try {
        await kanbanApi.moveTask(taskId, destColumnId, newPosition, accessToken);
        dispatch({ type: 'SAVE_TASK_MOVE_SUCCESS' });
    } catch (error) {
        console.error("Failed to move task:", error);
        dispatch({
            type: 'MOVE_TASK_ROLLBACK',
            payload: {
                columns: originalState.columns,
                columnOrder: originalState.columnOrder,
                error: (error as Error).message
            }
        });
    }
  };

  const dispatchers: KanbanDispatch = {
    dispatch,
    loadBoard,
    addColumn,
    updateColumnTitle,
    updateColumnColor,
    moveColumn,
    deleteColumn,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  };

  return (
    <KanbanContext.Provider value={{ state, dispatch }}>
      <KanbanDispatchContext.Provider value={dispatchers}>
        {children}
      </KanbanDispatchContext.Provider>
    </KanbanContext.Provider>
  );
};

// Custom hooks to use the context
export const useKanbanState = () => {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error('useKanbanState must be used within a KanbanProvider');
  }
  return context.state;
};

export const useKanbanDispatch = () => {
  const context = useContext(KanbanDispatchContext);
  if (context === undefined) {
    throw new Error('useKanbanDispatch must be used within a KanbanProvider');
  }
  return context;
}; 