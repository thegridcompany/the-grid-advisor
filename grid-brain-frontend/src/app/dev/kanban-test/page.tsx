'use client';

import { Profiler, ProfilerOnRenderCallback } from 'react';
import { KanbanBoard } from '@/features/kanban/components';
import { KanbanProvider } from '@/features/kanban/state/kanbanContext';

export default function KanbanTestPage() {
  // const handleTaskMove = (taskId: string, fromColumn: string, toColumn: string, newIndex: number) => {
  //   console.log('Task moved:', {
  //     taskId,
  //     fromColumn,
  //     toColumn,
  //     newIndex
  //   });
  //   // This logic will move to the reducer or a side-effect handler for the context
  // };

  const handleRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    console.log({ id, phase, actualDuration, baseDuration, startTime, commitTime });
  };

  const MOCK_PROJECT_ID = 'e8a7e5a9-aa5e-4475-b9e0-5259e82cda19';

  return (
    <KanbanProvider projectId={MOCK_PROJECT_ID}>
      <main className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="container mx-auto">
          <Profiler id="KanbanBoard" onRender={handleRender}>
            <KanbanBoard className="flex-grow"/>
          </Profiler>
        </div>
      </main>
    </KanbanProvider>
  );
} 