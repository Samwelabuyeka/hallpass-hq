
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    unit_code: string | null;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from('notification_recipients')
        .select('*, notifications(*)', { count: 'exact' })
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data as Notification[]);
      
      // Calculate unread count
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);

    } catch (error: any) {
      toast({
        title: 'Error fetching notifications',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user!.id);

      if (error) throw error;

      // Optimistically update the UI
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error: any) {
      toast({
        title: 'Error updating notification',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
        const { error } = await supabase
            .from('notification_recipients')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

        if (error) throw error;

        // Optimistically update all
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

    } catch (error: any) {
        toast({
            title: 'Error marking all as read',
            description: error.message,
            variant: 'destructive',
        });
    }
  };

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
