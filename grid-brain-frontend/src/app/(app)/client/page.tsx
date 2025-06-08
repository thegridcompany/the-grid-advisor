'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/utils/api';

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
};

export default function ClientDashboardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspace?.id) return;
      try {
        setLoading(true);
        const response = await api.get('/projects');
        setProjects(response.data.projects);
        setError(null);
      } catch {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [currentWorkspace?.id]);
  
  if (loading) {
    return <div>Loading projects...</div>;
  }
  
  return (
    <div className="client-dashboard p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.username || user?.email}</h1>
      
      <div className="workspace-info bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold">{currentWorkspace?.name}</h2>
        <p>You have access to {projects.length} project(s)</p>
      </div>
      
      {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}
      
      <div className="projects-list">
        <h3 className="text-lg font-semibold mb-4">Your Projects</h3>
        
        {projects.length === 0 ? (
          <p>You don&apos;t have access to any projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="project-card border p-4 rounded-lg shadow-sm">
                <h4 className="font-bold text-md mb-2">{project.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                <div className="project-status text-xs mb-3">
                  Status: <span className={`status-${project.status.toLowerCase()} font-semibold`}>{project.status}</span>
                </div>
                <button 
                  onClick={() => window.location.href = `/projects/${project.id}`}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="client-actions mt-8">
        <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-gray-700 mb-3">You can create a new support ticket or request by clicking the button below.</p>
        <button 
          onClick={() => window.location.href = '/tickets/new'}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Create Support Request
        </button>
      </div>
    </div>
  );
}; 