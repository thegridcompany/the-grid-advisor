'use client'

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useWorkspaceStore } from '@/store/workspaceStore';

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
};

export const InvitationManagement: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!currentWorkspace?.id) return;
      try {
        setLoading(true);
        const response = await api.get(`/workspaces/${currentWorkspace.id}/invitations`);
        setInvitations(response.data.invitations);
      } catch {
        setError('Failed to load invitations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvitations();
  }, [currentWorkspace?.id]);
  
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await api.put(`/invitations/${invitationId}/cancel`);
      setInvitations(invitations.map(invitation => 
        invitation.id === invitationId ? { ...invitation, status: 'cancelled' } : invitation
      ));
    } catch {
      setError('Failed to cancel invitation');
    }
  };
  
  const handleResendInvitation = async (invitationId: string) => {
    try {
      await api.post(`/invitations/${invitationId}/resend`);
      alert('Invitation resent successfully');
    } catch {
      setError('Failed to resend invitation');
    }
  };
  
  if (loading) {
    return <div>Loading invitations...</div>;
  }
  
  return (
    <div className="invitation-management">
      <h2>Invitation Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="invitations-table">
        <h3>Workspace Invitations ({invitations.length})</h3>
        
        {invitations.length === 0 ? (
          <p>No invitations found for this workspace.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires At</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>{invitation.email}</td>
                  <td>{invitation.role}</td>
                  <td>{invitation.status}</td>
                  <td>{new Date(invitation.expires_at).toLocaleString()}</td>
                  <td>{new Date(invitation.created_at).toLocaleString()}</td>
                  <td>
                    {invitation.status === 'pending' && (
                      <>
                        <button onClick={() => handleResendInvitation(invitation.id)}>
                          Resend
                        </button>
                        <button onClick={() => handleCancelInvitation(invitation.id)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}; 