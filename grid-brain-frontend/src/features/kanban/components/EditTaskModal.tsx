'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useHotkeys } from '@/hooks/useHotkeys';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  useHotkeys([
    ['Escape', onClose]
  ], { enabled: isOpen, priority: 100 });

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value: "low" | "medium" | "high") => {
    setEditedTask(prev => ({ ...prev, priority: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-[#21262D] rounded-lg shadow-xl border border-[#30363D] w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100">Edit Task</h2>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">Title</label>
          <Input 
            id="title"
            name="title"
            value={editedTask.title}
            onChange={handleChange}
            className="bg-[#2a2f37] border-[#444c56] text-gray-200"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <Textarea
            id="description"
            name="description"
            value={editedTask.description || ''}
            onChange={handleChange}
            className="bg-[#2a2f37] border-[#444c56] text-gray-200"
            rows={4}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-400 mb-1">Assignee</label>
            <Input 
              id="assignee"
              name="assignee"
              value={editedTask.assignee || ''}
              onChange={handleChange}
              className="bg-[#2a2f37] border-[#444c56] text-gray-200"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
            <Select onValueChange={handlePriorityChange} defaultValue={editedTask.priority}>
              <SelectTrigger className="bg-[#2a2f37] border-[#444c56] text-gray-200">
                <SelectValue placeholder="Set priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2f37] border-[#444c56]">
                <SelectItem value="low" className="text-gray-200 focus:bg-gray-700">Low</SelectItem>
                <SelectItem value="medium" className="text-gray-200 focus:bg-gray-700">Medium</SelectItem>
                <SelectItem value="high" className="text-gray-200 focus:bg-gray-700">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}; 