import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Edit3, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AIMessage } from '@/hooks/useAIMessages';
import { GamifiedQuiz } from '@/components/course/GamifiedQuiz';
import { StaticQuizView } from '@/components/course/StaticQuizView';

interface EnhancedChatMessageItemProps {
  message: AIMessage;
  isUser: boolean;
  onCopyMessage?: (content: string) => void;
  onReactToMessage?: (messageId: string, reaction: 'like' | 'dislike') => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  showQuizAsStatic?: boolean;
  completedQuizzes?: Set<string>;
  onQuizComplete?: (messageId: string) => void;
}

export function EnhancedChatMessageItem({
  message,
  isUser,
  onCopyMessage,
  onReactToMessage,
  onEditMessage,
  showQuizAsStatic = false,
  completedQuizzes,
  onQuizComplete
}: EnhancedChatMessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleSaveEdit = async () => {
    if (editContent.trim() !== message.content && onEditMessage) {
      await onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const renderContent = (content: string) => {
    // Simple markdown-like parsing for formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md mt-2 mb-2 overflow-x-auto"><code>$1</code></pre>');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex gap-4 mb-6", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={cn("max-w-[85%] space-y-2", isUser ? "text-right" : "text-left")}>
        <Card className={cn(
          "p-4 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted text-muted-foreground"
        )}>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-20 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          )}
        </Card>

        {message.quiz_data && (
          <div className="mt-3">
            {showQuizAsStatic ? (
              <StaticQuizView 
                quiz={message.quiz_data}
              />
            ) : (
              <GamifiedQuiz
                quiz={message.quiz_data}
                onComplete={() => onQuizComplete?.(message.id)}
              />
            )}
          </div>
        )}

        {/* Actions and timestamp */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isUser ? "justify-end" : "justify-start"
        )}>
          {!isUser && !isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyMessage?.(message.content)}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReactToMessage?.(message.id, 'like')}
                className="h-6 px-2 text-xs"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReactToMessage?.(message.id, 'dislike')}
                className="h-6 px-2 text-xs"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </>
          )}
          
          {isUser && onEditMessage && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 px-2 text-xs"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          
          <span>{formatTime(message.created_at)}</span>
          {message.edited && <span className="italic">(edited)</span>}
        </div>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-accent to-accent/80 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-accent-foreground" />
        </div>
      )}
    </div>
  );
}