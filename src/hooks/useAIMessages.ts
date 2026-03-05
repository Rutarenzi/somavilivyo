import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionManager } from '@/utils/subscriptionManager';

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  quiz_data?: any;
  created_at: string;
  updated_at: string;
  edited: boolean;
  order_index: number;
}

export function useAIMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!user || !conversationId) {
      console.log('fetchMessages: Missing user or conversationId', { user: !!user, conversationId });
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching messages for conversation:', conversationId);
      
      // Use direct fetch to properly pass query parameters
      const response = await fetch(
        `https://nhxbezsignftahfzljos.supabase.co/functions/v1/ai-message-manager?conversation_id=${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeGJlenNpZ25mdGFoZnpsam9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTUwOTUsImV4cCI6MjA2MzkzMTA5NX0.B3ZoUwFq4P1QzxngAOdTu1n-3iZtIQ61RI04BgEiGj0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Fetched messages:', data);
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  const addMessage = async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    quiz_data?: any
  ): Promise<AIMessage | null> => {
    if (!user || !conversationId) return null;

    try {
      const orderIndex = messages.length;
      const { data, error } = await supabase.functions.invoke('ai-message-manager', {
        method: 'POST',
        body: {
          conversation_id: conversationId,
          role,
          content,
          quiz_data,
          order_index: orderIndex
        }
      });

      if (error) throw error;

      const newMessage = data as AIMessage;
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error adding message:', err);
      setError(err instanceof Error ? err.message : 'Failed to add message');
      return null;
    }
  };

  const updateMessage = async (messageId: string, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke(`ai-message-manager/${messageId}`, {
        method: 'PUT',
        body: { content }
      });

      if (error) throw error;

      const updatedMessage = data as AIMessage;
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );
      return true;
    } catch (err) {
      console.error('Error updating message:', err);
      setError(err instanceof Error ? err.message : 'Failed to update message');
      return false;
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke(`ai-message-manager/${messageId}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    console.log('useAIMessages effect triggered:', { conversationId, userId: user?.id });
    fetchMessages();
  }, [conversationId, user, fetchMessages]);

  // Set up real-time subscription for message updates with proper cleanup
  useEffect(() => {
    if (!user || !conversationId) return;

    const channelName = `ai-messages-${conversationId}-${user.id}`;
    
    const unsubscribe = subscriptionManager.subscribe(
      channelName,
      {
        event: '*',
        schema: 'public',
        table: 'ai_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload: any) => {
        console.log('Message update:', payload);
        if (payload.eventType === 'INSERT') {
          setMessages(prev => {
            const newMessage = payload.new as AIMessage;
            if (prev.find(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage].sort((a, b) => a.order_index - b.order_index);
          });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => 
            prev.map(msg => msg.id === payload.new.id ? payload.new as AIMessage : msg)
          );
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      }
    );

    return unsubscribe;
  }, [user, conversationId]);

  return {
    messages,
    loading,
    error,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    refreshMessages: fetchMessages
  };
}