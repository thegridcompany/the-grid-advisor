'use client'

import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Node } from 'prosemirror-model'
import { Map, Code, Clock, FileText, Settings } from 'lucide-react'

const getSectionIcon = (type: string) => {
  switch (type) {
    case 'roadmap':
      return <Map className="w-3 h-3" />;
    case 'tech_stack':
      return <Code className="w-3 h-3" />;
    case 'estimates':
      return <Clock className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
};

const getSectionLabel = (type: string) => {
  switch (type) {
    case 'roadmap':
      return 'Roadmap';
    case 'tech_stack':
      return 'Tech Stack';
    case 'estimates':
      return 'Stime';
    default:
      return 'Sezione';
  }
};

const getSectionColor = (type: string) => {
  switch (type) {
    case 'roadmap':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    case 'tech_stack':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    case 'estimates':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700';
  }
};

export const SectionView = ({ node }: { node: Node }) => {
  const sectionType = node.attrs['data-section-type'] || 'generic';

  return (
    <NodeViewWrapper 
      className={`
        relative group my-4 rounded-lg border-2 border-dashed transition-all duration-200 
        hover:border-solid hover:shadow-sm
        ${getSectionColor(sectionType)}
      `}
    >
      {/* Section Label */}
      <div 
        contentEditable={false} 
        className={`
          absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-medium 
          flex items-center gap-1.5 shadow-sm border
          ${getSectionColor(sectionType)} bg-white dark:bg-gray-900
        `}
      >
        {getSectionIcon(sectionType)}
        <span>{getSectionLabel(sectionType)}</span>
      </div>

      {/* Content Area */}
      <div className="p-6 pt-8">
        <NodeViewContent className="prose prose-sm max-w-none dark:prose-invert" />
      </div>

      {/* Hover Actions */}
      <div 
        contentEditable={false}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <button 
          className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Opzioni sezione"
        >
          <Settings className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </NodeViewWrapper>
  )
} 