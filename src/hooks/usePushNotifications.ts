import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types/database.types';

interface UsePushNotificationsReturn {
  // Status
  isSupported: boolean;
  isEnabled: boolean;
  isBlocked: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  
  // PWA Install
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  
  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  
  // Sound
  playSound: () => Promise<void>;
  
  // Badge
  unreadCount: number;
  updateBadge: (count?: number) => Promise<void>;
  clearBadge: () => Promise<void>;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false); // Start with false - don't block UI
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Check if supported
        const supported = pushNotificationService.isSupported();
        setIsSupported(supported);

        if (!supported) {
          return;
        }

        // Check if installed as PWA first (sync operation)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone);

        // Get current permission (sync)
        setPermission(pushNotificationService.getPermissionStatus());

        // Initialize service in background
        pushNotificationService.init().then(async () => {
          // Check if subscribed
          const subscription = await pushNotificationService.getSubscription();
          setIsSubscribed(!!subscription);
        }).catch(console.warn);

        // Fetch initial unread count in background
        fetchUnreadCount().catch(console.warn);

      } catch (err: any) {
        console.error('Failed to initialize push notifications:', err);
        setError(err.message);
      }
    };

    init();

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Subscribe to realtime notification changes
  useEffect(() => {
    let channel: any;

    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      channel = supabase
        .channel(`notifications-badge:${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          async (payload) => {
            // Update badge count
            await fetchUnreadCount();
            
            // Play sound and show notification for new notifications
            if (payload.eventType === 'INSERT') {
              const notification = payload.new as Notification;
              
              // Only show if notifications are enabled
              if (pushNotificationService.isEnabled()) {
                await pushNotificationService.showLocalNotification(
                  notification.title,
                  {
                    body: notification.body || '',
                    tag: notification.id,
                    data: { url: notification.link ? `/?page=${notification.link}` : '/' }
                  }
                );
              } else {
                // At least play sound
                await pushNotificationService.playSound();
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);

      const newCount = count || 0;
      setUnreadCount(newCount);
      
      // Update badge
      await pushNotificationService.updateBadge(newCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      setLoading(true);
      const perm = await pushNotificationService.requestPermission();
      setPermission(perm);
      
      if (perm === 'granted') {
        const subscription = await pushNotificationService.getSubscription();
        setIsSubscribed(!!subscription);
      }
      
      return perm;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to push
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    const result = await pushNotificationService.promptInstall();
    if (result) {
      setIsInstalled(true);
      setCanInstall(false);
    }
    return result;
  }, []);

  // Play sound
  const playSound = useCallback(async (): Promise<void> => {
    await pushNotificationService.playSound();
  }, []);

  // Update badge
  const updateBadge = useCallback(async (count?: number): Promise<void> => {
    await pushNotificationService.updateBadge(count);
    if (count !== undefined) {
      setUnreadCount(count);
    }
  }, []);

  // Clear badge
  const clearBadge = useCallback(async (): Promise<void> => {
    await pushNotificationService.clearBadge();
    setUnreadCount(0);
  }, []);

  return {
    isSupported,
    isEnabled: permission === 'granted',
    isBlocked: permission === 'denied',
    permission,
    isSubscribed,
    canInstall,
    isInstalled,
    promptInstall,
    requestPermission,
    subscribe,
    unsubscribe,
    playSound,
    unreadCount,
    updateBadge,
    clearBadge,
    loading,
    error
  };
};
