
import React from 'react';
import { Card } from "@/components/ui/card";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  isBot: boolean;
  timestamp: Date;
  context?: string;
}

export function ChatMessage({ content, isBot, timestamp, context }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex gap-3 mb-4", isBot ? "justify-start" : "justify-end")}>
      {isBot && (
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 shadow-soft">
          <Bot className="h-4 w-4 text-accent-foreground" />
        </div>
      )}
      
      <div className={cn("max-w-[80%] space-y-1", isBot ? "text-left" : "text-right")}>
        {context && (
          <div className="text-xs text-muted-foreground italic bg-muted px-2 py-1 rounded-md">
            Selected: "{context}"
          </div>
        )}
        
        <Card className={cn(
          "p-3 shadow-soft transition-all duration-300",
          isBot 
            ? "bg-muted text-foreground hover:shadow-medium" 
            : "bg-accent text-accent-foreground hover:shadow-glow"
        )}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {content}
          </div>
        </Card>
        
        <div className="text-xs text-muted-foreground">
          {formatTime(timestamp)}
        </div>
      </div>
      
      {!isBot && (
        <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center flex-shrink-0 shadow-soft">
          <User className="h-4 w-4 text-background" />
        </div>
      )}
    </div>
  );
}
