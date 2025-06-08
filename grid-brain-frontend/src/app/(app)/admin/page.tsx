'use client'

import React, { useState } from 'react';
import { UserManagement } from '../../components/admin/UserManagement';
import { WorkspaceManagement } from '../../components/admin/WorkspaceManagement';
import { InvitationManagement } from '../../components/admin/InvitationManagement';
import { ClientManagement } from '../../components/admin/ClientManagement';

const TABS = [
  { value: 'users' as const, label: 'User Management', component: UserManagement },
  { value: 'workspaces' as const, label: 'Workspace Management', component: WorkspaceManagement },
  { value: 'invitations' as const, label: 'Invitation Management', component: InvitationManagement },
  { value: 'clients' as const, label: 'Client Management', component: ClientManagement },
];

type AdminTab = typeof TABS[number]['value'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const ActiveComponent = TABS.find(tab => tab.value === activeTab)?.component;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="flex border-b">
        {TABS.map(tab => (
          <button
            key={tab.value}
            className={`px-4 py-2 -mb-px text-sm font-medium text-center border-b-2
              ${activeTab === tab.value
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
} 