'use client'

import React, { useState, useRef, useEffect, createContext, useContext } from 'react'

// --- Context for state management ---
interface DropdownContextType {
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a Dropdown component');
  }
  return context;
};

// --- Component Interfaces ---
interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

interface DropdownItemProps {
  onClick: () => void
  icon?: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
}

// --- Main Dropdown Component ---
export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number | 'auto'; right: number | 'auto' }>({ 
    top: 0, 
    left: 'auto', 
    right: 'auto' 
  })
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    setIsOpen(false);
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const top = triggerRect.bottom + 8;
    const left: number | 'auto' = align === 'left' ? triggerRect.left : 'auto';
    const right: number | 'auto' = align === 'right' ? window.innerWidth - triggerRect.right : 'auto';
    
    setPosition({ top, left, right });
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') handleClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);
  
  return (
    <DropdownContext.Provider value={{ close: handleClose }}>
      <div className="relative">
        <div ref={triggerRef} onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/5" 
              onClick={handleClose} 
            />
            <div
              className="fixed z-50 min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1"
              style={{
                top: `${position.top}px`,
                left: position.left !== 'auto' ? `${position.left}px` : 'auto',
                right: position.right !== 'auto' ? `${position.right}px` : 'auto',
              }}
            >
              {children}
            </div>
          </>
        )}
      </div>
    </DropdownContext.Provider>
  )
}

// --- Dropdown Item Component ---
export const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, icon, children, disabled = false }) => {
  const { close } = useDropdown();

  const handleClick = () => {
    if (!disabled) {
      close();
      setTimeout(() => {
        onClick();
      }, 0);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2.5 transition-colors ${
        disabled 
          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  )
}

// --- Other Dropdown Components ---
export const DropdownSeparator = () => (
  <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
)

export const DropdownLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
    {children}
  </div>
) 