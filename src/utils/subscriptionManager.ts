// Centralized subscription manager to prevent multiple subscriptions
class SubscriptionManager {
  private channels = new Map<string, any>();
  private subscriptionCallbacks = new Map<string, Set<Function>>();

  subscribe(channelName: string, config: any, callback: Function) {
    // If channel doesn't exist, create it
    if (!this.channels.has(channelName)) {
      console.log(`Creating new channel: ${channelName}`);
      const channel = supabase.channel(channelName);
      
      // Set up the actual Supabase subscription
      channel.on('postgres_changes', config, (payload: any) => {
        // Call all registered callbacks for this channel
        const callbacks = this.subscriptionCallbacks.get(channelName);
        if (callbacks) {
          callbacks.forEach(cb => cb(payload));
        }
      }).subscribe();

      this.channels.set(channelName, channel);
      this.subscriptionCallbacks.set(channelName, new Set());
    }

    // Add callback to this channel
    const callbacks = this.subscriptionCallbacks.get(channelName);
    if (callbacks) {
      callbacks.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptionCallbacks.get(channelName);
      if (callbacks) {
        callbacks.delete(callback);
        
        // If no more callbacks, clean up the channel
        if (callbacks.size === 0) {
          console.log(`Cleaning up channel: ${channelName}`);
          const channel = this.channels.get(channelName);
          if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(channelName);
            this.subscriptionCallbacks.delete(channelName);
          }
        }
      }
    };
  }

  cleanup() {
    console.log('Cleaning up all subscriptions');
    this.channels.forEach((channel, channelName) => {
      console.log(`Removing channel: ${channelName}`);
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscriptionCallbacks.clear();
  }
}

import { supabase } from '@/integrations/supabase/client';

export const subscriptionManager = new SubscriptionManager();