'use client'

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading2,
  PlusSquare,
  Map,
  Code,
  Clock,
  Undo,
  Redo,
} from 'lucide-react';

type Props = {
  editor: Editor | null;
};

export function Toolbar({ editor }: Props) {
  if (!editor) {
    return null;
  }

  const addSection = (type: 'roadmap' | 'tech_stack' | 'estimates' | 'generic') => {
    let content = '';
    switch (type) {
      case 'roadmap':
        content = '<section data-section-type="roadmap"><h2>New Roadmap Phase</h2><ul><li>Milestone 1</li></ul></section>';
        break;
      case 'tech_stack':
        content = '<section data-section-type="tech_stack"><h2>Tech Stack</h2><ul><li>Frontend: ...</li><li>Backend: ...</li></ul></section>';
        break;
      case 'estimates':
        content = '<section data-section-type="estimates"><h2>Estimates</h2><p>Total hours: ...</p></section>';
        break;
      default:
        content = '<section data-section-type="generic"><h2>New Section</h2><p>Content...</p></section>';
    }
    editor.chain().focus().insertContent(content).run();
  }

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-t-lg p-2 bg-gray-100 dark:bg-gray-800 flex items-center flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <button onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="w-5 h-5" />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="w-5 h-5" />
        </button>
      </div>
      <div className="border-l border-gray-300 dark:border-gray-600 h-6"></div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Strikethrough"
        >
          <Strikethrough className="w-5 h-5" />
        </button>
      </div>
      <div className="border-l border-gray-300 dark:border-gray-600 h-6"></div>
       <div className="flex items-center gap-2">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <Heading2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Ordered List"
        >
          <ListOrdered className="w-5 h-5" />
        </button>
      </div>
      <div className="border-l border-gray-300 dark:border-gray-600 h-6"></div>
      <div className="flex items-center gap-2">
        <button onClick={() => addSection('roadmap')} title="Add Roadmap Section">
          <Map className="w-5 h-5" />
        </button>
         <button onClick={() => addSection('tech_stack')} title="Add Tech Stack Section">
          <Code className="w-5 h-5" />
        </button>
         <button onClick={() => addSection('estimates')} title="Add Estimates Section">
          <Clock className="w-5 h-5" />
        </button>
        <button onClick={() => addSection('generic')} title="Add Generic Section">
          <PlusSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 