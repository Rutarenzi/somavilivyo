import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseOptimizedSubscriptionsProps {
  userId: string;
  onNotificationUpdate?: (notification: any) => void;
  onCourseUpdate?: (course: any) => void;
  onProgressUpdate?: (progress: any) => void;
}

export const useOptimizedSubscriptions = ({
  userId,
  onNotificationUpdate,
  onCourseUpdate,
  onProgressUpdate,
}: UseOptimizedSubscriptionsProps) => {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup function with proper error handling
  const cleanup = useCallback(() => {
    console.log('[useOptimizedSubscriptions] Starting cleanup of subscriptions');
    
    // Clear any pending cleanup timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = undefined;
    }

    // Unsubscribe from all channels
    channelsRef.current.forEach((channel, channelName) => {
      try {
        console.log(`[useOptimizedSubscriptions] Cleaning up channel: ${channelName}`);
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn(`[useOptimizedSubscriptions] Error removing channel ${channelName}:`, error);
      }
    });

    // Clear the channels map
    channelsRef.current.clear();
  }, []);

  // Optimized subscription setup with error handling and deduplication
  const setupSubscriptions = useCallback(() => {
    if (!userId) {
      console.log('[useOptimizedSubscriptions] No userId provided, skipping subscription setup');
      return;
    }

    // Clear existing subscriptions first
    cleanup();

    try {
      // Notifications subscription with deduplication
      const notificationChannelName = `user_notifications-user_id=eq.${userId}`;
      if (!channelsRef.current.has(notificationChannelName)) {
        console.log(`[useOptimizedSubscriptions] Setting up notifications for user: ${userId}`);
        
        const notificationChannel = supabase
          .channel(notificationChannelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'user_notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[useOptimizedSubscriptions] New notification:', payload);
              onNotificationUpdate?.(payload.new);
            }
          )
          .subscribe((status) => {
            console.log(`[useOptimizedSubscriptions] Notification subscription status: ${status}`);
          });

        channelsRef.current.set(notificationChannelName, notificationChannel);
      }

      // Course updates subscription
      const courseChannelName = `courses-user_id=eq.${userId}`;
      if (!channelsRef.current.has(courseChannelName) && onCourseUpdate) {
        console.log(`[useOptimizedSubscriptions] Setting up course updates for user: ${userId}`);
        
        const courseChannel = supabase
          .channel(courseChannelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'courses',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[useOptimizedSubscriptions] Course update:', payload);
              onCourseUpdate?.(payload);
            }
          )
          .subscribe((status) => {
            console.log(`[useOptimizedSubscriptions] Course subscription status: ${status}`);
          });

        channelsRef.current.set(courseChannelName, courseChannel);
      }

      // Progress updates subscription
      const progressChannelName = `user_micro_progress-user_id=eq.${userId}`;
      if (!channelsRef.current.has(progressChannelName) && onProgressUpdate) {
        console.log(`[useOptimizedSubscriptions] Setting up progress updates for user: ${userId}`);
        
        const progressChannel = supabase
          .channel(progressChannelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_micro_progress',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[useOptimizedSubscriptions] Progress update:', payload);
              onProgressUpdate?.(payload);
            }
          )
          .subscribe((status) => {
            console.log(`[useOptimizedSubscriptions] Progress subscription status: ${status}`);
          });

        channelsRef.current.set(progressChannelName, progressChannel);
      }

    } catch (error) {
      console.error('[useOptimizedSubscriptions] Error setting up subscriptions:', error);
    }
  }, [userId, onNotificationUpdate, onCourseUpdate, onProgressUpdate, cleanup]);

  // Effect to manage subscription lifecycle
  useEffect(() => {
    setupSubscriptions();

    // Cleanup on unmount or dependency change
    return () => {
      // Debounce cleanup to prevent rapid subscription/unsubscription cycles
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanup();
      }, 100);
    };
  }, [setupSubscriptions, cleanup]);

  // Manual reconnection function for when connection is lost
  const reconnect = useCallback(() => {
    console.log('[useOptimizedSubscriptions] Manual reconnection requested');
    setupSubscriptions();
  }, [setupSubscriptions]);

  return {
    reconnect,
    cleanup,
    activeChannels: Array.from(channelsRef.current.keys()),
  };
};