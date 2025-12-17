import { supabase } from '../lib/supabase';
import type { Notification, UserSettings } from '../types/database.types';

export const notificationsService = {
  // Get all notifications for current user
  async getAll(): Promise<Notification[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  // Get unread notifications
  async getUnread(): Promise<Notification[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Mark as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Subscribe to new notifications
  subscribeToNotifications(callback: (notification: Notification) => void) {
    return supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return null;

      return supabase
        .channel(`notifications:${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            callback(payload.new as Notification);
          }
        )
        .subscribe();
    });
  },

  // Create notification (for manual notification sending)
  async create(notification: {
    user_id: string;
    type: 'task_assigned' | 'task_due' | 'message' | 'document' | 'system';
    title: string;
    body?: string;
    link?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) throw error;
  },

  // Delete notification
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const settingsService = {
  // Get current user settings
  async get(): Promise<UserSettings | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update settings
  async update(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Upsert settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        ...settings
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update language
  async updateLanguage(language: 'PL' | 'TR' | 'NL'): Promise<void> {
    await this.update({ language });
  },

  // Toggle dark mode
  async toggleDarkMode(enabled: boolean): Promise<void> {
    await this.update({ dark_mode: enabled });
  },

  // Toggle compact mode
  async toggleCompactMode(enabled: boolean): Promise<void> {
    await this.update({ compact_mode: enabled });
  }
};
