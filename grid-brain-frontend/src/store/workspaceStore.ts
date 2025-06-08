import { create } from "zustand";
import { persist } from "zustand/middleware";
// This will be created later, assuming it provides a configured axios instance
// import { api } from '../utils/api';
import axios from "axios"; // Using axios directly for now

// Placeholder for the real API utility
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
});

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role?: string;
};

type WorkspaceState = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      isLoading: false,
      error: null,

      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get("/v1/workspaces"); // Assuming v1 prefix
          const workspaces = response.data.workspaces;
          set({ workspaces, isLoading: false });

          const { currentWorkspace } = get();
          if (!currentWorkspace && workspaces.length > 0) {
            set({ currentWorkspace: workspaces[0] });
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to fetch workspaces";
          const apiError = error as ApiError;
          if (apiError.response?.data?.detail) {
            errorMessage = apiError.response.data.detail;
          }
          set({ isLoading: false, error: errorMessage });
        }
      },

      switchWorkspace: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post(
            `/v1/auth/switch-workspace/${workspaceId}`
          );
          const { access_token, workspace } = response.data;

          // Assuming a separate auth store handles the token
          localStorage.setItem("token", access_token);

          set({ currentWorkspace: workspace, isLoading: false });

          // Reloading the page to ensure all components get the new context
          window.location.reload();
        } catch (error: unknown) {
          let errorMessage = "Failed to switch workspace";
          const apiError = error as ApiError;
          if (apiError.response?.data?.detail) {
            errorMessage = apiError.response.data.detail;
          }
          set({ isLoading: false, error: errorMessage });
        }
      },

      setCurrentWorkspace: (workspace: Workspace) => {
        set({ currentWorkspace: workspace });
      },
    }),
    {
      name: "workspace-storage", // unique name for localStorage persistence
    }
  )
);
