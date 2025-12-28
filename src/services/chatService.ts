import { supabase } from '../lib/supabase';
import type { ChatChannel, ChatMessage, InsertTables } from '../types/database.types';
import { notificationsService } from './notificationsService';

export const chatService = {
  // ============ CHANNELS ============

  // Get all channels where current user is a member
  async getChannels(): Promise<ChatChannel[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // First get channel IDs where user is a member
    const { data: memberChannels, error: memberError } = await supabase
      .from('chat_channel_members')
      .select('channel_id')
      .eq('user_id', session.user.id);

    if (memberError) throw memberError;
    
    const channelIds = memberChannels?.map(m => m.channel_id) || [];
    
    if (channelIds.length === 0) {
      return [];
    }

    // Then get full channel data for those channels
    const { data, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:chat_channel_members(
          user:profiles(id, name, avatar_url, status)
        )
      `)
      .in('id', channelIds)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create new channel and add all organization members
  async createChannel(channel: { name: string; type: 'group' | 'dm'; color?: string; memberIds?: string[] }): Promise<ChatChannel> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    // Create the channel
    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        name: channel.name,
        type: channel.type,
        color: channel.color,
        organization_id: profile.organization_id,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Determine members to add
    let memberIds: string[] = [];
    
    if (channel.memberIds && channel.memberIds.length > 0) {
      // Use specified members (always include creator)
      memberIds = [...new Set([session.user.id, ...channel.memberIds])];
    } else if (channel.type === 'group') {
      // For groups without specified members, add ALL organization members
      const { data: orgMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id);
      
      memberIds = orgMembers?.map(m => m.id) || [session.user.id];
    } else {
      // For DMs, just add creator (other member added via getOrCreateDM)
      memberIds = [session.user.id];
    }

    // Add all members to the channel
    const memberRecords = memberIds.map(userId => ({
      channel_id: data.id,
      user_id: userId
    }));

    const { error: memberError } = await supabase
      .from('chat_channel_members')
      .insert(memberRecords);

    if (memberError) {
      console.error('Error adding channel members:', memberError);
      // Don't throw - channel was created, members can be added later
    }

    console.log(`[chatService] Created channel "${channel.name}" with ${memberIds.length} members`);
    return data;
  },

  // Get or create DM channel
  async getOrCreateDM(otherUserId: string): Promise<ChatChannel> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Try to find existing DM
    const { data: existingChannels } = await supabase
      .from('chat_channels')
      .select('*, members:chat_channel_members(user_id)')
      .eq('type', 'dm') as any;

    const existingDM = existingChannels?.find(channel => {
      const memberIds = channel.members.map((m: any) => m.user_id);
      return memberIds.includes(session.user.id) && memberIds.includes(otherUserId) && memberIds.length === 2;
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
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add both users as members
    await supabase.from('chat_channel_members').insert([
      { channel_id: channel.id, user_id: session.user.id },
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: session.user.id,
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

    // Send notifications to other channel members
    this.notifyChannelMembers(channelId, session.user.id, message).catch(console.error);

    return message;
  },

  // Notify all channel members about new message (except sender)
  async notifyChannelMembers(channelId: string, senderId: string, message: ChatMessage): Promise<void> {
    try {
      // Get channel info
      const { data: channel } = await supabase
        .from('chat_channels')
        .select('name, type')
        .eq('id', channelId)
        .single();

      // Get sender info
      const { data: sender } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', senderId)
        .single();

      // Get all channel members except sender
      const { data: members } = await supabase
        .from('chat_channel_members')
        .select('user_id')
        .eq('channel_id', channelId)
        .neq('user_id', senderId);

      if (!members || members.length === 0) return;

      const senderName = sender?.name || 'Ktoś';
      const channelName = channel?.type === 'dm' ? senderName : (channel?.name || 'Chat');
      const messagePreview = message.text.length > 50 
        ? message.text.substring(0, 50) + '...' 
        : message.text;

      // Create notifications for all members
      const notifications = members.map(member => ({
        user_id: member.user_id,
        type: 'message' as const,
        title: channel?.type === 'dm' 
          ? `Nowa wiadomość od ${senderName}`
          : `${senderName} w ${channelName}`,
        body: messagePreview,
        link: 'chat'
      }));

      // Insert all notifications at once
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating chat notifications:', error);
      } else {
        console.log(`[Chat] Sent notifications to ${members.length} members`);
      }
    } catch (error) {
      console.error('Error notifying channel members:', error);
    }
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

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
  },

  // ============ CHANNEL MEMBERS ============

  // Get channel members
  async getChannelMembers(channelId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_channel_members')
      .select(`
        user_id,
        joined_at,
        user:profiles(id, name, avatar_url, status)
      `)
      .eq('channel_id', channelId);

    if (error) throw error;
    return data || [];
  },

  // Add member to channel
  async addMemberToChannel(channelId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_channel_members')
      .insert({ channel_id: channelId, user_id: userId });

    if (error && !error.message.includes('duplicate')) {
      throw error;
    }
  },

  // Remove member from channel
  async removeMemberFromChannel(channelId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get organization members (for adding to channels)
  async getOrganizationMembers(): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, status, role')
      .eq('organization_id', profile.organization_id);

    if (error) throw error;
    return data || [];
  },

  // Subscribe to new channels (for real-time channel updates)
  subscribeToChannels(organizationId: string, callback: (channel: ChatChannel) => void) {
    return supabase
      .channel('chat-channels')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_channels',
          filter: `organization_id=eq.${organizationId}`
        },
        async (payload) => {
          callback(payload.new as ChatChannel);
        }
      )
      .subscribe();
  },

  // Subscribe to channel membership changes
  subscribeToMemberships(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`memberships:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_channel_members',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};
