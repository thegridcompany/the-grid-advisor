'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { api } from '@/utils/api';

type Project = {
  id: string;
  name: string;
  description: string;
};

export default function ProjectsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspace?.id) return;
      try {
        setLoading(true);
        const response = await api.get('/projects');
        setProjects(response.data);
        setError(null);
      } catch {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [currentWorkspace?.id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {loading && <p>Loading projects...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-bold text-lg mb-2">{project.name}</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 