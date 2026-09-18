/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

// Cache names
const CACHE_NAME = 'brewhub-v1';
const STATIC_CACHE = 'brewhub-static-v1';
const DYNAMIC_CACHE = 'brewhub-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  sw.clients.claim();
});

// Fetch event - serve from cache, fallback to network
sw.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Cache strategy based on request type
  if (request.destination === 'image') {
    // Images: Cache first, then network
    event.respondWith(cacheFirst(request));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // Scripts and styles: Cache first
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests: Network first, fallback to cache
    event.respondWith(networkFirst(request));
  } else {
    // HTML and other: Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache-first strategy
async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const networkPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached || networkPromise;
}

// Background sync for offline actions
sw.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders(): Promise<void> {
  // Implement order sync logic here
  console.log('[SW] Syncing orders');
}

// Push notifications
sw.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(
      sw.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
