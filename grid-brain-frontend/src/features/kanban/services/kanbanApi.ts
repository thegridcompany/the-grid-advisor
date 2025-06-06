import { Task, Column } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "An unknown error occurred." }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Fetches all columns and their tasks for a given project
export const fetchBoardData = async (
  projectId: string,
  token: string
): Promise<{ columns: Column[]; tasks: Task[] }> => {
  const columns = await handleResponse(
    await fetch(`${API_BASE_URL}/kanban/columns?project_id=${projectId}`, {
      headers: getAuthHeader(token),
    })
  );
  const tasks = await handleResponse(
    await fetch(`${API_BASE_URL}/kanban/tasks/project/${projectId}`, {
      headers: getAuthHeader(token),
    })
  );
  return { columns, tasks };
};

// Column API functions
export const createColumn = async (
  columnData: {
    name: string;
    project_id: string;
    position: number;
    color?: string;
  },
  token: string
): Promise<Column> => {
  return handleResponse(
    await fetch(`${API_BASE_URL}/kanban/columns`, {
      method: "POST",
      headers: getAuthHeader(token),
      body: JSON.stringify(columnData),
    })
  );
};

export const updateColumn = async (
  columnId: string,
  columnData: Partial<Omit<Column, "id">>,
  token: string
): Promise<Column> => {
  return handleResponse(
    await fetch(`${API_BASE_URL}/kanban/columns/${columnId}`, {
      method: "PUT",
      headers: getAuthHeader(token),
      body: JSON.stringify(columnData),
    })
  );
};

export const deleteColumn = async (
  columnId: string,
  token: string
): Promise<void> => {
  await handleResponse(
    await fetch(`${API_BASE_URL}/kanban/columns/${columnId}`, {
      method: "DELETE",
      headers: getAuthHeader(token),
    })
  );
};

// Task API functions
export const createTask = async (
  taskData: Omit<Task, "id" | "created_at" | "updated_at">,
  token: string
): Promise<Task> => {
  return handleResponse(
    await fetch(`${API_BASE_URL}/kanban/tasks`, {
      method: "POST",
      headers: getAuthHeader(token),
      body: JSON.stringify(taskData),
    })
  );
};

export const updateTask = async (
  taskId: string,
  taskData: Partial<Omit<Task, "id">>,
  token: string
): Promise<Task> => {
  return handleResponse(
    await fetch(`${API_BASE_URL}/kanban/tasks/${taskId}`, {
      method: "PUT",
      headers: getAuthHeader(token),
      body: JSON.stringify(taskData),
    })
  );
};

export const deleteTask = async (
  taskId: string,
  token: string
): Promise<void> => {
  await handleResponse(
    await fetch(`${API_BASE_URL}/kanban/tasks/${taskId}`, {
      method: "DELETE",
      headers: getAuthHeader(token),
    })
  );
};

export const moveTask = async (
  taskId: string,
  newColumnId: string,
  newPosition: number,
  token: string
): Promise<Task> => {
  return handleResponse(
    await fetch(`${API_BASE_URL}/kanban/tasks/${taskId}/move`, {
      method: "PUT",
      headers: getAuthHeader(token),
      body: JSON.stringify({
        new_column_id: newColumnId,
        new_position: newPosition,
      }),
    })
  );
};
