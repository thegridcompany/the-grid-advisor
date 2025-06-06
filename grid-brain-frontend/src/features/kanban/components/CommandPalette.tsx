'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  action: () => void;
  hotkey?: string;
  disabled?: boolean;
}

interface CommandPaletteProps {
  commands: Command[];
}

// Dummy command data for now
const sampleCommands: Command[] = [
  { id: 'add-task', label: 'Add new task', action: () => console.log('Action: Add Task') },
  { id: 'add-column', label: 'Add new column', action: () => console.log('Action: Add Column') },
  { id: 'search', label: 'Search...', action: () => console.log('Action: Search') },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ commands }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const availableCommands = commands.length > 0 ? commands : sampleCommands;

  const filteredCommands = availableCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Reset index when search changes
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    // Scroll to selected item
    if (listRef.current && selectedIndex >= 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLLIElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);
  
  const paletteHotkeys: [string, (e: KeyboardEvent) => void][] = [
    ['ArrowUp', (e) => {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    }],
    ['ArrowDown', (e) => {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    }],
    ['Enter', (e) => {
        if (filteredCommands[selectedIndex]) {
            e.preventDefault();
            filteredCommands[selectedIndex].action();
            setIsOpen(false);
        }
    }],
  ];

  useHotkeys([['?', () => setIsOpen(true)]], { scope: 'global', priority: 1 });
  useHotkeys([['Escape', () => setIsOpen(false)]], { scope: 'command-palette', priority: 100, enabled: isOpen });
  useHotkeys(paletteHotkeys, { scope: 'command-palette', priority: 100, enabled: isOpen });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-[#1c1c1c] text-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-700">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent p-2 focus:outline-none"
            autoFocus
          />
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          <ul ref={listRef}>
            {filteredCommands.map((cmd, index) => (
              <li
                key={cmd.id}
                onClick={() => {
                  if (cmd.disabled) return;
                  cmd.action();
                  setIsOpen(false);
                }}
                className={cn(
                  "p-2 hover:bg-gray-700 rounded cursor-pointer flex justify-between",
                  { "bg-blue-600": selectedIndex === index },
                  { "opacity-50 cursor-not-allowed": cmd.disabled }
                )}
              >
                <span>{cmd.label}</span>
                {cmd.hotkey && <span className="text-gray-400">{cmd.hotkey}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 