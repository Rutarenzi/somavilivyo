
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  callback: (payload: any) => void;
}

interface ActiveSubscription {
  channel: any;
  subscribers: Set<string>;
  config: SubscriptionConfig;
}

// Global subscription registry to prevent duplicates
const globalSubscriptions = new Map<string, ActiveSubscription>();

export const useRealtimeManager = () => {
  const { user } = useAuth();
  const subscribersRef = useRef<Set<string>>(new Set());

  const subscribe = useCallback((
    subscriberId: string,
    config: SubscriptionConfig
  ) => {
    if (!user) return () => {};

    const subscriptionKey = `${config.table}-${config.filter || 'all'}-${config.event || '*'}`;
    
    // Add this subscriber to our local tracking
    subscribersRef.current.add(subscriberId);

    if (globalSubscriptions.has(subscriptionKey)) {
      // Subscription already exists, just add our callback
      const existing = globalSubscriptions.get(subscriptionKey)!;
      existing.subscribers.add(subscriberId);
      
      // Store the original callback for this subscriber
      const originalCallback = existing.config.callback;
      existing.config.callback = (payload: any) => {
        originalCallback(payload);
        config.callback(payload);
      };

      console.log(`🔄 Reusing existing subscription for ${subscriptionKey}, subscribers: ${existing.subscribers.size}`);
      
      return () => unsubscribe(subscriberId, subscriptionKey);
    }

    // Create new subscription
    console.log(`🔔 Creating new real-time subscription for ${subscriptionKey}`);
    
    const channelName = `realtime-${subscriptionKey}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Configure the subscription with the correct syntax
    const subscriptionChannel = channel.on(
      'postgres_changes' as any,
      {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
        ...(config.filter && { filter: config.filter })
      } as any,
      config.callback
    );

    // Subscribe to the channel
    subscriptionChannel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to ${subscriptionKey}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Subscription error for ${subscriptionKey}`);
      }
    });

    // Store the subscription
    globalSubscriptions.set(subscriptionKey, {
      channel: subscriptionChannel,
      subscribers: new Set([subscriberId]),
      config
    });

    return () => unsubscribe(subscriberId, subscriptionKey);
  }, [user]);

  const unsubscribe = useCallback((subscriberId: string, subscriptionKey: string) => {
    const subscription = globalSubscriptions.get(subscriptionKey);
    if (!subscription) return;

    subscription.subscribers.delete(subscriberId);
    subscribersRef.current.delete(subscriberId);

    console.log(`🔌 Unsubscribing ${subscriberId} from ${subscriptionKey}, remaining: ${subscription.subscribers.size}`);

    // If no more subscribers, clean up the subscription
    if (subscription.subscribers.size === 0) {
      console.log(`🗑️ Cleaning up subscription ${subscriptionKey} - no more subscribers`);
      supabase.removeChannel(subscription.channel);
      globalSubscriptions.delete(subscriptionKey);
    }
  }, []);

  const cleanup = useCallback(() => {
    // Clean up all subscriptions for this component
    subscribersRef.current.forEach(subscriberId => {
      globalSubscriptions.forEach((subscription, key) => {
        if (subscription.subscribers.has(subscriberId)) {
          unsubscribe(subscriberId, key);
        }
      });
    });
    subscribersRef.current.clear();
  }, [unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { subscribe, cleanup };
};
