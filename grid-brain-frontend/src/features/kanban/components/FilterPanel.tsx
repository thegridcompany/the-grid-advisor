'use client';

import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon, Trash2Icon } from './atoms/Icons';
import { Task } from '../types';
import { useHotkeys } from '@/hooks/useHotkeys';

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

  useHotkeys([
    ['Escape', onClose]
  ], { priority: 100 });

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
    if (name && Object.keys(currentFilters).length > 0) {
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

  const handlePriorityChange = (priority: Task['priority']) => {
    const newFilters = { ...currentFilters, priority };
    setCurrentFilters(newFilters);
    onApplyFilters(newFilters); // Apply immediately but keep panel open
  };

  const handleClearAllFilters = () => {
    setCurrentFilters({});
    onApplyFilters({});
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setCurrentFilters(preset.filters);
    onApplyFilters(preset.filters);
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40" 
        onClick={onClose}
      />
      
      {/* Filter Panel */}
      <div className="absolute top-16 right-6 w-80 bg-[#21262D] shadow-xl rounded-lg border border-[#30363D] z-50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-200">Filters</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
          >
            <XIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Priority Filter */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-3 text-gray-300">Priority</h4>
          <div className="space-y-2">
            {(['high', 'medium', 'low'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => handlePriorityChange(priority)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  currentFilters.priority === priority
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2a2f37] text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="capitalize">{priority}</span>
                {currentFilters.priority === priority && (
                  <span className="float-right">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleClearAllFilters}
            disabled={!hasActiveFilters}
            className="flex-1 px-3 py-2 text-sm bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleSavePreset}
            disabled={!hasActiveFilters}
            className="px-3 py-2 text-sm bg-[#2a2f37] text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save current filters as preset"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Presets */}
        {presets.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 text-gray-300">Saved Presets</h4>
            <div className="space-y-2">
              {presets.map(preset => (
                <div key={preset.name} className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 text-left px-3 py-2 text-sm bg-[#2a2f37] text-gray-300 rounded-md hover:bg-gray-700 transition-colors truncate"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.name)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete preset"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-[#30363D]">
            <div className="text-xs text-gray-400 mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(currentFilters).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}; 