'use client';

import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterIcon, SearchIcon, HelpCircleIcon } from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { HotkeysGuide } from './HotkeysGuide';

interface KanbanToolbarProps {
  onSearch: (query: string) => void;
  onFilter: () => void;
  filterActive: boolean;
  onAddNewColumn: () => void;
}

export const KanbanToolbar: React.FC<KanbanToolbarProps> = ({ 
  onSearch, 
  onFilter, 
  filterActive,
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
      <div className="flex items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder="Search tasks... ( / )"
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 w-64 bg-[#21262D] border-[#30363D] text-gray-200 placeholder:text-gray-500 focus:ring-blue-500"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={onFilter}
          className={`bg-[#21262D] border-[#30363D] hover:bg-[#2c323a] ${filterActive ? 'text-blue-400 border-blue-400' : 'text-gray-300'}`}
        >
          <FilterIcon className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button 
          onClick={onAddNewColumn}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Column
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-[#21262D] border-[#30363D] text-gray-300 hover:bg-[#2c323a]"
          onClick={() => setShowHotkeys(true)}
        >
          <HelpCircleIcon className="h-5 w-5" />
        </Button>
        {showHotkeys && <HotkeysGuide onClose={() => setShowHotkeys(false)} />}
      </div>
    </div>
  );
}; 