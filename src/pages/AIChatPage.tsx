
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { EnhancedChatMessageItem } from '@/components/chat/EnhancedChatMessageItem';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageEditDialog } from '@/components/chat/MessageEditDialog';
import { useSimplifiedChatbot } from '@/hooks/useSimplifiedChatbot';
import { AIConversation } from '@/hooks/useAIConversations';
import { AIMessage } from '@/hooks/useAIMessages';
import { ResponseLengthPreference } from '@/hooks/useChatbot';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Settings2 } from 'lucide-react';

export default function AIChatPage() {
  const {
    conversations,
    currentConversation,
    startNewConversation,
    loadConversation,
    messages,
    isLoading,
    sendMessage,
    editMessage,
    copyMessage,
    reactToMessage,
    isAuthenticated
  } = useSimplifiedChatbot();

  const [inputValue, setInputValue] = useState('');
  const [responseLength, setResponseLength] = useState<ResponseLengthPreference>('detailed');
  const [editingMessage, setEditingMessage] = useState<AIMessage | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  // Recalculate conversation stats on mount to fix message count issues
  useEffect(() => {
    if (isAuthenticated) {
      supabase.functions.invoke('recalculate-conversation-stats')
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to recalculate conversation stats:', error);
          } else {
            console.log('Conversation stats recalculated:', data);
          }
        });
    }
  }, [isAuthenticated]);

  const handleSend = async () => {
    if (inputValue.trim()) {
      await sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    setInputValue('');
    setCompletedQuizzes(new Set());
  };

  const handleConversationSelect = (conversation: AIConversation) => {
    loadConversation(conversation);
    setInputValue('');
    setCompletedQuizzes(new Set());
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    await editMessage(messageId, newContent);
    setEditingMessage(null);
  };

  const handleQuizComplete = (messageId: string) => {
    setCompletedQuizzes(prev => new Set([...prev, messageId]));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Please sign in to access the AI Chat.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Sidebar - Conversations */}
      <ConversationSidebar
        selectedConversationId={currentConversation?.id || null}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        className="w-80 flex-shrink-0 hidden md:flex"
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h1 className="font-semibold text-lg">
                {currentConversation?.title || 'New Chat'}
              </h1>
              {messages.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <Select value={responseLength} onValueChange={(value) => setResponseLength(value as ResponseLengthPreference)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask me anything! I can help with questions, provide explanations, 
                  assist with tasks, or just have a friendly conversation.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <EnhancedChatMessageItem
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                  onCopyMessage={copyMessage}
                  onReactToMessage={reactToMessage}
                  onEditMessage={message.role === 'user' ? (messageId, content) => setEditingMessage({ ...message, content }) : undefined}
                  completedQuizzes={completedQuizzes}
                  onQuizComplete={handleQuizComplete}
                />
              ))
            )}
            
            {isLoading && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground animate-pulse" />
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendMessage={handleSend}
              onInputKeyPress={handleKeyPress}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Message Edit Dialog */}
      <MessageEditDialog
        message={editingMessage}
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleEditMessage}
      />
    </div>
  );
}

