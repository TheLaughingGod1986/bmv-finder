// Service Worker for BMV Finder PWA
const CACHE_NAME = 'bmv-finder-v1';
const STATIC_CACHE = 'bmv-finder-static-v1';
const DYNAMIC_CACHE = 'bmv-finder-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/property-search/,
  /^\/api\/watchlist/,
  /^\/api\/hpi/,
  /^\/api\/market-analysis/,
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticFile(request)) {
    // Static files - cache first strategy
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirst(request));
  } else if (isPageRequest(request)) {
    // Page requests - network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    // Other requests - network first
    event.respondWith(networkFirst(request));
  }
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network first with offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Check if request is for static files
function isStaticFile(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.gif') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2');
}

// Check if request is for API endpoints
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') && 
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for page navigation
function isPageRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'watchlist-sync') {
    event.waitUntil(syncWatchlist());
  } else if (event.tag === 'search-sync') {
    event.waitUntil(syncSearchHistory());
  }
});

// Sync watchlist when back online
async function syncWatchlist() {
  try {
    // Get pending watchlist items from IndexedDB
    const pendingItems = await getPendingWatchlistItems();
    
    for (const item of pendingItems) {
      try {
        const response = await fetch('/api/watchlist/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
        
        if (response.ok) {
          // Remove from pending items
          await removePendingWatchlistItem(item.id);
        }
      } catch (error) {
        console.error('Failed to sync watchlist item:', error);
      }
    }
  } catch (error) {
    console.error('Watchlist sync failed:', error);
  }
}

// Sync search history when back online
async function syncSearchHistory() {
  try {
    // Get pending search history from IndexedDB
    const pendingSearches = await getPendingSearchHistory();
    
    for (const search of pendingSearches) {
      try {
        const response = await fetch('/api/search/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(search),
        });
        
        if (response.ok) {
          // Remove from pending searches
          await removePendingSearchHistory(search.id);
        }
      } catch (error) {
        console.error('Failed to sync search history:', error);
      }
    }
  } catch (error) {
    console.error('Search history sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'New property alert!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Properties',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification('BMV Finder', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/watchlist')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingWatchlistItems() {
  // In a real implementation, this would interact with IndexedDB
  return [];
}

async function removePendingWatchlistItem(id) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing pending watchlist item:', id);
}

async function getPendingSearchHistory() {
  // In a real implementation, this would interact with IndexedDB
  return [];
}

async function removePendingSearchHistory(id) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing pending search history:', id);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('Service Worker: Loaded successfully');