'use client';

import React, { createContext, useReducer, useContext, ReactNode, Dispatch, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Task, Column, KanbanState, KanbanAction } from '../types';
import * as kanbanApi from '../services/kanbanApi';
import { supabase } from '@/lib/supabase';

// const LOCAL_STORAGE_KEY = 'kanbanState'; // Rimosso perché non più usato qui

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
  console.log(`[kanbanReducer ${executionId}] action:`, action.type, action); // Modificato per loggare l'intera azione
  switch (action.type) {
    case 'FETCH_BOARD_DATA_START':
      return { ...state, isLoading: true, error: undefined };
    case 'FETCH_BOARD_DATA_SUCCESS':
      return {
        ...state,
        isLoading: false,
        tasks: action.payload.tasks,
        columns: action.payload.columns,
        columnOrder: action.payload.columnOrder,
        error: undefined,
      };
    case 'FETCH_BOARD_DATA_FAILURE':
      return { ...state, isLoading: false, error: action.payload };

    case 'SAVE_TASK_MOVE_START':
      // Non impostare isLoading: true qui per evitare il full-page loader.
      // L'UI è già stata aggiornata ottimisticamente.
      // Resettiamo solo eventuali errori precedenti.
      return { ...state, error: undefined };
    
    case 'MOVE_TASK': { 
      const { taskId, sourceColumnId, sourceIndex, targetColumnId, targetIndex } = action.payload;
      
      console.log(`[Reducer ${executionId} MOVE_TASK] Starting with state:`, {
        sourceColumnTaskIds: state.columns[sourceColumnId]?.taskIds || 'MISSING',
        targetColumnTaskIds: state.columns[targetColumnId]?.taskIds || 'MISSING',
        taskAtSourceIndex: state.columns[sourceColumnId]?.taskIds[sourceIndex] || 'MISSING'
      });
      
      // Enhanced StrictMode Guard: Multiple checks to prevent duplicate operations
      const sourceColumn = state.columns[sourceColumnId];
      const targetColumn = state.columns[targetColumnId];
      
      // 1. Check if columns exist
      if (!sourceColumn || !targetColumn) {
        console.warn(`[Reducer ${executionId}] MOVE_TASK: source or target column not found`);
        return state;
      }
      
      // 2. Check if the task is at the expected source position
      if (sourceColumn.taskIds[sourceIndex] !== taskId) {
        console.warn('[MOVE_TASK Guard] Task not found at expected source position, likely already moved', {
          expectedTaskId: taskId,
          actualTaskIdAtPosition: sourceColumn.taskIds[sourceIndex],
          sourceIndex,
          sourceColumnTaskIds: sourceColumn.taskIds
        });
        return state;
      }
      
      // 3. Check if task would be duplicated in target column (different column moves only)
      if (sourceColumnId !== targetColumnId && targetColumn.taskIds.includes(taskId)) {
        console.warn('[MOVE_TASK Guard] Task already exists in target column, preventing duplication', {
          taskId,
          targetColumnId,
          targetColumnTaskIds: targetColumn.taskIds
        });
        return state;
      }
      
      // 4. Additional safeguard: Check if task appears in multiple columns (should never happen)
      let taskFoundInColumns = 0;
      Object.values(state.columns).forEach((col) => {
        if (col.taskIds.includes(taskId)) {
          taskFoundInColumns++;
        }
      });
      
      if (taskFoundInColumns > 1) {
        console.error('[MOVE_TASK Guard] Task already exists in multiple columns, state corrupted!', {
          taskId,
          taskFoundInColumns,
          allColumns: Object.fromEntries(Object.entries(state.columns).map(([id, col]) => [id, col.taskIds]))
        });
        return state;
      }
      
      console.log('[Reducer MOVE_TASK] Payload:', action.payload);

      if (!targetColumnId) { console.warn('MOVE_TASK: targetColumnId is null'); return state; }

      // Same column drag
      if (sourceColumnId === targetColumnId) {
        const newTaskIds = Array.from(sourceColumn.taskIds);
        const [removed] = newTaskIds.splice(sourceIndex, 1);
        const finalTargetIndex = (targetIndex == null || targetIndex < 0) ? newTaskIds.length : targetIndex;
        newTaskIds.splice(finalTargetIndex, 0, removed);

        const newColumn = {
          ...sourceColumn,
          taskIds: newTaskIds,
        };
        
        const newColumns = {
          ...state.columns,
          [sourceColumnId]: newColumn,
        };

        console.log('[Reducer MOVE_TASK] New state columns (same column):', JSON.parse(JSON.stringify(newColumns)));
        
        // Verify no task duplication
        const allTaskIds = Object.values(newColumns).flatMap(col => col.taskIds);
        const uniqueTaskIds = new Set(allTaskIds);
        if (allTaskIds.length !== uniqueTaskIds.size) {
          console.error('[Reducer MOVE_TASK] Task duplication detected in same column move!', {
            allTaskIds,
            uniqueCount: uniqueTaskIds.size,
            totalCount: allTaskIds.length
          });
        }
        
        return { ...state, columns: newColumns };
      }

      // Different column drag
      const newSourceTaskIds = Array.from(sourceColumn.taskIds);
      const [removed] = newSourceTaskIds.splice(sourceIndex, 1);

      const newTargetTaskIds = Array.from(targetColumn.taskIds);
      const finalTargetIndex = (targetIndex == null || targetIndex < 0) ? newTargetTaskIds.length : targetIndex;
      newTargetTaskIds.splice(finalTargetIndex, 0, removed);

      const newColumns = {
        ...state.columns,
        [sourceColumnId]: { ...sourceColumn, taskIds: newSourceTaskIds },
        [targetColumnId]: { ...targetColumn, taskIds: newTargetTaskIds },
      };
      
      // DEBUG LOGGING START (Reducer)
      console.log('[Reducer MOVE_TASK] New state columns (diff column):', JSON.parse(JSON.stringify(newColumns)));
      
      // Verify no task duplication
      const allTaskIds = Object.values(newColumns).flatMap(col => col.taskIds);
      const uniqueTaskIds = new Set(allTaskIds);
      if (allTaskIds.length !== uniqueTaskIds.size) {
        console.error('[Reducer MOVE_TASK] Task duplication detected in different column move!', {
          allTaskIds,
          uniqueCount: uniqueTaskIds.size,
          totalCount: allTaskIds.length
        });
      }
      // DEBUG LOGGING END (Reducer)
      
      return { ...state, columns: newColumns }; 
    }

    case 'SAVE_TASK_MOVE_SUCCESS': // Chiamata API ha confermato il salvataggio
      // Temporarily only update loading state, keep optimistic update
      // This helps isolate if the issue is with API response overwriting the state
      console.log('[Reducer] SAVE_TASK_MOVE_SUCCESS - keeping optimistic update, only clearing loading state');
      return {
        ...state,
        isLoading: false,
        error: undefined,
      };
    case 'SAVE_TASK_MOVE_FAILURE':
      console.error("SAVE_TASK_MOVE_FAILURE:", action.payload.error);
      // Qui non ripristiniamo lo stato perché l'UI è già aggiornata.
      // Il rollback viene gestito da un'azione separata.
      return { ...state, isLoading: false, error: action.payload.error }; // Assicurati che isLoading sia false anche in caso di fallimento

    case 'MOVE_TASK_ROLLBACK':
      console.warn('[Reducer] Rolling back task move');
      return {
        ...state,
        columns: action.payload.columns,
        columnOrder: action.payload.columnOrder,
        error: action.payload.error,
      };

    case 'ADD_COLUMN': {
      const { newColumnId, title } = action.payload;
      const newColumn: Column = {
        id: newColumnId,
        title: title,
        taskIds: [],
      };
      return {
        ...state,
        columns: {
          ...state.columns,
          [newColumnId]: newColumn,
        },
        columnOrder: [...state.columnOrder, newColumnId],
      };
    }

    case 'UPDATE_COLUMN_TITLE': {
      const { columnId, newTitle } = action.payload;
      const columnToUpdate = state.columns[columnId];
      if (!columnToUpdate) {
        return state; // Column not found
      }
      const updatedColumn = { ...columnToUpdate, title: newTitle };
      return {
        ...state,
        columns: {
          ...state.columns,
          [columnId]: updatedColumn,
        },
      };
    }

    case 'SET_STATE_FROM_PERSISTENCE': 
      // Questa azione potrebbe non essere più necessaria se il caricamento iniziale avviene tramite FETCH_BOARD_DATA
      // Tuttavia, la mock API potrebbe ancora popolare localStorage e questo potrebbe essere usato per inizializzare
      // direttamente lo stato se non si vuole passare per la finta chiamata API fetchBoardData al primo caricamento.
      // Per ora, la manteniamo come modo per idratare lo stato, ma il flusso principale sarà FETCH.
      console.warn('[kanbanReducer] SET_STATE_FROM_PERSISTENCE used. Ensure this is intended.');
      return action.payload;

    // New actions for real-time updates
    case 'REALTIME_TASK_UPDATE': {
        const { updatedTask } = action.payload;
        return {
            ...state,
            tasks: {
                ...state.tasks,
                [updatedTask.id]: updatedTask,
            },
        };
    }

    case 'REALTIME_COLUMN_UPDATE': {
        const { updatedColumn } = action.payload;
        return {
            ...state,
            columns: {
                ...state.columns,
                [updatedColumn.id]: {
                    ...state.columns[updatedColumn.id], // preserve existing properties like taskIds
                    ...updatedColumn,
                },
            },
        };
    }

    case 'REALTIME_TASK_MOVE': {
        // This is a simplified version. A robust implementation
        // would need to handle potential conflicts with local optimistic updates.
        const { sourceColumnId, targetColumnId, newSourceTaskIds, newTargetTaskIds } = action.payload;

        if (sourceColumnId === targetColumnId) {
             return {
                ...state,
                columns: {
                    ...state.columns,
                    [sourceColumnId]: {
                        ...state.columns[sourceColumnId],
                        taskIds: newSourceTaskIds,
                    },
                },
            };
        }
        
        return {
            ...state,
            columns: {
                ...state.columns,
                [sourceColumnId]: { ...state.columns[sourceColumnId], taskIds: newSourceTaskIds },
                [targetColumnId]: { ...state.columns[targetColumnId], taskIds: newTargetTaskIds },
            },
        };
    }

    case 'REALTIME_COLUMN_ADDED': {
        const { newColumn } = action.payload;
        return {
            ...state,
            columns: {
                ...state.columns,
                [newColumn.id]: newColumn,
            },
            columnOrder: [...state.columnOrder, newColumn.id],
        };
    }

    case 'REALTIME_COLUMN_TITLE_UPDATED': {
        const { columnId, newTitle } = action.payload;
        return {
            ...state,
            columns: {
                ...state.columns,
                [columnId]: {
                    ...state.columns[columnId],
                    title: newTitle,
                },
            },
        };
    }

    case 'REALTIME_COLUMN_DELETED': {
        const { columnId } = action.payload;
        const { [columnId]: deletedColumn, ...remainingColumns } = state.columns;
        if (!deletedColumn) {
            return state;
        }
        return {
            ...state,
            columns: remainingColumns,
            columnOrder: state.columnOrder.filter(id => id !== columnId),
        };
    }

    case 'REALTIME_COLUMN_MOVED': {
        const { newColumnOrder } = action.payload;
        return {
            ...state,
            columnOrder: newColumnOrder,
        };
    }

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
      // Also remove any tasks that were in the deleted column
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

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [newTask.id]: newTask,
        },
        columns: {
          ...state.columns,
          [columnId]: {
            ...column,
            taskIds: [...column.taskIds, newTask.id],
          },
        },
      };
    }

    case 'UPDATE_TASK': {
      const { updatedTask } = action.payload;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [updatedTask.id]: updatedTask,
        },
      };
    }

    case 'DELETE_TASK': {
      const { taskId } = action.payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [taskId]: deletedTask, ...remainingTasks } = state.tasks;

      // Also remove the task ID from the column it belongs to
      const newColumns = { ...state.columns };
      for (const columnId in newColumns) {
        const column = newColumns[columnId];
        const taskIndex = column.taskIds.indexOf(taskId);
        if (taskIndex > -1) {
          const newTaskIds = [...column.taskIds];
          newTaskIds.splice(taskIndex, 1);
          newColumns[columnId] = { ...column, taskIds: newTaskIds };
          break; // Assume task is only in one column
        }
      }

      return {
        ...state,
        tasks: remainingTasks,
        columns: newColumns,
      };
    }

    default:
      return state;
  }
};

const KanbanStateContext = createContext<KanbanState | undefined>(undefined);

interface KanbanDispatch {
  dispatch: Dispatch<KanbanAction>;
  moveTask: (payload: { taskId: string; sourceColumnId: string; sourceIndex: number; targetColumnId: string; targetIndex: number | null }) => Promise<void>;
  addTask: (payload: { columnId: string, title: string }) => Promise<void>;
  addColumn: (title: string) => Promise<void>;
  updateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  moveColumn: (sourceIndex: number, targetIndex: number) => Promise<void>;
  updateColumnColor: (columnId: string, color: string) => Promise<void>;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
}
const KanbanDispatchContext = createContext<KanbanDispatch | undefined>(undefined);

interface KanbanProviderProps {
  children: ReactNode;
  initialTasks?: Task[]; 
  initialColumns?: Column[];
}

export const KanbanProvider: React.FC<KanbanProviderProps> = ({ 
  children, 
  initialTasks = [], 
  initialColumns = [] 
}) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const initializeStateFromProps = (): KanbanState => {
    if (initialTasks.length > 0 && initialColumns.length > 0) {
      const tasks = initialTasks.reduce((acc, task) => ({ ...acc, [task.id]: task }), {});
      const columns = initialColumns.reduce((acc, column) => ({ ...acc, [column.id]: column }), {});
      const columnOrder = initialColumns.map(column => column.id);
      return { ...defaultGlobalState, tasks, columns, columnOrder };
    }
    return defaultGlobalState;
  };

  const [state, dispatch] = useReducer(kanbanReducer, defaultGlobalState, () => {
    // We are now initializing with a clean slate and fetching from the API,
    // so we don't need to read from localStorage here.
    // The initial state will be the defaultGlobalState.
    return initializeStateFromProps();
  });

  // Add a ref to track if a move operation is in progress
  const isMoveInProgress = useRef(false);

  useEffect(() => {
    if (!state.isLoading && Object.keys(state.tasks).length === 0) {
      const loadBoard = async () => {
        dispatch({ type: 'FETCH_BOARD_DATA_START' });
        try {
          const boardData = await kanbanApi.fetchBoardData();
          dispatch({
            type: 'FETCH_BOARD_DATA_SUCCESS',
            payload: {
              tasks: boardData.tasks,
              columns: boardData.columns,
              columnOrder: boardData.columnOrder,
            }
          });
        } catch (err) {
          dispatch({ type: 'FETCH_BOARD_DATA_FAILURE', payload: err instanceof Error ? err.message : String(err) });
        }
      };
      loadBoard();
    }
  }, [state.isLoading, state.tasks]);
  
  // New useEffect for Supabase Realtime
  useEffect(() => {
    const projectId = '1'; // In a real app, this would be dynamic
    const channel = supabase.channel(`kanban-board:${projectId}`);

    channel
      .on('broadcast', { event: 'task_updated' }, ({ payload }) => {
        console.log('REALTIME: Received task_updated', payload);
        dispatch({ type: 'REALTIME_TASK_UPDATE', payload: { updatedTask: payload.task } });
      })
      .on('broadcast', { event: 'column_updated' }, ({ payload }) => {
        console.log('REALTIME: Received column_updated', payload);
        dispatch({ type: 'REALTIME_COLUMN_UPDATE', payload: { updatedColumn: payload.column } });
      })
      .on('broadcast', { event: 'task_moved' }, ({ payload }) => {
          console.log('REALTIME: Received task_moved', payload);
          // Here we should probably check if the user who triggered the move is the current user
          // to avoid dispatching an action for our own moves.
          // This can be done by sending a userId with the broadcast and comparing it.
          dispatch({ 
              type: 'REALTIME_TASK_MOVE', 
              payload: {
                  taskId: payload.taskId,
                  sourceColumnId: payload.sourceColumnId,
                  targetColumnId: payload.targetColumnId,
                  newSourceTaskIds: payload.sourceTaskIds,
                  newTargetTaskIds: payload.targetTaskIds,
              }
          });
      })
      .on('broadcast', { event: 'column_added' }, ({ payload }) => {
        console.log('REALTIME: Received column_added', payload);
        dispatch({ type: 'REALTIME_COLUMN_ADDED', payload: { newColumn: payload } });
      })
      .on('broadcast', { event: 'column_title_updated' }, ({ payload }) => {
        console.log('REALTIME: Received column_title_updated', payload);
        dispatch({ type: 'REALTIME_COLUMN_TITLE_UPDATED', payload: { columnId: payload.columnId, newTitle: payload.newTitle } });
      })
      .on('broadcast', { event: 'column_deleted' }, ({ payload }) => {
        console.log('REALTIME: Received column_deleted', payload);
        dispatch({ type: 'REALTIME_COLUMN_DELETED', payload: { columnId: payload.columnId } });
      })
      .on('broadcast', { event: 'column_moved' }, ({ payload }) => {
        console.log('REALTIME: Received column_moved', payload);
        dispatch({ type: 'REALTIME_COLUMN_MOVED', payload: { newColumnOrder: payload.columnOrder } });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to Supabase channel!');
        }
        if (status === 'CHANNEL_ERROR') {
            console.error('There was an error subscribing to the channel.');
        }
        if (status === 'TIMED_OUT') {
            console.warn('Subscription timed out.');
        }
      });
      
      channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('Unsubscribed from Supabase channel.');
      }
    };
  }, []);

  const moveTask = useCallback(async (payload: { taskId: string; sourceColumnId: string; sourceIndex: number; targetColumnId: string; targetIndex: number | null }) => {
    if (isMoveInProgress.current) {
      console.warn('Move already in progress, skipping subsequent call.');
      return;
    }
    isMoveInProgress.current = true;

    const originalState = {
      columns: JSON.parse(JSON.stringify(state.columns)),
      columnOrder: [...state.columnOrder],
    };

    dispatch({ type: 'MOVE_TASK', payload });
    
    // Get the state after the optimistic update to broadcast it
    const updatedBoardState = kanbanReducer(state, { type: 'MOVE_TASK', payload });

    // After optimistic update, broadcast the change
    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'task_moved',
          payload: {
            taskId: payload.taskId,
            sourceColumnId: payload.sourceColumnId,
            targetColumnId: payload.targetColumnId,
            sourceTaskIds: updatedBoardState.columns[payload.sourceColumnId].taskIds,
            targetTaskIds: updatedBoardState.columns[payload.targetColumnId].taskIds,
          },
        });
        console.log('Broadcasted task_moved event');
      } catch (error) {
        console.error('Failed to broadcast task_moved event', error);
      }
    }

    try {
      await kanbanApi.saveTaskMove(payload);
      dispatch({ type: 'SAVE_TASK_MOVE_SUCCESS', payload: updatedBoardState });
    } catch (err) {
      console.error('[KanbanProvider moveTask] kanbanApi.saveTaskMove FAILURE', err);
      dispatch({
        type: 'MOVE_TASK_ROLLBACK',
        payload: {
          ...originalState,
          error: err instanceof Error ? err.message : 'Failed to save task move.'
        }
      });
    } finally {
      isMoveInProgress.current = false;
    }
  }, [dispatch, state, isMoveInProgress]);

  const addTask = useCallback(async (payload: { columnId: string, title: string }) => {
    // In a real app, this would first hit an API to get the new task object
    // including the ID generated by the backend.
    // For now, we generate a simple client-side ID.
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: payload.title,
      createdAt: new Date(),
      priority: 'medium', // Default priority
    };

    dispatch({ type: 'ADD_TASK', payload: { columnId: payload.columnId, newTask } });
    
    // Here you would typically save the new task to the backend.
    // await kanbanApi.addTask(newTask, payload.columnId);
  }, [dispatch]);

  const addColumn = useCallback(async (title: string) => {
    // Optimistic UI update
    const newColumnId = `col-${Date.now()}`;
    dispatch({ type: 'ADD_COLUMN', payload: { newColumnId, title } });

    // After optimistic update, broadcast the change
    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'column_added',
          payload: {
            id: newColumnId,
            title,
            taskIds: [],
          },
        });
        console.log('Broadcasted column_added event');
      } catch (error) {
        console.error('Failed to broadcast column_added event', error);
      }
    }
    
    // API call
    try {
      const newColumn = await kanbanApi.saveNewColumn({ id: newColumnId, title });
      // Here you might want to dispatch an action to update the temporary ID
      // with the one from the server, but for now we'll keep it simple.
      console.log('Column added successfully via API', newColumn);
    } catch (error) {
      console.error('Failed to add column via API', error);
      // Implement rollback logic if needed
    }
  }, [dispatch]);

  const updateColumnTitle = useCallback(async (columnId: string, newTitle: string) => {
    dispatch({ type: 'UPDATE_COLUMN_TITLE', payload: { columnId, newTitle } });

    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'column_title_updated',
          payload: { columnId, newTitle },
        });
      } catch (error) {
        console.error('Failed to broadcast column_title_updated event', error);
      }
    }

    try {
      await kanbanApi.saveColumnTitle({ columnId, newTitle });
    } catch (error) {
      console.error('Failed to update column title via API', error);
      // Implement rollback logic if needed
    }
  }, [dispatch]);

  const deleteColumn = useCallback(async (columnId: string) => {
    dispatch({ type: 'DELETE_COLUMN', payload: { columnId } });

    if (channelRef.current) {
        try {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'column_deleted',
                payload: { columnId },
            });
        } catch (error) {
            console.error('Failed to broadcast column_deleted event', error);
        }
    }

    try {
      await kanbanApi.deleteColumn(columnId);
    } catch (error) {
      console.error('Failed to delete column via API', error);
      // Implement rollback logic if needed
    }
  }, [dispatch]);

  const moveColumn = useCallback(async (sourceIndex: number, targetIndex: number) => {
    dispatch({ type: 'MOVE_COLUMN', payload: { sourceIndex, targetIndex } });
    
    const newColumnOrder = Array.from(state.columnOrder);
    const [movedColumn] = newColumnOrder.splice(sourceIndex, 1);
    newColumnOrder.splice(targetIndex, 0, movedColumn);

    if (channelRef.current) {
        try {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'column_moved',
                payload: { columnOrder: newColumnOrder },
            });
        } catch (error) {
            console.error('Failed to broadcast column_moved event', error);
        }
    }

    try {
      await kanbanApi.saveColumnOrder(newColumnOrder);
    } catch (error) {
      console.error('Failed to save column order via API', error);
      // Implement rollback logic if needed
    }
  }, [dispatch, state.columnOrder]);

  const updateColumnColor = useCallback(async (columnId: string, color: string) => {
    dispatch({ type: 'UPDATE_COLUMN_COLOR', payload: { columnId, color } });
    try {
      await kanbanApi.saveColumnColor({ columnId, color });
    } catch (error) {
      console.error('Failed to save column color via API', error);
      // Implement rollback logic if needed
    }
  }, [dispatch]);

  const updateTask = useCallback((updatedTask: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { updatedTask } });
  }, [dispatch]);

  const deleteTask = useCallback((taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch({ type: 'DELETE_TASK', payload: { taskId } });
    }
  }, [dispatch]);

  return (
    <KanbanStateContext.Provider value={state}>
      <KanbanDispatchContext.Provider value={{ dispatch, moveTask, addTask, addColumn, updateColumnTitle, deleteColumn, moveColumn, updateColumnColor, updateTask, deleteTask }}>
        {children}
      </KanbanDispatchContext.Provider>
    </KanbanStateContext.Provider>
  );
};

export const useKanbanState = () => {
  const context = useContext(KanbanStateContext);
  if (context === undefined) {
    throw new Error('useKanbanState must be used within a KanbanProvider');
  }
  return context;
};

export const useKanbanDispatch = () => {
  const context = useContext(KanbanDispatchContext);
  if (context === undefined) {
    throw new Error('useKanbanDispatch must be used within a KanbanProvider');
  }
  return context;
}; 