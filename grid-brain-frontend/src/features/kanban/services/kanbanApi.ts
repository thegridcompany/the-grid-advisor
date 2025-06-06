import { KanbanState, Task, Column } from "../types";

const API_LATENCY = 500; // ms
const LOCAL_STORAGE_KEY = "kanbanState_api_mock"; // Usiamo una chiave diversa per non sovrascrivere quella attuale

// Struttura dati per il nostro "database" in localStorage
interface MockKanbanDB {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

// Default tasks and columns, copied from KanbanBoard.tsx for the mock API's internal initialization
const apiDefaultTasks: Task[] = [
  {
    id: "task-1",
    title: "Design login page mockups",
    description:
      "Create wireframes and high-fidelity mockups for the authentication flow",
    priority: "high",
    assignee: "Designer",
  },
  {
    id: "task-2",
    title: "Set up authentication API",
    description: "Implement JWT-based authentication with FastAPI",
    priority: "high",
    assignee: "Backend Dev",
  },
  {
    id: "task-3",
    title: "Write unit tests for user service",
    description:
      "Add comprehensive test coverage for user-related functionality",
    priority: "medium",
    assignee: "QA Engineer",
  },
  {
    id: "task-4",
    title: "Research drag and drop libraries",
    description:
      "Evaluate @dnd-kit vs react-beautiful-dnd for Kanban implementation",
    priority: "low",
    assignee: "Frontend Dev",
  },
  {
    id: "task-5",
    title: "Database schema design",
    description: "Design PostgreSQL schema for board and task management",
    priority: "high",
    assignee: "Backend Dev",
  },
];

const apiDefaultColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    taskIds: ["task-1", "task-2", "task-4"],
  },
  {
    id: "sprint",
    title: "Sprint",
    taskIds: ["task-3"],
  },
  {
    id: "done",
    title: "Done",
    taskIds: ["task-5"],
  },
];

const defaultDBState: MockKanbanDB = {
  tasks: {},
  columns: {},
  columnOrder: [],
};

// Helper per leggere dal "database" mock
const readDB = (): MockKanbanDB => {
  try {
    const persistedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (persistedState) {
      return JSON.parse(persistedState) as MockKanbanDB;
    } else {
      // LOCAL STORAGE IS EMPTY for kanbanState_api_mock
      console.log(
        "[MockAPI readDB] kanbanState_api_mock is empty. Initializing with default data."
      );

      const tasksById: Record<string, Task> = apiDefaultTasks.reduce(
        (acc, task) => {
          acc[task.id] = task;
          return acc;
        },
        {} as Record<string, Task>
      );

      const columnsById: Record<string, Column> = apiDefaultColumns.reduce(
        (acc, column) => {
          acc[column.id] = { ...column }; // taskIds are already just strings
          return acc;
        },
        {} as Record<string, Column>
      );

      const columnOrder: string[] = apiDefaultColumns.map((col) => col.id);

      const initialDb: MockKanbanDB = {
        tasks: tasksById,
        columns: columnsById,
        columnOrder,
      };
      writeDB(initialDb);
      return initialDb;
    }
  } catch (error) {
    console.error("Error reading from mock DB (or initializing):", error);
  }
  return JSON.parse(JSON.stringify(defaultDBState)); // Restituisce una copia deep per evitare mutazioni accidentali
};

// Helper per scrivere nel "database" mock
const writeDB = (data: MockKanbanDB): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing to mock DB:", error);
  }
};

// --- Funzioni API Mock ---

export const fetchBoardData = async (): Promise<KanbanState> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[MockAPI] fetchBoardData called");
      const db = readDB();

      // No need to explicitly check for empty and initialize here anymore,
      // readDB handles it.

      resolve({
        tasks: db.tasks,
        columns: db.columns,
        columnOrder: db.columnOrder,
        isLoading: false,
        error: undefined,
      });
    }, API_LATENCY);
  });
};

interface MoveTaskPayload {
  taskId: string;
  sourceColumnId: string;
  sourceIndex: number;
  targetColumnId: string;
  targetIndex: number | null; // null se spostato alla fine
}

export const saveTaskMove = async (
  payload: MoveTaskPayload
): Promise<KanbanState> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("[MockAPI] saveTaskMove called with:", payload);
      const db = readDB();
      const {
        taskId,
        sourceColumnId,
        sourceIndex,
        targetColumnId,
        targetIndex,
      } = payload;

      const sourceCol = db.columns[sourceColumnId];
      const targetCol = db.columns[targetColumnId];

      if (!sourceCol || !targetCol) {
        console.error(
          "[MockAPI] Source or target column not found in DB after readDB. IDs:",
          { sourceColumnId, targetColumnId },
          "DB Columns:",
          db.columns
        );
        return reject(
          new Error("Source or target column not found in mock DB")
        );
      }

      const newSourceTaskIds = Array.from(sourceCol.taskIds);
      // DEBUG LOGGING START
      console.log("[MockAPI saveTaskMove] Before splice from source:", {
        sourceColumnId: sourceCol.id,
        taskIds: [...sourceCol.taskIds],
        sourceIndex,
        taskIdToRemove: taskId,
      });
      newSourceTaskIds.splice(sourceIndex, 1);
      console.log("[MockAPI saveTaskMove] After splice from source:", {
        sourceColumnId: sourceCol.id,
        newSourceTaskIds: [...newSourceTaskIds],
      });
      // DEBUG LOGGING END

      let newTargetTaskIds: string[];
      const finalTargetIndex =
        targetIndex === null || targetIndex < 0
          ? sourceColumnId === targetColumnId
            ? newSourceTaskIds.length
            : targetCol.taskIds.length
          : targetIndex;

      if (sourceColumnId === targetColumnId) {
        // Spostamento all'interno della stessa colonna
        newTargetTaskIds = newSourceTaskIds; // newSourceTaskIds è già quella corretta senza il task spostato
        // DEBUG LOGGING START
        console.log(
          "[MockAPI saveTaskMove] Same column - Before splice into target:",
          {
            targetColumnId: targetCol.id,
            currentTargetTaskIds: [...newTargetTaskIds],
            finalTargetIndex,
            taskIdToInsert: taskId,
          }
        );
        newTargetTaskIds.splice(finalTargetIndex, 0, taskId);
        console.log(
          "[MockAPI saveTaskMove] Same column - After splice into target:",
          {
            targetColumnId: targetCol.id,
            newTargetTaskIds: [...newTargetTaskIds],
          }
        );
        // DEBUG LOGGING END
      } else {
        // Spostamento tra colonne diverse
        newTargetTaskIds = Array.from(targetCol.taskIds);
        // DEBUG LOGGING START
        console.log(
          "[MockAPI saveTaskMove] Different column - Before splice into target:",
          {
            targetColumnId: targetCol.id,
            currentTargetTaskIds: [...newTargetTaskIds],
            finalTargetIndex,
            taskIdToInsert: taskId,
          }
        );
        newTargetTaskIds.splice(finalTargetIndex, 0, taskId);
        console.log(
          "[MockAPI saveTaskMove] Different column - After splice into target:",
          {
            targetColumnId: targetCol.id,
            newTargetTaskIds: [...newTargetTaskIds],
          }
        );
        // DEBUG LOGGING END
      }

      // Update columns based on move type
      if (sourceColumnId === targetColumnId) {
        // Same column move - only update one column
        db.columns[sourceColumnId] = {
          ...sourceCol,
          taskIds: newTargetTaskIds,
        };
      } else {
        // Different column move - update both columns
        db.columns[sourceColumnId] = {
          ...sourceCol,
          taskIds: newSourceTaskIds,
        };
        db.columns[targetColumnId] = {
          ...targetCol,
          taskIds: newTargetTaskIds,
        };
      }

      // DEBUG LOGGING START
      console.log(
        "[MockAPI saveTaskMove] Final DB state before write:",
        JSON.parse(JSON.stringify(db))
      );
      // DEBUG LOGGING END
      writeDB(db);

      // Restituisce il nuovo stato completo della board
      // Idealmente, l'API potrebbe restituire solo le parti modificate o un successo/fallimento,
      // ma per il mock è più semplice restituire tutto lo stato aggiornato.
      resolve({
        tasks: db.tasks,
        columns: db.columns,
        columnOrder: db.columnOrder,
        isLoading: false,
        error: undefined,
      });
    }, API_LATENCY);
  });
};

interface NewColumnPayload {
  id: string;
  title: string;
}

export const saveNewColumn = async (
  payload: NewColumnPayload
): Promise<KanbanState> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[MockAPI] saveNewColumn called with:", payload);
      const db = readDB();
      const { id, title } = payload;

      const newColumn: Column = {
        id,
        title,
        taskIds: [],
      };

      db.columns[id] = newColumn;
      db.columnOrder.push(id);

      writeDB(db);

      resolve({
        tasks: db.tasks,
        columns: db.columns,
        columnOrder: db.columnOrder,
        isLoading: false,
        error: undefined,
      });
    }, API_LATENCY);
  });
};

// TODO: Implementare mock per altre operazioni CRUD (addTask, updateTask, addColumn, etc.)
// in base alle necessità future e ai sottotask successivi.

export const saveColumnTitle = async (payload: {
  columnId: string;
  newTitle: string;
}): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = readDB();
      if (db.columns[payload.columnId]) {
        db.columns[payload.columnId].title = payload.newTitle;
        writeDB(db);
      }
      resolve();
    }, API_LATENCY);
  });
};

export const deleteColumn = async (columnId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = readDB();
      delete db.columns[columnId];
      db.columnOrder = db.columnOrder.filter((id) => id !== columnId);
      writeDB(db);
      resolve();
    }, API_LATENCY);
  });
};

export const saveColumnOrder = async (
  newColumnOrder: string[]
): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = readDB();
      db.columnOrder = newColumnOrder;
      writeDB(db);
      resolve();
    }, API_LATENCY);
  });
};

export const saveColumnColor = async (payload: {
  columnId: string;
  color: string;
}): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = readDB();
      if (db.columns[payload.columnId]) {
        db.columns[payload.columnId].color = payload.color;
        writeDB(db);
      }
      resolve();
    }, API_LATENCY);
  });
};
