'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHotkeys } from '@/hooks/useHotkeys';

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
    {children}
  </kbd>
);

const hotkeys = [
  { keys: ['→', '←'], description: 'Sposta focus tra colonne' },
  { keys: ['↑', '↓'], description: 'Sposta focus tra task' },
  { keys: ['Enter'], description: 'Modifica task selezionato' },
  { keys: ['d'], description: 'Elimina task selezionato' },
  { keys: ['Shift', '+', 'N'], description: 'Aggiungi task nella colonna' },
  { keys: ['Shift', '+', 'D'], description: 'Elimina colonna selezionata' },
  { keys: ['c'], description: 'Aggiungi nuova colonna' },
  { keys: ['f'], description: 'Mostra/nascondi filtri' },
  { keys: ['Esc'], description: 'Chiudi modali e pannelli' },
  { keys: ['?'], description: 'Mostra questa guida' },
];

interface HotkeysGuideProps {
  onClose: () => void;
}

export const HotkeysGuide: React.FC<HotkeysGuideProps> = ({ onClose }) => {
  useHotkeys([
    ['Escape', onClose],
  ], { priority: 100 });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        className={cn(
          "relative w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700",
          "transition-opacity duration-200 ease-in-out",
        )}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-700"
          aria-label="Close hotkeys guide"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <h4 className="font-bold text-lg mb-4 text-gray-100">Guida Rapida</h4>
        <ul className="space-y-3">
          {hotkeys.map((hotkey, index) => (
            <li key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{hotkey.description}</span>
              <div className="flex items-center gap-1">
                {hotkey.keys.map(key => <Key key={key}>{key}</Key>)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 