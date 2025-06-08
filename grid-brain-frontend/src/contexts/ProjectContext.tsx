'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  selectProjectById: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  const loadProjects = async () => {
    if (!accessToken) {
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`);
      }

      const projectsData = await response.json();
      setProjects(projectsData);

      // If no current project is selected and we have projects, select the first one
      if (!currentProject && projectsData.length > 0) {
        setCurrentProject(projectsData[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }

      const newProject = await response.json();
      setProjects(prev => [newProject, ...prev]);
      
      // Automatically select the new project
      setCurrentProject(newProject);
      
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw err;
    }
  };

  const selectProjectById = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      // Store in localStorage for persistence
      localStorage.setItem('selectedProjectId', projectId);
    }
  };

  // Load projects when auth changes
  useEffect(() => {
    if (accessToken) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [accessToken]);

  // Load selected project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && projects.length > 0) {
      selectProjectById(savedProjectId);
    }
  }, [projects]);

  const value: ProjectContextType = {
    currentProject,
    projects,
    isLoading,
    error,
    setCurrentProject,
    loadProjects,
    createProject,
    selectProjectById,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}; 