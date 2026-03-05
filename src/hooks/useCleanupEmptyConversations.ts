import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCleanupEmptyConversations() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const cleanup = async () => {
      try {
        console.log('Running cleanup of empty conversations...');
        const { data, error } = await supabase.rpc('cleanup_empty_conversations');
        
        if (error) {
          console.error('Error cleaning up empty conversations:', error);
        } else {
          console.log('Cleaned up', data, 'empty conversations');
        }
      } catch (err) {
        console.error('Failed to cleanup empty conversations:', err);
      }
    };

    // Run cleanup on login
    cleanup();

    // Set up periodic cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}