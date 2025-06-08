'use client'

import React from 'react'
import { NodeViewWrapper, NodeViewContent, Editor } from '@tiptap/react'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { Map, Code, Clock, FileText, Settings, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'

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

interface SectionViewProps {
  node: ProsemirrorNode;
  editor: Editor;
  getPos: () => number;
}

export const SectionView: React.FC<SectionViewProps> = ({ node, editor, getPos }) => {
  const sectionType = node.attrs['data-section-type'] || 'generic';

  const handleDelete = () => {
    editor.chain().focus().deleteRange({ from: getPos(), to: getPos() + node.nodeSize }).run();
  };

  const handleDuplicate = () => {
    editor.chain().focus().insertContentAt(getPos() + node.nodeSize, node.toJSON()).run();
  };

  const handleMoveUp = () => {
    const currentPos = getPos();
    if (currentPos === 0) return;

    let targetPos = 0;
    let foundPrevious = false;
    editor.state.doc.nodesBetween(0, currentPos, (prevNode, pos) => {
      if (pos < currentPos && prevNode.type.name === 'section') {
        targetPos = pos;
        foundPrevious = true;
      }
    });

    if (foundPrevious) {
      const tr = editor.state.tr;
      const $currentPos = tr.doc.resolve(currentPos);
      const $targetPos = tr.doc.resolve(targetPos);
      const currentNode = $currentPos.nodeAfter;
      if (currentNode) {
        tr.delete($currentPos.pos, $currentPos.pos + currentNode.nodeSize);
        tr.insert($targetPos.pos, currentNode);
        editor.view.dispatch(tr);
      }
    }
  };

  const handleMoveDown = () => {
    const currentPos = getPos();
    const docSize = editor.state.doc.content.size;
    let nextPos: number | null = null;

    editor.state.doc.nodesBetween(currentPos + node.nodeSize, docSize, (nextNode, pos) => {
      if (nextNode.type.name === 'section' && nextPos === null) {
        nextPos = pos;
      }
      return false; // Stop after finding the very next section
    });

    if (nextPos !== null) {
      const tr = editor.state.tr;
      const $currentPos = tr.doc.resolve(currentPos);
      const $nextPos = tr.doc.resolve(nextPos);
      const currentNode = $currentPos.nodeAfter;
      const nextNode = $nextPos.nodeAfter;

      if (currentNode && nextNode) {
        tr.delete($currentPos.pos, $currentPos.pos + currentNode.nodeSize);
        tr.insert($nextPos.pos + nextNode.nodeSize, currentNode);
        editor.view.dispatch(tr);
      }
    }
  };

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
        <Dropdown
          align="right"
          trigger={
            <Button 
              variant="ghost"
              size="sm"
              className="p-1.5 h-auto bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Settings className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </Button>
          }
        >
          <DropdownItem onClick={handleMoveUp} icon={<ArrowUp className="w-4 h-4" />}>Sposta Su</DropdownItem>
          <DropdownItem onClick={handleMoveDown} icon={<ArrowDown className="w-4 h-4" />}>Sposta Giù</DropdownItem>
          <DropdownItem onClick={handleDuplicate} icon={<Copy className="w-4 h-4" />}>Duplica Sezione</DropdownItem>
          <DropdownSeparator />
          <DropdownItem onClick={handleDelete} icon={<Trash2 className="w-4 h-4 text-red-500" />}>
            <span className="text-red-500">Elimina Sezione</span>
          </DropdownItem>
        </Dropdown>
      </div>
    </NodeViewWrapper>
  )
} 