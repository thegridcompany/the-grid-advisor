// Core domain types for Kanban functionality
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  assignee?: string;
  tags?: string[];
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
  limit?: number; // WIP limit
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: Column[];
  tasks: Task[];
}

// Component prop types
export interface KanbanBoardProps {
  // initialTasks?: Task[]; // To be removed
  // initialColumns?: Column[]; // To be removed
  // onTaskMove?: ( // To be removed
  //   taskId: string,
  //   fromColumn: string,
  //   toColumn: string,
  //   newIndex: number
  // ) => void;
  isLoading?: boolean; // This might come from context.isLoading later
  className?: string;
}

export interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  taskIds: string[];
  color?: string;
  limit?: number;
  className?: string;
  dragHandleListeners?: Record<string, unknown>;
  searchQuery?: string;
  focusedTaskId?: string | null;
}

export interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
  className?: string;
  onClick?: (task: Task) => void;
  searchQuery?: string;
  isFocused?: boolean;
}

// Drag and drop event types
export interface DragEvent {
  taskId: string;
  sourceColumnId: string;
  targetColumnId?: string;
  sourceIndex: number;
  targetIndex?: number;
}

// State management types
export interface KanbanState {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
  isLoading: boolean;
  error?: string;
}

export type KanbanAction =
  | {
      type: "MOVE_TASK";
      payload: {
        taskId: string;
        sourceColumnId: string;
        sourceIndex: number;
        targetColumnId: string;
        targetIndex: number | null;
      };
    }
  | { type: "SET_STATE_FROM_PERSISTENCE"; payload: KanbanState }
  | { type: "FETCH_BOARD_DATA_START" }
  | {
      type: "FETCH_BOARD_DATA_SUCCESS";
      payload: {
        tasks: Record<string, Task>;
        columns: Record<string, Column>;
        columnOrder: string[];
      };
    }
  | { type: "FETCH_BOARD_DATA_FAILURE"; payload: string }
  | { type: "SAVE_TASK_MOVE_START" }
  | {
      type: "SAVE_TASK_MOVE_SUCCESS";
      payload: {
        tasks: Record<string, Task>;
        columns: Record<string, Column>;
        columnOrder: string[];
      };
    }
  | { type: "SAVE_TASK_MOVE_FAILURE"; payload: { error: string } }
  | {
      type: "MOVE_TASK_ROLLBACK";
      payload: {
        columns: Record<string, Column>;
        columnOrder: string[];
        error: string;
      };
    }
  | {
      type: "ADD_COLUMN";
      payload: {
        newColumnId: string;
        title: string;
      };
    }
  | {
      type: "UPDATE_COLUMN_TITLE";
      payload: {
        columnId: string;
        newTitle: string;
      };
    }
  | {
      type: "DELETE_COLUMN";
      payload: {
        columnId: string;
      };
    }
  | {
      type: "MOVE_COLUMN";
      payload: {
        sourceIndex: number;
        targetIndex: number;
      };
    }
  | {
      type: "UPDATE_COLUMN_COLOR";
      payload: {
        columnId: string;
        color: string;
      };
    }
  | {
      type: "REALTIME_TASK_UPDATE";
      payload: {
        updatedTask: Task;
      };
    }
  | {
      type: "REALTIME_COLUMN_UPDATE";
      payload: {
        updatedColumn: Partial<Column> & { id: string };
      };
    }
  | {
      type: "REALTIME_TASK_MOVE";
      payload: {
        taskId: string;
        sourceColumnId: string;
        targetColumnId: string;
        newSourceTaskIds: string[];
        newTargetTaskIds: string[];
      };
    }
  | {
      type: "REALTIME_COLUMN_ADDED";
      payload: {
        newColumn: Column;
      };
    }
  | {
      type: "REALTIME_COLUMN_TITLE_UPDATED";
      payload: {
        columnId: string;
        newTitle: string;
      };
    }
  | {
      type: "REALTIME_COLUMN_DELETED";
      payload: {
        columnId: string;
      };
    }
  | {
      type: "REALTIME_COLUMN_MOVED";
      payload: {
        newColumnOrder: string[];
      };
    };
