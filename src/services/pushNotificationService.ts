import { supabase } from '../lib/supabase';

// VAPID public key - hardcoded fallback for production
const VAPID_PUBLIC_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY) || 
  'BN3eWOKR9U-Sr7L9gYfGZx-ksptccgigpxKHwwWrZpWvPubAyQ8boWVWKwbdg0Vtg6v828-7SspL4_e3ln8sW6w';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;

  // Check if push notifications are supported
  isSupported(): boolean {
    return typeof window !== 'undefined' &&
           'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return typeof window !== 'undefined' && Notification.permission === 'granted';
  }

  // Check if notifications are blocked
  isBlocked(): boolean {
    return typeof window !== 'undefined' && Notification.permission === 'denied';
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined') return 'default';
    return Notification.permission;
  }

  // Initialize service worker and audio
  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready (with timeout)
      const timeoutPromise = new Promise<void>((resolve) => 
        setTimeout(() => resolve(), 3000)
      );
      
      await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);

      // Preload notification sound in background
      this.preloadSound().catch(() => {});

      // Listen for messages from service worker
      this.setupMessageListener();

      // Check for existing subscription
      try {
        this.subscription = await this.registration.pushManager.getSubscription();
      } catch (e) {
        console.warn('Could not get push subscription:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Preload notification sound
  private async preloadSound(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      this.audioContext = new AudioContextClass();
      const response = await fetch('/sounds/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      this.notificationSound = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Failed to preload notification sound:', error);
    }
  }

  // Play notification sound
  async playSound(): Promise<void> {
    if (!this.audioContext || !this.notificationSound) {
      // Fallback to HTML5 Audio
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        await audio.play();
      } catch (e) {
        console.warn('Failed to play notification sound:', e);
      }
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = this.notificationSound;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Setup listener for service worker messages
  private setupMessageListener(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'PLAY_NOTIFICATION_SOUND') {
        this.playSound();
      }
      if (event.data.type === 'NOTIFICATION_CLICKED') {
        const url = event.data.url;
        if (url && url !== '/') {
          window.location.href = url;
        }
      }
    });
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.subscribe();
    }

    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID public key not configured - push disabled');
      return null;
    }

    try {
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      console.log('Push subscription:', this.subscription);

      // Save subscription to database
      await this.saveSubscription(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      await this.removeSubscription();
      this.subscription = null;
    }
  }

  // Save subscription to Supabase (using any to avoid type issues)
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const subscriptionData = subscription.toJSON();
    
    try {
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: session.user.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys?.p256dh,
          auth: subscriptionData.keys?.auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Failed to save push subscription:', error);
      }
    } catch (e) {
      console.warn('Could not save push subscription:', e);
    }
  }

  // Remove subscription from database
  private async removeSubscription(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('endpoint', this.subscription?.endpoint);

      if (error) {
        console.error('Failed to remove push subscription:', error);
      }
    } catch (e) {
      console.warn('Could not remove push subscription:', e);
    }
  }

  // Show local notification
  async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled');
      return;
    }

    // Play sound
    await this.playSound();

    // Update badge
    await this.updateBadge();

    // Show notification
    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options
      });
    }
  }

  // Update app badge count
  async updateBadge(count?: number): Promise<void> {
    if (!('setAppBadge' in navigator)) return;

    try {
      if (count === undefined) {
        // Fetch unread count from database
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { count: unreadCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_read', false);

        count = unreadCount || 0;
      }

      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }

      // Also update via service worker
      if (this.registration?.active) {
        this.registration.active.postMessage({
          type: 'UPDATE_BADGE',
          count
        });
      }
    } catch (error) {
      console.warn('Failed to update badge:', error);
    }
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.warn('Failed to clear badge:', error);
      }
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get subscription status
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) return null;
    return this.registration.pushManager.getSubscription();
  }

  // Check if can install as PWA
  canInstall(): boolean {
    return !!(window as any).deferredPrompt;
  }

  // Prompt PWA installation
  async promptInstall(): Promise<boolean> {
    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    (window as any).deferredPrompt = null;
    
    return outcome === 'accepted';
  }
}

export const pushNotificationService = new PushNotificationService();
