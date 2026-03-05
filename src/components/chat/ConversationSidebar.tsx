import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MessageSquare, User, Settings, LogOut } from 'lucide-react';
import { useAIConversations, AIConversation } from '@/hooks/useAIConversations';
import { ConversationListItem } from './ConversationListItem';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  selectedConversationId: string | null;
  onConversationSelect: (conversation: AIConversation) => void;
  onNewChat: () => void;
  className?: string;
}

export function ConversationSidebar({
  selectedConversationId,
  onConversationSelect,
  onNewChat,
  className
}: ConversationSidebarProps) {
  const { conversations, loading, createConversation, deleteConversation } = useAIConversations();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      onNewChat();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId);
    if (success && selectedConversationId === conversationId) {
      onNewChat();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {isCreating ? 'Creating...' : 'New Chat'}
        </Button>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Loading conversations...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
              {!searchQuery && (
                <div className="text-xs text-muted-foreground mt-1">
                  Start a new chat to begin
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  onSelect={() => onConversationSelect(conversation)}
                  onDelete={() => handleDeleteConversation(conversation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {user?.email || 'User'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 justify-start"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}