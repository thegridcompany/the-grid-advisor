'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useWorkspaceStore } from '@/store/workspaceStore';

type Project = {
  id: string;
  name: string;
};

export function ClientManagement() {
  const { currentWorkspace } = useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspace?.id) return;
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch {
        setError('Failed to load projects.');
      }
    };
    fetchProjects();
  }, [currentWorkspace?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/invitations/client', {
        email,
        project_ids: selectedProjects,
      });
      setSuccess(`Invitation sent to ${email}.`);
      setEmail('');
      setSelectedProjects([]);
    } catch {
      setError('Failed to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Client Management</h2>
      <p className="mb-6">Invite clients and grant them access to specific projects.</p>

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">Client Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Assign to Projects</label>
          <div className="border rounded-md p-2 h-48 overflow-y-auto">
            {projects.map(project => (
              <div key={project.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`project-${project.id}`}
                  value={project.id}
                  checked={selectedProjects.includes(project.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProjects([...selectedProjects, project.id]);
                    } else {
                      setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor={`project-${project.id}`}>{project.name}</label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email || selectedProjects.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          {isSubmitting ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  );
} 