'use client'

import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'bottom',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        setIsVisible(true)
      }
    }, delay)
  }
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }
  
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      let x = 0
      let y = 0
      
      switch (side) {
        case 'top':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
          y = triggerRect.top - tooltipRect.height - 8
          break
        case 'bottom':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
          y = triggerRect.bottom + 8
          break
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
          break
        case 'right':
          x = triggerRect.right + 8
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
          break
      }
      
      // Clamp values to be within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8))
      y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8))

      setPosition({ x, y })
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [isVisible, side])


  const getTooltipClasses = () => {
    return `fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`
  }

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45'
    
    // Note: arrow positioning is relative to the tooltip itself and doesn't need dynamic calculation
    // This part would need more complex logic if we want the arrow to point exactly to the trigger
    // For now, we center it.
    switch (side) {
      case 'top':
        return `${baseClasses} left-1/2 -translate-x-1/2 bottom-[-4px]`
      case 'bottom':
        return `${baseClasses} left-1/2 -translate-x-1/2 top-[-4px]`
      case 'left':
        return `${baseClasses} top-1/2 -translate-y-1/2 right-[-4px]`
      case 'right':
        return `${baseClasses} top-1/2 -translate-y-1/2 left-[-4px]`
      default:
        return `${baseClasses} left-1/2 -translate-x-1/2 top-[-4px]`
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      <div
        ref={tooltipRef}
        className={getTooltipClasses()}
        style={{
          left: position.x,
          top: position.y,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <div className={getArrowClasses()} />
        {content}
      </div>
    </>
  )
} 