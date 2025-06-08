'use client';

import React, { useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
// Assuming an auth store exists and provides authentication status
// import { useAuthStore } from '../../store/authStore';

// Placeholder for auth store
const useAuthStore = () => ({
  isAuthenticated: true, // Assume user is authenticated for now
});

type WorkspaceProviderProps = {
  children: React.ReactNode;
};

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const workspaces = useWorkspaceStore((state) => state.workspaces);

  useEffect(() => {
    if (isAuthenticated && workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchWorkspaces, workspaces.length]);

  return <>{children}</>;
}; 