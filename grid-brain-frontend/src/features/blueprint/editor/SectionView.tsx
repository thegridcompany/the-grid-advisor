'use client'

import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Node } from 'prosemirror-model'

export const SectionView = ({ node }: { node: Node }) => {
  const sectionType = node.attrs['data-section-type'] || 'generic';

  return (
    <NodeViewWrapper className="relative group p-2 my-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <div 
        contentEditable={false} 
        className="absolute -top-2 -left-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-mono px-2 py-0.5 rounded"
      >
        {sectionType}
      </div>
      <NodeViewContent className="content" />
    </NodeViewWrapper>
  )
} 