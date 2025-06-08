'use client'

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useWorkspaceStore } from '@/store/workspaceStore';

type User = {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  type: 'user' | 'team_member';
};

export const UserManagement: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentWorkspace?.id) return;
      try {
        setLoading(true);
        const response = await api.get(`/workspaces/${currentWorkspace.id}/members`);
        setUsers(response.data.members);
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentWorkspace?.id]);
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) {
      setError('Email is required');
      return;
    }
    
    try {
      setInviting(true);
      await api.post('/invitations', {
        email: newUserEmail,
        role: newUserRole
      });
      setNewUserEmail('');
      setNewUserRole('MEMBER');
      alert(`Invitation sent to ${newUserEmail}`);
    } catch (err: unknown) {
      let message = 'Failed to send invitation';
      if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'detail' in err.response.data) {
        message = (err.response.data as { detail: string }).detail;
      }
      setError(message);
    } finally {
      setInviting(false);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/workspaces/${currentWorkspace?.id}/members/${userId}/role`, {
        role: newRole
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch {
      setError('Failed to update user role');
    }
  };
  
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/workspaces/${currentWorkspace?.id}/members/${userId}/status`, {
        is_active: !currentStatus
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch {
      setError('Failed to update user status');
    }
  };
  
  if (loading) return <div>Loading users...</div>;
  
  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="invite-user-form">
        <h3>Invite New User</h3>
        <form onSubmit={handleInviteUser}>
          <div>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={newUserEmail} 
              onChange={(e) => setNewUserEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <label htmlFor="role">Role</label>
            <select 
              id="role" 
              value={newUserRole} 
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="CLIENT">Client</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          
          <button type="submit" disabled={inviting}>
            {inviting ? 'Sending Invitation...' : 'Send Invitation'}
          </button>
        </form>
      </div>
      
      <div className="users-table">
        <h3>Workspace Members ({users.length})</h3>
        
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name || '-'}</td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                    <option value="CLIENT">Client</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </td>
                <td>{user.type === 'team_member' ? 'Team Member' : 'User'}</td>
                <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button onClick={() => handleToggleActive(user.id, user.is_active)}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
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