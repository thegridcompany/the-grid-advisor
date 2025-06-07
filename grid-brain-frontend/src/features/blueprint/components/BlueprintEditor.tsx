'use client'

import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Toolbar } from './Toolbar'
import { SectionNode } from '../editor/SectionNode'
import History from '@tiptap/extension-history'
import Comment from '@sereneinserenade/tiptap-comment-extension'
import { CommentsPanel } from './CommentsPanel'
// import { Validation } from '../editor/Validation' // Temporarily disabled



export type ProsemirrorJSON = JSONContent;

type CommentType = {
  id: string;
  author: string;
  content: string;
};

interface EditorCoreProps {
  initialContent?: ProsemirrorJSON | string;
  onUpdate?: (content: ProsemirrorJSON) => void;
  showComments?: boolean;
  className?: string;
}

const EditorCore: React.FC<EditorCoreProps> = ({ 
  initialContent, 
  onUpdate, 
  showComments = true,
  className = ""
}) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Stabilize the comment activation callback
  const handleCommentActivated = useCallback((commentId: string | null) => {
    setActiveCommentId(commentId);
  }, []);

  // Stabilize the extensions array using useMemo to prevent infinite loops
  const extensions = useMemo(() => [
    StarterKit.configure({
      // La cronologia viene gestita dall'estensione History dedicata
      history: false,
    }),
    SectionNode,
    // Si ripristina la cronologia standard dato che la collaborazione è disabilitata
    History,
    Comment.configure({
      HTMLAttributes: {
        class: 'bg-yellow-100 dark:bg-yellow-900 px-1 rounded cursor-pointer',
      },
      onCommentActivated: handleCommentActivated,
    }),
    // Validation, // Temporarily disabled - causes infinite loop in onUpdate
  ], [handleCommentActivated]);

  const editor = useEditor({
    extensions,
    content: initialContent || '',
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto p-6 focus:outline-none min-h-[400px] max-w-none',
        style: 'font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getJSON());
      }
    },
  })

  useEffect(() => {
    if (editor && initialContent) {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)) {
          editor.commands.setContent(initialContent, false);
      }
    }
  }, [editor, initialContent]);

  const handleAddComment = ({ content }: { content: string }) => {
    if (activeCommentId) {
      const newComment: CommentType = {
        id: activeCommentId,
        author: 'Utente Corrente',
        content,
      };
      setComments([...comments, newComment]);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <Toolbar editor={editor} />
      
      <div className="flex">
        <div 
          className={`flex-1 ${showComments ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}
          role="main" 
          aria-label="Blueprint Editor"
        >
          <div className="relative">
            <EditorContent 
              editor={editor} 
              className="min-h-[400px] bg-gray-50/30 dark:bg-gray-800/30"
            />
            
            {editor && editor.getText().length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400 dark:text-gray-600">
                  <div className="text-lg font-medium mb-2">Inizia a scrivere il tuo blueprint</div>
                  <div className="text-sm">
                    Usa la toolbar per aggiungere sezioni, formattare il testo e collaborare
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showComments && (
          <div className="w-80 flex-shrink-0">
            <CommentsPanel 
              comments={comments} 
              activeCommentId={activeCommentId} 
              onAddComment={handleAddComment} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Caricamento dinamico del componente EditorCore per evitare problemi di SSR
const DynamicEditorCore = dynamic(() => Promise.resolve(EditorCore), { ssr: false });

export const BlueprintEditor: React.FC<EditorCoreProps> = ({ 
  initialContent, 
  onUpdate, 
  showComments = true,
  className = ""
}) => {
  return (
    <div className="w-full">
      <DynamicEditorCore 
        initialContent={initialContent} 
        onUpdate={onUpdate} 
        showComments={showComments}
        className={className}
      />
    </div>
  )
} 