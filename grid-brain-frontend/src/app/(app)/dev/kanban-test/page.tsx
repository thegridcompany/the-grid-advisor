'use client';

import { Profiler, ProfilerOnRenderCallback } from 'react';
import { KanbanBoard } from '@/features/kanban/components';

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

  return (
    <main className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="container mx-auto">
        <Profiler id="KanbanBoard" onRender={handleRender}>
          <KanbanBoard className="flex-grow"/>
        </Profiler>
      </div>
    </main>
  );
} 