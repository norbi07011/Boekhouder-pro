import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import type { ChatChannel, ChatMessage } from '../types/database.types';

interface UseChatReturn {
  channels: ChatChannel[];
  activeChannel: ChatChannel | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  setActiveChannel: (channel: ChatChannel) => void;
  sendMessage: (text: string, attachments?: any[]) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createChannel: (name: string, type: 'group' | 'dm', color?: string) => Promise<ChatChannel>;
  openDM: (userId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
}

export const useChat = (): UseChatReturn => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannelState] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  
  const subscriptionRef = useRef<any>(null);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await chatService.getChannels();
        setChannels(data);
        if (data.length > 0 && !activeChannel) {
          setActiveChannelState(data[0]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await chatService.getMessages(activeChannel.id);
        setMessages(data);
        setMessageOffset(data.length);
        setHasMoreMessages(data.length >= 50);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = chatService.subscribeToMessages(
      activeChannel.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [activeChannel?.id]);

  const setActiveChannel = useCallback((channel: ChatChannel) => {
    setActiveChannelState(channel);
    setMessages([]);
    setMessageOffset(0);
    setHasMoreMessages(true);
  }, []);

  const sendMessage = async (text: string, attachments?: any[]) => {
    if (!activeChannel) throw new Error('No active channel');
    
    const message = await chatService.sendMessage(activeChannel.id, text, attachments);
    // Message will be added via realtime subscription
  };

  const editMessage = async (messageId: string, text: string) => {
    await chatService.editMessage(messageId, text);
    setMessages(prev => 
      prev.map(m => m.id === messageId ? { ...m, text, is_edited: true } : m)
    );
  };

  const deleteMessage = async (messageId: string) => {
    await chatService.deleteMessage(messageId);
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const createChannel = async (name: string, type: 'group' | 'dm', color?: string) => {
    const channel = await chatService.createChannel({ name, type, color });
    setChannels(prev => [...prev, channel]);
    setActiveChannelState(channel);
    return channel;
  };

  const openDM = async (userId: string) => {
    const channel = await chatService.getOrCreateDM(userId);
    if (!channels.find(c => c.id === channel.id)) {
      setChannels(prev => [...prev, channel]);
    }
    setActiveChannelState(channel);
  };

  const loadMoreMessages = async () => {
    if (!activeChannel || !hasMoreMessages) return;

    try {
      const olderMessages = await chatService.getMessages(
        activeChannel.id,
        50,
        messageOffset
      );
      
      if (olderMessages.length < 50) {
        setHasMoreMessages(false);
      }
      
      setMessages(prev => [...olderMessages, ...prev]);
      setMessageOffset(prev => prev + olderMessages.length);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    channels,
    activeChannel,
    messages,
    loading,
    error,
    setActiveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    createChannel,
    openDM,
    loadMoreMessages,
    hasMoreMessages
  };
};
