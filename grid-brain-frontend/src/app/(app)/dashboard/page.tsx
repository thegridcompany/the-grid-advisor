'use client';

import { Dashboard } from '@/features/dashboard/components/Dashboard';

export default function DashboardPage() {
  return (
    <main className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="container mx-auto">
        <Dashboard />
      </div>
    </main>
  );
} 