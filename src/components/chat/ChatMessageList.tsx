
import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/hooks/useChatbot';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  onCopyMessage: (text: string) => void;
  onReactToMessage: (messageId: string, reactionType: 'like' | 'dislike') => void;
}

export function ChatMessageList({
  messages,
  isLoading,
  error,
  scrollAreaRef,
  onCopyMessage,
  onReactToMessage
}: ChatMessageListProps) {
  // Track which quizzes have been completed
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<string, boolean>>({});

  const handleQuizComplete = (messageId: string) => {
    setCompletedQuizzes(prev => ({ ...prev, [messageId]: true }));
  };

  return (
    <ScrollArea className="flex-1 h-full w-full" ref={scrollAreaRef}>
      <div className="space-y-6 max-w-4xl mx-auto px-4 py-6 min-h-full">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your AI Assistant!
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Ask me anything! I can help with explanations, provide detailed answers, 
              and even create interactive quizzes to test your understanding.
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            onCopy={onCopyMessage}
            onReact={onReactToMessage}
            showQuizAsStatic={completedQuizzes[message.id]}
            onQuizComplete={handleQuizComplete}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-xs font-medium text-white">AI</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && messages.some(m => m.role === 'system' && m.content.includes(error)) === false && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
