
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onInputKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  inputValue,
  onInputChange,
  onSendMessage,
  onInputKeyPress,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  return (
    <div className="flex w-full items-end space-x-3">
      <Textarea
        ref={textareaRef}
        placeholder="Ask anything..."
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onInputKeyPress}
        className="flex-1 min-h-[48px] max-h-[120px] text-base glass bg-white/90 focus-visible:ring-indigo-500 border-gray-300/70 shadow-sm hover:shadow-md transition-shadow resize-none"
        disabled={isLoading}
        rows={1}
      />
      <Button 
        onClick={onSendMessage} 
        disabled={isLoading || !inputValue.trim()} 
        className="h-12 w-12 p-0 gradient-primary hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95"
      >
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
}
