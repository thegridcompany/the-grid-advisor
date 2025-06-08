'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, User, CheckCircle2, CornerDownRight, ChevronDown, ChevronUp, PlusSquare } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { AnimatePresence, motion } from 'framer-motion'

type CommentReply = {
  id: string;
  author: string;
  content: string;
};

type Comment = {
  id: string;
  author: string;
  content: string;
  replies: CommentReply[];
  resolved: boolean;
};

type Props = {
  comments: Comment[];
  activeCommentId: string | null;
  onAddComment: (comment: Omit<Comment, 'id' | 'author' | 'replies' | 'resolved'>) => void;
  onUpdateComment: (comment: Comment) => void;
  onAddTaskFromComment?: (payload: { title: string; columnId: string; projectId: string; }) => Promise<void>;
};

const CommentInput = ({ onSubmit, placeholder = "Rispondi...", buttonText = "Rispondi" }: { 
  onSubmit: (content: string) => void;
  placeholder?: string;
  buttonText?: string;
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="text-sm resize-none focus:ring-2 focus:ring-blue-500/20 border-gray-200 dark:border-gray-700"
      />
      <div className="flex justify-end mt-2">
        <Button type="submit" size="sm" disabled={!content.trim()} className="h-8 px-3 text-xs">
          <Send className="w-3 h-3 mr-1.5" />
          {buttonText}
        </Button>
      </div>
    </form>
  );
};

const CommentThread = ({ comment, onUpdate, onAddTask }: { 
  comment: Comment; 
  onUpdate: (comment: Comment) => void; 
  onAddTask?: (payload: { title: string; columnId: string; projectId: string; }) => Promise<void>;
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor container width for responsive breakpoints
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Responsive breakpoints based on container width
  const isNarrow = containerWidth < 320;
  const isCompact = containerWidth < 400;

  const handleReply = (content: string) => {
    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      author: 'Utente Corrente',
      content
    };
    onUpdate({ ...comment, replies: [...comment.replies, newReply] });
    setIsReplying(false);
  };
  
  const handleResolve = () => {
    onUpdate({ ...comment, resolved: !comment.resolved });
  };

  const handleCreateTask = async () => {
    if (onAddTask) {
      await onAddTask({
        title: comment.content,
        columnId: 'backlog', 
        projectId: 'project-1'
      });
      handleResolve();
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 
        ${comment.resolved 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50' 
          : 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border-gray-200/70 dark:border-gray-700/70'
        }
        hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50
        hover:border-gray-300/70 dark:hover:border-gray-600/70
      `}
    >
      {/* Status Indicator */}
      {comment.resolved && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-green-500/80" />
      )}

      {/* Main Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`
            ${isNarrow ? 'w-6 h-6' : 'w-8 h-8'} 
            bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500
            rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-blue-500/20
          `}>
            <User className={`${isNarrow ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`${isNarrow ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 truncate`}>
                {comment.author}
              </span>
              {comment.resolved && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {!isNarrow && <span className="text-xs">Risolto</span>}
                </div>
              )}
            </div>
            <p className={`${isNarrow ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-300 mt-1 leading-relaxed`}>
              {comment.content}
            </p>
          </div>
        </div>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="space-y-3 ml-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
            {comment.replies.map(reply => (
              <div key={reply.id} className="flex items-start gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{reply.author}</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {!comment.resolved && (
          <div className={`
            mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50
            ${isNarrow ? 'space-y-2' : 'flex justify-end'}
          `}>
            {isNarrow ? (
              // Narrow layout: vertical stack
              <div className="space-y-2">
                {onAddTask && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-8 text-xs justify-center bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30" 
                    onClick={handleCreateTask}
                  >
                    <PlusSquare className="w-3 h-3 mr-1.5" />
                    Task
                  </Button>
                )}
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-7 text-xs justify-center hover:bg-gray-100 dark:hover:bg-gray-800" 
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    <CornerDownRight className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-7 text-xs justify-center text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" 
                    onClick={handleResolve}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : isCompact ? (
              // Compact layout: icons with minimal text
              <div className="flex items-center gap-1">
                {onAddTask && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30" 
                    onClick={handleCreateTask}
                  >
                    <PlusSquare className="w-3 h-3 mr-1" />
                    Task
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800" 
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <CornerDownRight className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" 
                  onClick={handleResolve}
                >
                  <CheckCircle2 className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              // Wide layout: full text labels
              <div className="flex items-center gap-2">
                {onAddTask && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30" 
                    onClick={handleCreateTask}
                  >
                    <PlusSquare className="w-3 h-3 mr-1.5" />
                    Crea Task
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-xs hover:bg-gray-100 dark:hover:bg-gray-800" 
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <CornerDownRight className="w-3 h-3 mr-1.5" />
                  Rispondi
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" 
                  onClick={handleResolve}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Risolvi
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Reply Input */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
            <CommentInput onSubmit={handleReply} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const CommentsPanel = ({ comments, activeCommentId, onAddComment, onUpdateComment, onAddTaskFromComment }: Props) => {
  const [showResolved, setShowResolved] = useState(false);
  
  const activeComments = comments.filter(c => c.id === activeCommentId);
  const unresolvedComments = activeComments.filter(c => !c.resolved);
  const resolvedComments = activeComments.filter(c => c.resolved);

  const handleAddTopLevelComment = (content: string) => {
    onAddComment({ content });
  };
  
  const handleUpdate = (updatedComment: Comment) => {
    onUpdateComment(updatedComment);
  };

  return (
    <div className="h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Commenti</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeCommentId ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {unresolvedComments.length > 0 ? (
                  unresolvedComments.map((comment) => (
                    <CommentThread key={comment.id} comment={comment} onUpdate={handleUpdate} onAddTask={onAddTaskFromComment} />
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nessun commento attivo</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Add Comment */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/70 dark:border-gray-700/70 p-4">
                <CommentInput 
                  onSubmit={handleAddTopLevelComment}
                  placeholder="Aggiungi un nuovo commento..."
                  buttonText="Commenta"
                />
              </div>
              
              {/* Resolved Comments */}
              {resolvedComments.length > 0 && (
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowResolved(!showResolved)}
                  >
                    <span className="flex items-center gap-2">
                      {showResolved ? 'Nascondi risolti' : `Mostra ${resolvedComments.length} risolti`}
                      {showResolved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </Button>
                  
                  {showResolved && (
                    <div className="mt-4 space-y-3">
                      <AnimatePresence>
                        {resolvedComments.map(comment => (
                          <CommentThread key={comment.id} comment={comment} onUpdate={handleUpdate} onAddTask={onAddTaskFromComment} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Seleziona del testo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Evidenzia una parte del documento per vedere o aggiungere commenti.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 