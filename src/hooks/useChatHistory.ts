
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cacheManager, CACHE_KEYS } from '@/utils/cache';

interface ChatMessage {
  id: string;
  content: string;
  is_bot: boolean;
  context?: string;
  created_at: string;
}

export function useChatHistory(courseId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && courseId) {
      fetchChatHistory();
    }
  }, [user, courseId]);

  const fetchChatHistory = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.CHAT_HISTORY(courseId);
    
    // Try cache first
    if (!forceRefresh) {
      const cachedMessages = cacheManager.get<ChatMessage[]>(cacheKey);
      if (cachedMessages) {
        console.log('📦 Loading chat history from cache');
        setMessages(cachedMessages);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('🔄 Fetching chat history from database');
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const historyData = data || [];
      setMessages(historyData);
      
      // Cache for 5 minutes
      cacheManager.set(cacheKey, historyData, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async (content: string, isBot: boolean, context?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          course_id: courseId,
          content,
          is_bot: isBot,
          context,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setMessages(prev => [...prev, data]);
      
      // Invalidate cache so fresh data is fetched next time
      const cacheKey = CACHE_KEYS.CHAT_HISTORY(courseId);
      cacheManager.delete(cacheKey);
      
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    addMessage,
    refreshHistory: () => fetchChatHistory(true),
  };
}
