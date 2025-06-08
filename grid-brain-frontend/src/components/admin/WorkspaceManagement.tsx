'use client'

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

type Workspace = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  is_active: boolean;
  memberCount?: number;
};

export const WorkspaceManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    slug: '',
    description: '',
    domain: ''
  });
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/workspaces');
        setWorkspaces(response.data.workspaces);
      } catch {
        setError('Failed to load workspaces');
      } finally {
        setLoading(false);
      }
    };
    
    if (isSuperAdmin) {
      fetchWorkspaces();
    }
  }, [isSuperAdmin]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name' && !newWorkspace.slug) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setNewWorkspace(prev => ({ ...prev, name: value, slug }));
    } else {
      setNewWorkspace(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/admin/workspaces', newWorkspace);
      setWorkspaces([...workspaces, response.data]);
      setNewWorkspace({ name: '', slug: '', description: '', domain: '' });
      setShowForm(false);
    } catch (err: unknown) {
      let message = 'Failed to create workspace';
       if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'detail' in err.response.data) {
        message = (err.response.data as { detail: string }).detail;
      }
      setError(message);
    }
  };
  
  const handleToggleActive = async (workspaceId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/workspaces/${workspaceId}`, {
        is_active: !currentStatus
      });
      setWorkspaces(workspaces.map(workspace => 
        workspace.id === workspaceId ? { ...workspace, is_active: !currentStatus } : workspace
      ));
    } catch {
      setError('Failed to update workspace status');
    }
  };
  
  if (!isSuperAdmin) {
    return <div>Only super admins can manage workspaces.</div>;
  }
  
  if (loading) {
    return <div>Loading workspaces...</div>;
  }
  
  return (
    <div className="workspace-management">
      <h2>Workspace Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="workspace-actions">
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create New Workspace'}
        </button>
      </div>
      
      {showForm && (
        <div className="workspace-form">
          <h3>Create New Workspace</h3>
          <form onSubmit={handleCreateWorkspace}>
            <div>
              <label htmlFor="name">Workspace Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={newWorkspace.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="slug">Slug (URL-friendly)</label>
              <input 
                type="text" 
                id="slug" 
                name="slug" 
                value={newWorkspace.slug} 
                onChange={handleInputChange} 
                required 
                pattern="[a-z0-9-]+"
              />
              <small>Only lowercase letters, numbers, and hyphens</small>
            </div>
            
            <div>
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                name="description" 
                value={newWorkspace.description || ""} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div>
              <label htmlFor="domain">Email Domain (optional)</label>
              <input 
                type="text" 
                id="domain" 
                name="domain" 
                value={newWorkspace.domain} 
                onChange={handleInputChange} 
                placeholder="example.com"
              />
              <small>For auto-assignment of users with this email domain</small>
            </div>
            
            <button type="submit">Create Workspace</button>
          </form>
        </div>
      )}
      
      <div className="workspaces-table">
        <h3>All Workspaces ({workspaces.length})</h3>
        
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Domain</th>
              <th>Members</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((workspace) => (
              <tr key={workspace.id}>
                <td>{workspace.name}</td>
                <td>{workspace.slug}</td>
                <td>{workspace.description || '-'}</td>
                <td>{workspace.domain || '-'}</td>
                <td>{workspace.memberCount || 0}</td>
                <td>{workspace.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button onClick={() => handleToggleActive(workspace.id, workspace.is_active)}>
                    {workspace.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 