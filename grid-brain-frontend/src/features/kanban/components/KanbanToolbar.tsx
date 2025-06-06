'use client';

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterIcon, SearchIcon } from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';

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

  useHotkeys([
    ['Cmd+K', () => searchInputRef.current?.focus()],
  ]);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder="Search tasks..."
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <Button variant={filterActive ? "secondary" : "outline"} onClick={onFilter}>
          <FilterIcon className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
      <div>
        <Button onClick={onAddNewColumn}>Add Column</Button>
      </div>
    </div>
  );
}; 