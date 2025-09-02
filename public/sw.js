// Enhanced Service Worker for BMV Finder PWA
const CACHE_NAME = 'bmv-finder-v1.0.0';
const STATIC_CACHE = 'bmv-finder-static-v1.0.0';
const DYNAMIC_CACHE = 'bmv-finder-dynamic-v1.0.0';
const API_CACHE = 'bmv-finder-api-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/health-check',
  '/api/property-search',
  '/api/property-valuation',
  '/api/recent-sales',
  '/api/hpi',
  '/api/market-trends',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - Cache First
  static: {
    match: (request) => STATIC_ASSETS.some(asset => request.url.includes(asset)),
    strategy: 'cache-first'
  },
  // API endpoints - Network First with fallback
  api: {
    match: (request) => request.url.includes('/api/'),
    strategy: 'network-first'
  },
  // Images - Cache First with long TTL
  images: {
    match: (request) => request.destination === 'image',
    strategy: 'cache-first'
  },
  // Documents - Network First
  documents: {
    match: (request) => request.destination === 'document',
    strategy: 'network-first'
  }
};

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Implement caching strategies
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

  // Determine cache strategy
  const strategy = getCacheStrategy(request);
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(request));
      break;
    case 'network-first':
      event.respondWith(networkFirst(request));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await getCacheForRequest(request);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await getCacheForRequest(request);
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
    if (request.destination === 'document') {
      return caches.match('/offline');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await getCacheForRequest(request);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// Get appropriate cache for request
async function getCacheForRequest(request) {
  if (CACHE_STRATEGIES.static.match(request)) {
    return caches.open(STATIC_CACHE);
  } else if (CACHE_STRATEGIES.api.match(request)) {
    return caches.open(API_CACHE);
  } else {
    return caches.open(DYNAMIC_CACHE);
  }
}

// Determine cache strategy for request
function getCacheStrategy(request) {
  for (const [name, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (strategy.match(request)) {
      return strategy.strategy;
    }
  }
  return 'network-first';
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync offline data when back online
    console.log('Performing background sync...');
    
    // You can add specific sync logic here
    // For example, sync offline form submissions, cached API calls, etc.
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from BMV Finder',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BMV Finder', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Message handling
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

async function doPeriodicSync() {
  try {
    console.log('Performing periodic sync...');
    
    // Update cached content periodically
    const cache = await caches.open(API_CACHE);
    const requests = API_ENDPOINTS.map(endpoint => new Request(endpoint));
    
    const responses = await Promise.allSettled(
      requests.map(request => fetch(request))
    );
    
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        cache.put(requests[index], result.value);
      }
    });
    
    console.log('Periodic sync completed');
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');