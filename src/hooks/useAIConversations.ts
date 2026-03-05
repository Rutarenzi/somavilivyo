import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionManager } from '@/utils/subscriptionManager';

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
}

export function useAIConversations() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Safe state updater that ensures state is always an array
  const safeSetConversations = (updater: (prev: AIConversation[]) => AIConversation[]) => {
    setConversations(prev => {
      try {
        // Ensure prev is always an array
        const safeState = Array.isArray(prev) ? prev : [];
        return updater(safeState);
      } catch (error) {
        console.error('[useAIConversations] Error updating conversations state:', error);
        return Array.isArray(prev) ? prev : [];
      }
    });
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching conversations for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('ai-conversation-manager', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Fetched conversations:', data);
      safeSetConversations(() => data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (title?: string): Promise<AIConversation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('ai-conversation-manager', {
        body: { title: title || 'New Conversation' }
      });

      if (error) throw error;
      
      const newConversation = data as AIConversation;
      safeSetConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  };

  const updateConversation = async (id: string, updates: Partial<AIConversation>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Updating conversation:', id, 'with:', updates);
      const { data, error } = await supabase.functions.invoke(`ai-conversation-manager/${id}`, {
        method: 'PUT',
        body: updates
      });

      if (error) throw error;

      const updatedConversation = data as AIConversation;
      console.log('Conversation updated successfully:', updatedConversation);
      
      // Immediately update local state to ensure UI sync
      safeSetConversations(prev => 
        prev.map(conv => conv.id === id ? updatedConversation : conv)
      );
      
      return true;
    } catch (err) {
      console.error('Error updating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update conversation');
      return false;
    }
  };

  const deleteConversation = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke(`ai-conversation-manager/${id}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      safeSetConversations(prev => prev.filter(conv => conv.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      return false;
    }
  };

  const getConversation = async (id: string): Promise<AIConversation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke(`ai-conversation-manager/${id}`);
      
      if (error) throw error;
      return data as AIConversation;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription for conversation updates with proper cleanup and error handling
  useEffect(() => {
    if (!user) return;

    const channelName = `ai-conversations-${user.id}`;
    
    const unsubscribe = subscriptionManager.subscribe(
      channelName,
      {
        event: '*',
        schema: 'public',
        table: 'ai_conversations',
        filter: `user_id=eq.${user.id}`
      },
      (payload: any) => {
        try {
          console.log('Conversation update:', payload);
          
          if (payload.eventType === 'INSERT') {
            safeSetConversations(prev => {
              // Prevent duplicates
              const exists = prev.find(conv => conv.id === payload.new.id);
              if (exists) return prev;
              return [payload.new as AIConversation, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            safeSetConversations(prev => 
              prev.map(conv => conv.id === payload.new.id ? payload.new as AIConversation : conv)
            );
          } else if (payload.eventType === 'DELETE') {
            safeSetConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
          }
        } catch (error) {
          console.error('[useAIConversations] Error handling real-time update:', error);
        }
      }
    );

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('[useAIConversations] Error during cleanup:', error);
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-subscriptions

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    getConversation,
    refreshConversations: fetchConversations
  };
}