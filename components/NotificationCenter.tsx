import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Clock, MessageSquare, CheckSquare, FileText, AlertCircle, Settings, Volume2 } from 'lucide-react';
import { notificationsService } from '../src/services/notificationsService';
import { Language } from '../types';
import { DICTIONARY } from '../constants';

// Simple notification sound player
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {
    // Ignore audio errors
  }
};

// Update badge count
const updateBadge = async (count: number) => {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (e) {}
  }
};

interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_due' | 'message' | 'document' | 'system';
  title: string;
  body?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  language: Language;
  onNavigate?: (view: string) => void;
}

const NOTIFICATION_ICONS = {
  task_assigned: CheckSquare,
  task_due: Clock,
  message: MessageSquare,
  document: FileText,
  system: AlertCircle,
};

const NOTIFICATION_COLORS = {
  task_assigned: 'bg-blue-500',
  task_due: 'bg-orange-500',
  message: 'bg-green-500',
  document: 'bg-purple-500',
  system: 'bg-slate-500',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ language, onNavigate }) => {
  const t = DICTIONARY[language];
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getAll();
      setNotifications(data as Notification[]);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      subscription = await notificationsService.subscribeToNotifications((newNotification) => {
        // Add new notification to list
        setNotifications(prev => [newNotification as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Play notification sound
        playNotificationSound();
        
        // Update app badge
        updateBadge(unreadCount + 1);

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          const browserNotif = new Notification(newNotification.title, {
            body: newNotification.body || '',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: newNotification.id,
            requireInteraction: newNotification.type === 'task_due',
            silent: false, // Allow sound
          });

          browserNotif.onclick = () => {
            window.focus();
            if (newNotification.link && onNavigate) {
              onNavigate(newNotification.link);
            }
            browserNotif.close();
          };

          // Play sound if enabled
          playNotificationSound();
        }
      });
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [onNavigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQwNP5bY6cR7Dgo/k9fr0H0HDj+Q1e7OfggMQI7V8M2ABw1Ajdfy0YEHC0GN2PLSgQoLQo7Z89SDCQ1Djtr00oMKDEON2vTUgwkMRI7b9dOECA1Ej9z11YQID0WQ3fXWhQgPRZHe99eGBxBGkuD32IcHEEeT4fjYiAcRR5Ti+dmJBxFIlOP52YoHEkiU4/nZigcSSJXk+tqLBxJJluT724wHE0mW5fvbjAcUSZfm+9yNBxRKl+b73Y0HFEqY5/vejgcVSpno/N+OBxVLmer84I8HFUuZ6v3gjwcWS5rr/eGQBxZMm+v+4ZAHFkyd7P7ikQcXTZ3s/uKRBxdNnu3/45IHF06f7f/jkgcYT5/u/+STBxhPoPD/5JMHGE+g8ADllAcZUKHxAOaUBxlQofEA5pQHGVCi8QDmlAcaUaLyAOeVBxpRo/MA55UHGlGj8wDnlQcaUaTzAOeVBxpRpPMA55UHG1Kl9ADolQcbUqX0AOiWBxtSpfQB6JYHHFOm9QHolgccU6b1AemWBxxTpvUB6ZYHHFOm9QHplgcdVKf2AuqXBx1Up/YC6pcHHVSn9gLqlwcdVKf2AuqXBx1Up/YC6pcHHlWo9wLrlwceVaj3A+uXBx5VqPcD65cHHlWo9wPrlwcfVqn4A+yYBx9WqfgD7JgHH1ap+APsmAcfVqn4A+yYBx9WqfgE7JgHH1aq+QTtmQcgV6r5BO2ZByBXqvkE7ZkHIFeq+QTtmQcgV6r5BO2ZByBYq/oF7poHIFir+gXumgcgWKv6Be6aByCXq/oF7poHIVms+wbvmgchWaz7Bu+aByFZrPsG75oHIVms+wbvmgchWaz7Bu+aByJarfwH8JsHIlqt/AfwmwciWq38B/CbByJarfwH8JsHIlqt/AfwmwcjW678CPGbByNbrvwI8ZsHI1uu/AjxmwcjW678CPGbByNbrvwI8ZsHJFyv/QnymwckXK/9CfKcByRcr/0J8pwHJFyv/QnynAckXK/9CfKcByVdsP4K850HJV2w/grznQclXbD+CvOdByVdsP4K850HJV2w/grznQcmXrH/C/SeBybe');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      await notificationsService.delete(id);
      const notif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link && onNavigate) {
      onNavigate(notification.link);
      setIsOpen(false);
    }
  };

  // Format relative time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz. temu`;
    if (days < 7) return `${days} dni temu`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title={t.notifications || 'Powiadomienia'}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-[fadeIn_0.2s]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">{t.notifications || 'Powiadomienia'}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                  {unreadCount} {language === 'PL' ? 'nowych' : 'new'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Oznacz wszystkie jako przeczytane"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigate) onNavigate('settings');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Ustawienia powiadomień"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Ładowanie...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'PL' ? 'Brak powiadomień' : 'No notifications'}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  {language === 'PL' ? 'Nowe powiadomienia pojawią się tutaj' : 'New notifications will appear here'}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = NOTIFICATION_ICONS[notification.type] || AlertCircle;
                const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-slate-500';

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors group ${
                      !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        {notification.body && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-1 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Oznacz jako przeczytane"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Usuń"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
