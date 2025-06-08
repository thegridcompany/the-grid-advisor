import React from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const WorkspaceSelector: React.FC = () => {
  const { workspaces, currentWorkspace, switchWorkspace, isLoading } = useWorkspaceStore();

  if (workspaces.length <= 1) {
    return null; // Don't show selector if only one or zero workspaces
  }

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newWorkspaceId = event.target.value;
    if (newWorkspaceId && newWorkspaceId !== currentWorkspace?.id) {
      switchWorkspace(newWorkspaceId);
    }
  };

  return (
    <div className="workspace-selector">
      <select
        value={currentWorkspace?.id || ''}
        onChange={handleSelectChange}
        disabled={isLoading}
        aria-label="Workspace Selector"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      {isLoading && <span className="loading-indicator">Switching...</span>}
    </div>
  );
}; 