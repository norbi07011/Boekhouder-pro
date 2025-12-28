// Service Worker for Boekhouder Connect PWA
const CACHE_NAME = 'boekhouder-v2';
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

// Only cache static assets, not HTML
const urlsToCache = [
  '/sounds/notification.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache only essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  // Skip caching during development - just activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - NETWORK FIRST (always try network, fallback to cache)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls, supabase, and external requests - let them pass through
  if (event.request.url.includes('supabase') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('esm.sh') ||
      event.request.url.includes('tailwindcss.com') ||
      event.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  // For HTML pages - always use network
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      event.request.url.endsWith('.html') ||
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For other assets - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for sounds and icons
        if (response.ok && 
            (event.request.url.includes('/sounds/') || 
             event.request.url.includes('/icons/'))) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'Boekhouder Connect',
    body: 'Nowe powiadomienie',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'notification-' + Date.now(),
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Otwórz' },
      { action: 'dismiss', title: 'Zamknij' }
    ],
    data: data.data || { url: '/' },
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      // Play notification sound
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            sound: NOTIFICATION_SOUND_URL
          });
        });
      });
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/';

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: url
          });
          return;
        }
      }
      // Open new window if no existing window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle badge updates
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'UPDATE_BADGE') {
    const count = event.data.count || 0;
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic sync for background updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  // This would typically make an API call to check for new notifications
  // For now, we rely on Supabase realtime subscriptions in the main app
  console.log('[SW] Checking for notifications...');
}
