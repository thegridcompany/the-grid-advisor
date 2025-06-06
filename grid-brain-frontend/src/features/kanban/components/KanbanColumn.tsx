'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanColumnProps } from '../types';
import { TaskCounter } from './atoms/TaskCounter';
import { useKanbanDispatch } from '../state/kanbanContext';
import { DragHandle } from './atoms/DragHandle';
import { VirtualizedTaskList } from './VirtualizedTaskList';
import { XIcon, PlusIcon } from './atoms/Icons';

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
  onEditTask,
  onDeleteTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const { updateColumnTitle, deleteColumn, updateColumnColor, addTask } = useKanbanDispatch();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

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

  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      await addTask({ columnId: id, title: newCardTitle.trim() });
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleAddCardKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCard();
    }
    if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
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
        'flex flex-col rounded-lg bg-[#161B22] w-[320px] h-full border border-[#30363D]',
        'transition-all duration-200',
        className
      )}
    >
      {/* Column Header */}
      <div 
        className="p-3 border-b border-[#30363D] group"
        style={{ borderTop: `3px solid ${isOver ? '#3b82f6' : color || 'transparent'}`, transition: 'border-color 0.2s' }}
      >
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
              className="font-semibold text-base bg-transparent border border-blue-500 rounded-md p-1 w-full resize-none text-gray-100"
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className="font-semibold text-base text-gray-200 cursor-pointer flex-grow"
            >
              {title}
            </h3>
          )}
          <div className="flex items-center gap-1">
            <ColorPicker onChange={handleColorChange} />
            <button 
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-700"
              aria-label="Delete column"
            >
              <TrashIcon className="w-4 h-4 text-gray-400" />
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
          'flex-grow overflow-hidden p-2',
          'transition-colors duration-200',
          isOver && 'bg-blue-900/10'
        )}
      >
        <VirtualizedTaskList 
          tasks={tasks}
          taskIds={taskIds}
          searchQuery={searchQuery}
          focusedTaskId={focusedTaskId}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      </div>
      
      {/* Column Footer */}
      <div className="p-2 pt-0">
        {isAddingCard ? (
          <div className="p-1">
            <textarea
              placeholder="Enter a title for this card..."
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleAddCardKeyDown}
              onBlur={() => {
                // Submit on blur if there's text, otherwise cancel
                if (newCardTitle.trim()) {
                  handleAddCard();
                } else {
                  setIsAddingCard(false);
                }
              }}
              className="w-full bg-gray-900 rounded-md p-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 mt-2">
              <button 
                onClick={handleAddCard}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add card
              </button>
              <button 
                onClick={() => setIsAddingCard(false)}
                className="p-1.5 rounded-md hover:bg-gray-700"
                aria-label="Cancel adding card"
              >
                <XIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-2 rounded-md p-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add a card
          </button>
        )}
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
      <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-md hover:bg-gray-700">
        <PaletteIcon className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-10 top-full right-0 mt-2 p-2 bg-gray-800 rounded-md shadow-lg border border-gray-700">
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