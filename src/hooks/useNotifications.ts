
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionManager } from '@/utils/subscriptionManager';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const fetchNotifications = async () => {
    if (!user || !session) {
      console.log('No user or session, skipping notification fetch');
      return;
    }

    try {
      console.log('Fetching notifications for user:', user.id);
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Notifications fetched:', data?.length || 0);
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user || !session) {
      console.error('No user or session for marking notification as read');
      return;
    }

    try {
      console.log('Marking notification as read:', notificationId);
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      console.log('Notification marked as read successfully');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const removeNotification = async (notificationId: string) => {
    if (!user || !session) {
      console.error('No user or session for removing notification');
      return;
    }

    try {
      console.log('Removing notification:', notificationId);
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error removing notification:', error);
        throw error;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
      console.log('Notification removed successfully');
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !session) {
      console.error('No user or session for marking all notifications as read');
      return;
    }

    try {
      console.log('Marking all notifications as read for user:', user.id);
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      console.log('All notifications marked as read successfully');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user && session) {
      console.log('Setting up notifications for user:', user.id);
      fetchNotifications();

      // Subscribe to real-time notifications using subscription manager with cleanup
      const channelName = `user_notifications-user_id=eq.${user.id}-INSERT`;
      
      const unsubscribe = subscriptionManager.subscribe(
        channelName,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('New notification received:', payload.new);
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      );

      // Enhanced cleanup function with proper error handling
      return () => {
        try {
          console.log('[useNotifications] Cleaning up subscription for user:', user.id);
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        } catch (error) {
          console.warn('[useNotifications] Error during cleanup:', error);
        }
      };
    } else {
      console.log('No user or session, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user?.id, session?.access_token]); // Only depend on essential identifiers to prevent unnecessary re-subscriptions

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refetch: fetchNotifications
  };
};
