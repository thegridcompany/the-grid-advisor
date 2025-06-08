'use client'

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  
  const isWorkspaceAdmin = currentWorkspace?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  return (
    <aside className="sidebar" style={{ padding: '1rem', borderRight: '1px solid #333' }}>
      <nav>
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/projects">Projects</Link>
          </li>
          
          {(isWorkspaceAdmin || isSuperAdmin) && (
            <li style={{ marginTop: '1rem' }}>
              <h3>Admin</h3>
              <ul>
                <li>
                  <Link href="/admin">Admin Dashboard</Link>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}; 