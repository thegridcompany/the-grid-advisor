'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, User } from 'lucide-react'

type Comment = {
  id: string;
  author: string;
  content: string;
};

type Props = {
  comments: Comment[];
  activeCommentId: string | null;
  onAddComment: (comment: Omit<Comment, 'id' | 'author'>) => void;
};

export const CommentsPanel = ({ comments, activeCommentId, onAddComment }: Props) => {
  const [newComment, setNewComment] = useState('');
  const activeComments = comments.filter(comment => comment.id === activeCommentId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newComment.trim()) {
      onAddComment({ content: newComment.trim() });
      setNewComment('');
    }
  };

  return (
    <div className="h-full bg-gray-50/50 dark:bg-gray-800/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Commenti
          </h2>
        </div>
        {activeCommentId && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Commenti per la selezione corrente
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {activeCommentId ? (
          <>
            {/* Comments List */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {activeComments.length > 0 ? (
                activeComments.map((comment, index) => (
                  <div 
                    key={index} 
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {comment.author}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Nessun commento ancora
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Aggiungi il primo commento per questa selezione
                  </p>
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                    placeholder="Scrivi un commento..."
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!newComment.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Invia commento
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* No Selection State */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                Seleziona del testo
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                Evidenzia del testo nell&apos;editor per visualizzare o aggiungere commenti
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 