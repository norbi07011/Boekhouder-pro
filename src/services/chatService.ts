import { supabase } from '../lib/supabase';
import type { ChatChannel, ChatMessage, InsertTables } from '../types/database.types';

export const chatService = {
  // ============ CHANNELS ============

  // Get all channels for organization
  async getChannels(): Promise<ChatChannel[]> {
    const { data, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:chat_channel_members(
          user:profiles(id, name, avatar_url, status)
        )
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create new channel
  async createChannel(channel: { name: string; type: 'group' | 'dm'; color?: string }): Promise<ChatChannel> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        ...channel,
        organization_id: profile.organization_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as member
    await supabase
      .from('chat_channel_members')
      .insert({
        channel_id: data.id,
        user_id: user.id
      });

    return data;
  },

  // Get or create DM channel
  async getOrCreateDM(otherUserId: string): Promise<ChatChannel> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Try to find existing DM
    const { data: existingChannels } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:chat_channel_members(user_id)
      `)
      .eq('type', 'dm');

    const existingDM = existingChannels?.find(channel => {
      const memberIds = channel.members.map((m: any) => m.user_id);
      return memberIds.includes(user.id) && memberIds.includes(otherUserId) && memberIds.length === 2;
    });

    if (existingDM) return existingDM;

    // Create new DM
    const { data: otherUser } = await supabase
      .from('profiles')
      .select('name, organization_id')
      .eq('id', otherUserId)
      .single();

    if (!otherUser) throw new Error('User not found');

    const { data: channel, error } = await supabase
      .from('chat_channels')
      .insert({
        name: `DM`,
        type: 'dm',
        organization_id: otherUser.organization_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add both users as members
    await supabase.from('chat_channel_members').insert([
      { channel_id: channel.id, user_id: user.id },
      { channel_id: channel.id, user_id: otherUserId }
    ]);

    return channel;
  },

  // ============ MESSAGES ============

  // Get messages for channel
  async getMessages(channelId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:profiles(id, name, avatar_url),
        attachments:chat_message_attachments(*)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).reverse();
  },

  // Send message
  async sendMessage(channelId: string, text: string, attachments?: any[]): Promise<ChatMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        text
      })
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Handle attachments if any
    if (attachments && attachments.length > 0) {
      const attachmentRecords = attachments.map(att => ({
        message_id: message.id,
        type: att.type,
        name: att.name,
        file_path: att.file_path,
        file_size: att.file_size
      }));

      await supabase
        .from('chat_message_attachments')
        .insert(attachmentRecords);
    }

    return message;
  },

  // Edit message
  async editMessage(messageId: string, text: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ text, is_edited: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  // Upload chat attachment
  async uploadAttachment(channelId: string, file: File): Promise<{ path: string; url: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${channelId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return { path: fileName, url: data.publicUrl };
  },

  // ============ REALTIME ============

  // Subscribe to new messages in channel
  subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void) {
    return supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          // Fetch full message with user data
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              user:profiles(id, name, avatar_url),
              attachments:chat_message_attachments(*)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) callback(data);
        }
      )
      .subscribe();
  },

  // Subscribe to message updates (edits, deletes)
  subscribeToMessageUpdates(channelId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat-updates:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        callback
      )
      .subscribe();
  }
};
