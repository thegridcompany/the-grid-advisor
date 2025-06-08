'use client'

import { BlueprintEditor } from '@/features/blueprint/components';
import { KanbanProvider } from '@/features/kanban/state/kanbanContext';
import { useProject } from '@/contexts/ProjectContext';
import { ProjectSelector } from '@/components/ProjectSelector';
import React from 'react';

const BlueprintEditorPage = () => {
  const { currentProject } = useProject();

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            No Project Selected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a project to continue working on your blueprint.
          </p>
          <ProjectSelector />
        </div>
      </div>
    );
  }

  return (
    <KanbanProvider projectId={currentProject.id}>
      <div className="h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <div className="p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Blueprint Editor</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{currentProject.name}</p>
            </div>
            <ProjectSelector />
          </div>
        </div>
        <BlueprintEditor />
      </div>
    </KanbanProvider>
  );
};

export default BlueprintEditorPage; 