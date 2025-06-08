'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Sidebar } from './Sidebar';
import { ClientNavigation } from './ClientNavigation';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspaceStore();
  const isClient = currentWorkspace?.role === 'CLIENT' || currentWorkspace?.role === 'client';

  return (
    <>
      <header style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Grid Brain</h1>
        <WorkspaceSelector />
      </header>
      <div style={{ display: 'flex' }}>
        {isClient ? <ClientNavigation /> : <Sidebar />}
        <main style={{ flexGrow: 1, padding: '1rem' }}>
          {children}
        </main>
      </div>
    </>
  );
} 