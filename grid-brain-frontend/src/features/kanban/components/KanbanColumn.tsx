'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanColumnProps } from '../types';
import { TaskCounter } from './atoms/TaskCounter';
import { useKanbanDispatch } from '../state/kanbanContext';
import { DragHandle } from './atoms/DragHandle';
import { VirtualizedTaskList } from './VirtualizedTaskList';

// Simple trash icon component
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  taskIds,
  limit,
  className,
  dragHandleListeners,
  color,
  searchQuery,
  focusedTaskId,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const { updateColumnTitle, deleteColumn, updateColumnColor } = useKanbanDispatch();

  const handleTitleBlur = () => {
    if (editedTitle.trim() && editedTitle !== title) {
      updateColumnTitle(id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
    if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the column "${title}"? This action cannot be undone.`)) {
      deleteColumn(id);
    }
  };

  const handleColorChange = (newColor: string) => {
    updateColumnColor(id, newColor);
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[400px] w-80',
        'border-t-4',
        isOver ? 'border-blue-500' : 'border-transparent',
        className
      )}
      style={{ borderTopColor: isOver ? undefined : color }}
    >
      {/* Column Header */}
      <div className="mb-4 group">
        <div className="flex justify-between items-center gap-2">
          {dragHandleListeners && (
            <DragHandle listeners={dragHandleListeners} />
          )}
          {isEditing ? (
            <textarea
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="font-semibold text-lg bg-transparent border border-blue-500 rounded-md p-1 w-full resize-none"
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className="font-semibold text-lg text-gray-900 dark:text-gray-100 cursor-pointer flex-grow"
            >
              {title}
            </h3>
          )}
          <div className="flex items-center gap-1">
            <ColorPicker onChange={handleColorChange} />
            <button 
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label="Delete column"
            >
              <TrashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <TaskCounter 
          count={taskIds.length} 
          limit={limit}
        />
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 min-h-[200px] transition-colors duration-200 overflow-hidden',
          isOver && 'bg-blue-50 dark:bg-blue-900/20 rounded-md'
        )}
      >
        <VirtualizedTaskList 
          tasks={tasks}
          taskIds={taskIds}
          searchQuery={searchQuery}
          focusedTaskId={focusedTaskId}
        />
      </div>
    </div>
  );
};

export const KanbanColumn = React.memo(KanbanColumnComponent);

const ColorPicker = ({ onChange }: { onChange: (color: string) => void }) => {
  const colors = ['#845EC2', '#D65DB1', '#FF6F91', '#FF9671', '#FFC75F', '#F9F871'];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
        <PaletteIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-10 top-full right-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 w-24">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: color }}
                aria-label={`Set color to ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PaletteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.667 0-.422-.182-.835-.476-1.14.288-.346.476-.793.476-1.286 0-.925-.752-1.67-1.669-1.67-.91 0-1.637.737-1.637 1.66S10.17 18 11.08 18c.91 0 1.66-.74 1.66-1.66 0-.91-.74-1.66-1.66-1.66H10c-.92 0-1.67-.75-1.67-1.67S9.08 11.34 10 11.34h1.08c.92 0 1.67-.75 1.67-1.67s-.75-1.67-1.67-1.67H9.5c-.925 0-1.67-.75-1.67-1.67S8.575 4.67 9.5 4.67h1.08c.925 0 1.67-.75 1.67-1.67S11.5 2 12 2Z" />
  </svg>
); 