'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../utils/api';
import { useAuthStore } from '../../../store/authStore';
import { useWorkspaceStore, Workspace } from '../../../store/workspaceStore';

interface InvitationDetails {
  valid: boolean;
  email: string;
  workspace_name: string;
  role: string;
  expires_at: string;
  error?: string;
}

const InvitationPage: React.FC = () => {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { setCurrentWorkspace, fetchWorkspaces } = useWorkspaceStore();
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<InvitationDetails>(`/invitations/verify/${token}`);
        if (response.data.valid) {
          setInvitation(response.data);
        } else {
          setError(response.data.error || 'Invalid invitation.');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Invalid or expired invitation.');
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };
    verifyInvitation();
  }, [token]);
  
  const handleAcceptInvitation = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await api.post<{ access_token: string; workspace: Workspace }>(`/invitations/accept/${token}`);
      
      localStorage.setItem('token', response.data.access_token);
      
      await fetchWorkspaces();
      setCurrentWorkspace(response.data.workspace);
      
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to accept invitation.');
      } else {
        setError('An unknown error occurred.');
      }
      setLoading(false);
    }
  };
  
  const handleLoginFirst = () => {
    sessionStorage.setItem('pendingInvitationToken', token || '');
    router.push('/auth/login');
  };
  
  if (loading) return <div>Loading invitation...</div>;
  
  if (error || !invitation) {
    return (
      <div>
        <h2>Invitation Error</h2>
        <p>{error || 'This invitation is invalid or has expired.'}</p>
        <button onClick={() => router.push('/')}>Go to Homepage</button>
      </div>
    );
  }
  
  return (
    <div>
      <h2>You&apos;re Invited!</h2>
      <p>You&apos;ve been invited to join <strong>{invitation.workspace_name}</strong> as a <strong>{invitation.role}</strong>.</p>
      <p>This invitation was sent to: <strong>{invitation.email}</strong></p>
      
      {isAuthenticated() ? (
        <div>
          {user?.email.toLowerCase() === invitation.email.toLowerCase() ? (
            <button onClick={handleAcceptInvitation} disabled={loading}>
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </button>
          ) : (
            <div>
              <p>This invitation is for {invitation.email}, but you&apos;re logged in as {user?.email}.</p>
              <button onClick={() => logout()}>Logout and Switch Account</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>Please log in or sign up to accept this invitation.</p>
          <button onClick={handleLoginFirst}>Login or Register</button>
        </div>
      )}
    </div>
  );
};

export default InvitationPage; 