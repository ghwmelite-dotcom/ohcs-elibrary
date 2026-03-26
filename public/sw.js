// OHCS E-Library Service Worker
const CACHE_NAME = 'ohcs-elibrary-v5';
const RUNTIME_CACHE = 'ohcs-runtime-v5';
const ARTICLES_CACHE = 'ohcs-articles-v1';
const API_CACHE = 'ohcs-api-v1';

// API base URL
const API_BASE = 'https://ohcs-elibrary-api.ghwmelite.workers.dev';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon.png',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting on install');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, RUNTIME_CACHE, ARTICLES_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !validCaches.includes(cacheName))
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // For navigation requests, use network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  if (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request).then((response) => {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, response);
            });
          });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Save article for offline reading
  if (event.data && event.data.type === 'CACHE_ARTICLE') {
    const article = event.data.article;
    if (article) {
      caches.open(ARTICLES_CACHE).then((cache) => {
        // Cache the article data
        const articleResponse = new Response(JSON.stringify(article), {
          headers: { 'Content-Type': 'application/json' }
        });
        cache.put(`/offline/article/${article.id}`, articleResponse);
        console.log('[SW] Article cached for offline:', article.title);

        // Also cache the article image if available
        if (article.imageUrl) {
          fetch(article.imageUrl)
            .then(response => {
              if (response.ok) {
                cache.put(article.imageUrl, response);
              }
            })
            .catch(() => {
              console.log('[SW] Could not cache article image');
            });
        }
      });
    }
  }

  // Remove article from offline cache
  if (event.data && event.data.type === 'UNCACHE_ARTICLE') {
    const articleId = event.data.articleId;
    if (articleId) {
      caches.open(ARTICLES_CACHE).then((cache) => {
        cache.delete(`/offline/article/${articleId}`);
        console.log('[SW] Article removed from offline cache:', articleId);
      });
    }
  }

  // Get all cached articles
  if (event.data && event.data.type === 'GET_CACHED_ARTICLES') {
    caches.open(ARTICLES_CACHE).then((cache) => {
      cache.keys().then((keys) => {
        const articleKeys = keys.filter(k => k.url.includes('/offline/article/'));
        Promise.all(articleKeys.map(k => cache.match(k).then(r => r.json())))
          .then((articles) => {
            event.source.postMessage({
              type: 'CACHED_ARTICLES',
              articles: articles
            });
          });
      });
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    // Handle background sync here
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from OHCS E-Library',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'OHCS E-Library', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service Worker loaded');
