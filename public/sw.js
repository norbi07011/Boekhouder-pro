// Service Worker for Boekhouder Connect PWA
// Version 3 - Minimal, non-blocking
const CACHE_NAME = 'boekhouder-v3';

// Install - just skip waiting, don't block
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3...');
  self.skipWaiting();
});

// Activate - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => {
          console.log('[SW] Removing old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - NEVER block page loads
// Only intercept sounds/icons for offline support
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // CRITICAL: Never intercept navigation - let browser handle F5/refresh
  if (event.request.mode === 'navigate') {
    return;
  }
  
  // Never intercept document loads
  if (event.request.destination === 'document') {
    return;
  }
  
  // Skip non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip all JS, CSS, HTML, API calls - let them load normally
  if (url.includes('supabase') || 
      url.includes('/api/') ||
      url.includes('googleapis') ||
      url.includes('esm.sh') ||
      url.includes('tailwindcss') ||
      url.endsWith('.js') ||
      url.endsWith('.css') ||
      url.endsWith('.html') ||
      url.endsWith('.svg') ||
      url.endsWith('.woff') ||
      url.endsWith('.woff2')) {
    return;
  }
  
  // Only cache sounds and icons (for offline notification sounds)
  if (url.includes('/sounds/') || url.includes('/icons/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Everything else - don't intercept
});

// Push notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'Boekhouder Connect',
    body: 'Nowe powiadomienie',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('[SW] Push parse error:', e);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'notification',
      data: data.data || { url: '/' },
      requireInteraction: false
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
        });
      });
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICKED', url });
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_BADGE') {
    const count = event.data.count || 0;
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
  }
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
