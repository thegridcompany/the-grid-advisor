'use client';

import React, { useRef, useState } from 'react';
import { SearchIcon, HelpCircleIcon } from 'lucide-react';
import { FilterIcon, PlusIcon } from './atoms/Icons';
import { useHotkeys } from '@/hooks/useHotkeys';
import { HotkeysGuide } from './HotkeysGuide';

interface KanbanToolbarProps {
  onSearch: (query: string) => void;
  onFilter: () => void;
  filterActive: boolean;
  activeFiltersCount?: number;
  onAddNewColumn: () => void;
}

export const KanbanToolbar: React.FC<KanbanToolbarProps> = ({ 
  onSearch, 
  onFilter, 
  filterActive,
  activeFiltersCount = 0,
  onAddNewColumn 
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);

  useHotkeys([
    ['/', (e) => {
      e.preventDefault();
      searchInputRef.current?.focus();
    }],
    ['?', () => setShowHotkeys(s => !s)],
  ]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-200">Kanban Board</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            placeholder="Search tasks... ( / )"
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-[#21262D] border border-[#30363D] rounded-md text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={onFilter}
            className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border ${
              filterActive 
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30' 
                : 'bg-[#21262D] border-[#30363D] text-gray-300 hover:bg-[#2c323a] hover:border-[#444c56]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {filterActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
        
        <button 
          onClick={onAddNewColumn}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Column
        </button>
        
        <button 
          onClick={() => setShowHotkeys(true)}
          className="p-2 bg-[#21262D] border border-[#30363D] text-gray-300 hover:bg-[#2c323a] hover:border-[#444c56] rounded-md transition-colors"
          title="Show keyboard shortcuts"
        >
          <HelpCircleIcon className="h-4 w-4" />
        </button>
        
        {showHotkeys && <HotkeysGuide onClose={() => setShowHotkeys(false)} />}
      </div>
    </div>
  );
}; 