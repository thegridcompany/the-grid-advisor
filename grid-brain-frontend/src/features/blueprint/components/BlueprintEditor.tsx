'use client'

import { useEditor, EditorContent, JSONContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Toolbar } from './Toolbar'
import { SectionNode } from '../editor/SectionNode'
import History from '@tiptap/extension-history'
import Comment from '@sereneinserenade/tiptap-comment-extension'
import { CommentsPanel } from './CommentsPanel'
// import { Validation } from '../editor/Validation' // Temporarily disabled
import { useKanbanDispatch } from '@/features/kanban/state/kanbanContext'
import { MessageSquarePlus } from 'lucide-react'



export type ProsemirrorJSON = JSONContent;

type CommentReply = {
  id: string;
  author: string;
  content: string;
};

type CommentType = {
  id: string;
  author: string;
  content: string;
  replies: CommentReply[];
  resolved: boolean;
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
  const kanbanDispatch = useKanbanDispatch();
  const [commentsPanelWidth, setCommentsPanelWidth] = useState(320); // Default 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);

  const handleCommentActivated = useCallback((commentId: string | null) => {
    setActiveCommentId(commentId);
  }, []);

  // Handle resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      const newWidth = containerWidth - e.clientX;
      
      // Set constraints: min 280px, max 600px
      const constrainedWidth = Math.min(Math.max(newWidth, 280), 600);
      setCommentsPanelWidth(constrainedWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Prevent text selection during resize
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

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
        class: 'bg-yellow-100 dark:bg-yellow-900 px-1 rounded cursor-pointer transition-all hover:bg-yellow-200',
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
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'data-gramm': 'false',
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
        replies: [],
        resolved: false,
      };
      setComments([...comments, newComment]);
    }
  };

  const handleUpdateComment = (updatedComment: CommentType) => {
    setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
    
    // Se il commento è stato risolto, rimuovi l'evidenziazione dall'editor.
    if (updatedComment.resolved && editor) {
      editor.chain().focus().unsetComment(updatedComment.id).run();
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: 'top-end' }}
          shouldShow={({ editor, from, to }) => {
            // Mostra solo se c'è una selezione e non c'è già un commento attivo
            return from !== to && !editor.isActive('comment');
          }}
        >
          <button
            onClick={() => {
              const id = `comment-${Date.now()}`;
              editor.chain().focus().setComment(id).run();
              // Aggiorna lo stato direttamente qui per forzare il refresh
              setActiveCommentId(id);
            }}
            className="p-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            title="Aggiungi commento"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span className="text-sm">Commenta</span>
          </button>
        </BubbleMenu>
      )}
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
                <div className="text-center text-gray-400 dark:text-gray-600 p-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Benvenuto nel Blueprint Editor!</h3>
                  
                  <div className="text-sm text-left inline-block">
                    <p className="mb-3 font-medium">Inizia a costruire il tuo progetto in 3 semplici passi:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>
                        <span className="font-semibold">Aggiungi sezioni:</span> Usa il menu <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">&quot;Sezioni&quot;</code> in alto per inserire blocchi predefiniti come &quot;Roadmap&quot; o &quot;Stack Tecnologico&quot;.
                      </li>
                      <li>
                        <span className="font-semibold">Modifica il contenuto:</span> Clicca all&apos;interno di una sezione per aggiungere i tuoi testi, elenchi e dettagli.
                      </li>
                      <li>
                        <span className="font-semibold">Formatta il testo:</span> Utilizza la toolbar per applicare stili come grassetto, corsivo o per creare titoli.
                      </li>
                    </ol>
                  </div>

                  <p className="mt-6 text-xs italic">Questo messaggio scompare non appena inizi a scrivere.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showComments && (
          <>
            {/* Resize Handle */}
            <div
              className={`w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200 ${
                isResizing ? 'bg-blue-500 dark:bg-blue-400' : ''
              }`}
              onMouseDown={handleMouseDown}
              title="Trascina per ridimensionare il pannello commenti"
            />
            
            {/* Comments Panel */}
            <div 
              className="flex-shrink-0 overflow-hidden"
              style={{ width: `${commentsPanelWidth}px` }}
            >
              <CommentsPanel 
                comments={comments} 
                activeCommentId={activeCommentId} 
                onAddComment={handleAddComment} 
                onUpdateComment={handleUpdateComment}
                onAddTaskFromComment={kanbanDispatch?.addTask}
              />
            </div>
          </>
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