'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { Task } from '../types';

interface FilterPanelProps {
  onClose: () => void;
  onApplyFilters: (filters: Partial<Task>) => void;
  initialFilters: Partial<Task>;
}

interface FilterPreset {
  name: string;
  filters: Partial<Task>;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onClose, onApplyFilters, initialFilters }) => {
  const [currentFilters, setCurrentFilters] = useState<Partial<Task>>(initialFilters);
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    const savedPresets = localStorage.getItem('kanbanFilterPresets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  useEffect(() => {
    setCurrentFilters(initialFilters);
  }, [initialFilters]);

  const handleSavePreset = () => {
    const name = prompt('Enter a name for this filter preset:');
    if (name) {
      const newPreset = { name, filters: currentFilters };
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      localStorage.setItem('kanbanFilterPresets', JSON.stringify(updatedPresets));
    }
  };

  const handleDeletePreset = (presetName: string) => {
    const updatedPresets = presets.filter(p => p.name !== presetName);
    setPresets(updatedPresets);
    localStorage.setItem('kanbanFilterPresets', JSON.stringify(updatedPresets));
  };

  const handleApplyAndClose = (filters: Partial<Task>) => {
    onApplyFilters(filters);
    // onClose(); // Optional: close panel after applying a filter
  };

  const handlePriorityChange = (priority: Task['priority']) => {
    const newFilters = { ...currentFilters, priority };
    setCurrentFilters(newFilters);
    handleApplyAndClose(newFilters);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    handleApplyAndClose({});
  };

  return (
    <div className="absolute top-16 right-6 h-auto w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-700 z-20 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <h4 className="font-medium text-sm mb-2">Priority</h4>
        <div className="flex flex-col gap-2">
          <Button variant={currentFilters.priority === 'high' ? 'secondary' : 'outline'} onClick={() => handlePriorityChange('high')}>High</Button>
          <Button variant={currentFilters.priority === 'medium' ? 'secondary' : 'outline'} onClick={() => handlePriorityChange('medium')}>Medium</Button>
          <Button variant={currentFilters.priority === 'low' ? 'secondary' : 'outline'} onClick={() => handlePriorityChange('low')}>Low</Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="font-medium text-sm mb-2">Filter Presets</h4>
        <div className="flex flex-col gap-2">
          {presets.map(preset => (
            <div key={preset.name} className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => {
                setCurrentFilters(preset.filters);
                handleApplyAndClose(preset.filters);
              }}>
                {preset.name}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeletePreset(preset.name)}>
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleSavePreset}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Save current filters
        </Button>
      </div>
    </div>
  );
}; 