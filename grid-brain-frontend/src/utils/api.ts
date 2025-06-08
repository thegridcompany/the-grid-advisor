import axios from "axios";
import { useWorkspaceStore } from "../store/workspaceStore";
// Assuming an auth store exists to get the token
// import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
});

// Request interceptor to add auth token and workspace ID to headers
api.interceptors.request.use(
  (config) => {
    // In a real app, you might get the token from an auth store
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Add workspace header from the Zustand store
    const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
    if (currentWorkspace?.id) {
      config.headers["X-Workspace-ID"] = currentWorkspace.id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };
