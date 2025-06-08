'use client';

import React, { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Plus, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSelectorProps {
  className?: string;
  showCreateButton?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ 
  className,
  showCreateButton = true 
}) => {
  const { 
    currentProject, 
    projects, 
    isLoading, 
    selectProjectById, 
    createProject 
  } = useProject();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: ''
  });

  const handleCreateProject = async () => {
    if (!newProjectData.name.trim()) return;

    setIsCreating(true);
    try {
      await createProject({
        name: newProjectData.name.trim(),
        description: newProjectData.description.trim() || undefined,
      });
      
      setIsCreateDialogOpen(false);
      setNewProjectData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create project:', error);
      // You might want to show a toast notification here
    } finally {
      setIsCreating(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    selectProjectById(projectId);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading projects...</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center space-x-2", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="flex items-center space-x-2 min-w-[200px] justify-between bg-[#21262D] border border-[#30363D] text-gray-200 placeholder:text-gray-500 hover:bg-[#2c323a] hover:border-[#444c56]"
            >
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">
                  {currentProject?.name || 'Select Project'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-[300px] bg-[#21262D] border-[#30363D] text-gray-200" 
            align="start"
          >
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#30363D]" />
            
            {projects.length === 0 ? (
              <DropdownMenuItem disabled>
                No projects available
              </DropdownMenuItem>
            ) : (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={cn(
                    "flex flex-col items-start space-y-1 p-3 focus:bg-[#2c323a] focus:text-white",
                    currentProject?.id === project.id && "bg-blue-600/20"
                  )}
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {project.description}
                    </div>
                  )}
                </DropdownMenuItem>
              ))
            )}
            
            {showCreateButton && (
              <>
                <DropdownMenuSeparator className="bg-[#30363D]" />
                <DropdownMenuItem
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center space-x-2 focus:bg-[#2c323a] focus:text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Project</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#21262D] border-[#30363D] text-gray-200">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up a new project to organize your work and collaborate with your team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData(prev => ({ 
                  ...prev, 
                  name: e.target.value 
                }))}
                disabled={isCreating}
                className="bg-[#21262D] border-[#30363D] text-gray-200"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Briefly describe the project"
                value={newProjectData.description}
                onChange={(e) => setNewProjectData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                disabled={isCreating}
                rows={3}
                className="bg-[#21262D] border-[#30363D] text-gray-200"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
              className="bg-transparent border-[#30363D] hover:bg-[#2c323a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectData.name.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 