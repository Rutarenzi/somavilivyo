import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subscriptionManager } from '@/utils/subscriptionManager';

interface BackgroundGenerationSession {
  id: string;
  user_id: string;
  status: string;
  current_phase: number;
  total_phases: number;
  form_data: any;
  phases_data: any;
  created_at: string;
  last_activity: string;
  error_message?: string;
}

export const useBackgroundGeneration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSessions, setActiveSessions] = useState<BackgroundGenerationSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Check for active background sessions
  const checkActiveSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data: sessions, error } = await supabase
        .from('generation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'background_processing'])
        .order('created_at', { ascending: false });

      if (!error && sessions) {
        setActiveSessions(sessions);
      }
    } catch (error) {
      console.error('Error checking active sessions:', error);
    }
  }, [user]);

  // Start background generation for a session
  const startBackgroundGeneration = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('background-course-generation', {
        body: {
          sessionId,
          action: 'start'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Background Generation Started",
        description: "Your course will continue generating in the background. You can navigate away safely.",
      });

      await checkActiveSessions();
      return data;
    } catch (error) {
      console.error('Error starting background generation:', error);
      toast({
        title: "Background Generation Failed",
        description: error instanceof Error ? error.message : "Failed to start background generation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [checkActiveSessions, toast]);

  // Resume progress interface for a background session
  const resumeProgressInterface = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('background-course-generation', {
        body: {
          sessionId,
          action: 'check_status'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error resuming progress interface:', error);
      toast({
        title: "Resume Failed",
        description: error instanceof Error ? error.message : "Failed to resume progress interface",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Cancel background generation
  const cancelBackgroundGeneration = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('generation_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          error_message: 'Cancelled by user'
        })
        .eq('id', sessionId);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Generation Cancelled",
        description: "Background course generation has been stopped.",
      });

      await checkActiveSessions();
    } catch (error) {
      console.error('Error cancelling background generation:', error);
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel generation",
        variant: "destructive",
      });
    }
  }, [checkActiveSessions, toast]);

  // Set up real-time subscription for session updates with centralized manager
  useEffect(() => {
    if (!user) return;

    checkActiveSessions();

    const channelName = `background-generation-${user.id}`;
    
    const unsubscribe = subscriptionManager.subscribe(
      channelName,
      {
        event: '*',
        schema: 'public',
        table: 'generation_sessions',
        filter: `user_id=eq.${user.id}`
      },
      (payload: any) => {
        console.log('Background generation update:', payload);
        
        if (payload.eventType === 'UPDATE') {
          const session = payload.new as BackgroundGenerationSession;
          
          // Show toast for status changes
          if (session.status === 'completed') {
            toast({
              title: "Course Generation Complete!",
              description: `Your course "${session.form_data?.skill || 'course'}" is ready.`,
            });
          } else if (session.status === 'failed') {
            toast({
              title: "Generation Failed",
              description: session.error_message || "Course generation encountered an error.",
              variant: "destructive",
            });
          }
        }
        
        checkActiveSessions();
      }
    );

    return unsubscribe;
  }, [user, checkActiveSessions, toast]);

  return {
    activeSessions,
    loading,
    startBackgroundGeneration,
    resumeProgressInterface,
    cancelBackgroundGeneration,
    checkActiveSessions
  };
};