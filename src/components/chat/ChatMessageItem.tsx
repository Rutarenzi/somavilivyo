
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChatbot';
import { GamifiedQuiz } from '../course/GamifiedQuiz';
import { StaticQuizView } from '../course/StaticQuizView';

interface ChatMessageItemProps {
  message: ChatMessage;
  onCopy: (text: string) => void;
  onReact: (messageId: string, reactionType: 'like' | 'dislike') => void;
  showQuizAsStatic?: boolean;
  onQuizComplete?: (messageId: string) => void;
}

export function ChatMessageItem({ 
  message, 
  onCopy, 
  onReact, 
  showQuizAsStatic = false,
  onQuizComplete 
}: ChatMessageItemProps) {
  // Enhanced content rendering with better markdown support
  const renderContent = (content: string) => {
    // Handle code blocks
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Multi-line code block
        const code = part.slice(3, -3).trim();
        const lines = code.split('\n');
        const language = lines[0].includes(' ') ? '' : lines[0];
        const codeContent = language ? lines.slice(1).join('\n') : code;
        
        return (
          <pre key={index} className="bg-gray-100 p-3 rounded-md my-2 overflow-x-auto text-sm">
            <code className={language ? `language-${language}` : ''}>{codeContent}</code>
          </pre>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        // Inline code
        return (
          <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        );
      } else {
        // Regular text with basic markdown
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((textPart, textIndex) => {
              if (textPart.startsWith('**') && textPart.endsWith('**')) {
                return <strong key={textIndex}>{textPart.slice(2, -2)}</strong>;
              } else if (textPart.startsWith('*') && textPart.endsWith('*')) {
                return <em key={textIndex}>{textPart.slice(1, -1)}</em>;
              }
              return textPart;
            })}
          </span>
        );
      }
    });
  };

  const handleQuizComplete = () => {
    if (onQuizComplete) {
      onQuizComplete(message.id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-3 max-w-[85%] group",
        message.role === 'user' ? "ml-auto flex-row-reverse space-x-reverse" : ""
      )}
    >
      <Avatar className="mt-1 h-8 w-8 flex-shrink-0">
        <AvatarFallback 
          className={cn(
            "text-xs font-medium",
            message.role === 'user' 
              ? "bg-indigo-500 text-white" 
              : message.role === 'system'
              ? "bg-yellow-500 text-white"
              : "bg-purple-500 text-white"
          )}
        >
          {message.role === 'user' ? 'You' : message.role === 'system' ? 'Sys' : 'AI'}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "p-4 rounded-2xl shadow-sm max-w-full",
          message.role === 'user'
            ? "bg-indigo-500 text-white rounded-tr-md"
            : message.role === 'system'
            ? "bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm italic text-center rounded-tl-md"
            : "bg-white text-gray-800 border border-gray-200 rounded-tl-md"
        )}
      >
        <div className="prose prose-sm max-w-none">
          {renderContent(message.content)}
        </div>
        
        {/* Quiz rendering */}
        {message.role === 'assistant' && message.quiz && (
          <div className="mt-4 border-t pt-4">
            {!showQuizAsStatic ? (
              <GamifiedQuiz
                quiz={{
                  question: message.quiz.question,
                  options: message.quiz.options,
                  correct: message.quiz.correctAnswerIndex,
                  explanation: message.quiz.explanation,
                }}
                onComplete={handleQuizComplete}
              />
            ) : (
              <StaticQuizView quiz={message.quiz} />
            )}
          </div>
        )}
        
        {/* Message actions for assistant messages */}
        {message.role === 'assistant' && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(message.content)}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReact(message.id, 'like')}
                className="h-7 px-2 text-xs text-gray-500 hover:text-green-600"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReact(message.id, 'dislike')}
                className="h-7 px-2 text-xs text-gray-500 hover:text-red-600"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
        
        {/* Timestamp for user and system messages */}
        {message.role !== 'assistant' && (
          <p className="text-xs opacity-60 mt-2 text-right">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </div>
    </div>
  );
}
