// Enhanced Service Worker for BMV Finder PWA
const CACHE_NAME = 'bmv-finder-v2.0.0';
const STATIC_CACHE = 'bmv-finder-static-v2.0.0';
const DYNAMIC_CACHE = 'bmv-finder-dynamic-v2.0.0';
const API_CACHE = 'bmv-finder-api-v2.0.0';
const IMAGE_CACHE = 'bmv-finder-images-v2.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'network-first',
  API: 'stale-while-revalidate',
  IMAGES: 'cache-first',
  OFFLINE: 'cache-only'
};

// Cache configuration
const CACHE_CONFIG = {
  STATIC_CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC_CACHE_MAX_AGE: 24 * 60 * 60 * 1000, // 1 day
  API_CACHE_MAX_AGE: 5 * 60 * 1000, // 5 minutes
  IMAGE_CACHE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_CACHE_SIZE: 100, // Maximum number of items per cache
  MAX_IMAGE_CACHE_SIZE: 50 // Maximum number of images
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
];

// API endpoints that should be cached
const CACHEABLE_API_ENDPOINTS = [
  '/api/property-search',
  '/api/market-analysis',
  '/api/hpi',
  '/api/recent-sales',
  '/api/analytics/property',
  '/api/analytics/market-intelligence'
];

// Image patterns that should be cached
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /\/api\/images\//,
  /\/uploads\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Pre-cache critical API responses
      caches.open(API_CACHE).then((cache) => {
        console.log('Service Worker: Pre-caching API responses');
        return Promise.all(
          CACHEABLE_API_ENDPOINTS.map(endpoint => 
            fetch(endpoint).then(response => {
              if (response.ok) {
                return cache.put(endpoint, response);
              }
            }).catch(() => {
              // Ignore errors for pre-caching
            })
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation complete');
    })
  );
});

// Fetch event - implement caching strategies
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
  
  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request);
  
  switch (strategy) {
    case CACHE_STRATEGIES.STATIC:
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      break;
    case CACHE_STRATEGIES.DYNAMIC:
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      break;
    case CACHE_STRATEGIES.API:
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
      break;
    case CACHE_STRATEGIES.IMAGES:
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
      break;
    case CACHE_STRATEGIES.OFFLINE:
      event.respondWith(cacheOnly(request));
      break;
    default:
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'property-search') {
    event.waitUntil(syncPropertySearches());
  } else if (event.tag === 'watchlist-update') {
    event.waitUntil(syncWatchlistUpdates());
  } else if (event.tag === 'analytics-data') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'New property matches your search criteria!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/search/properties'
    },
    actions: [
      {
        action: 'view',
        title: 'View Properties',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    requireInteraction: true,
    silent: false
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
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        } else {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      status: getCacheStatus()
    });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  } else if (event.data && event.data.type === 'PRELOAD_DATA') {
    event.waitUntil(preloadData(event.data.urls));
  }
});

// Cache strategy functions
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Static assets
  if (STATIC_ASSETS.includes(url.pathname) || 
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    return CACHE_STRATEGIES.STATIC;
  }
  
  // API endpoints
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.API;
  }
  
  // Images
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return CACHE_STRATEGIES.IMAGES;
  }
  
  // Offline page
  if (url.pathname === '/offline') {
    return CACHE_STRATEGIES.OFFLINE;
  }
  
  // Default to dynamic
  return CACHE_STRATEGIES.DYNAMIC;
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      if (isCacheValid(cachedResponse, cacheName)) {
        return cachedResponse;
      } else {
        // Cache expired, remove it
        await cache.delete(request);
      }
    }
    
    // Not in cache or expired, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone the response before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      
      // Clean up old entries if cache is full
      await cleanupCache(cache, cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      
      // Clean up old entries if cache is full
      await cleanupCache(cache, cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      cleanupCache(cache, cacheName);
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, ignore
  });
  
  // Return cached response immediately if available
  if (cachedResponse && isCacheValid(cachedResponse, cacheName)) {
    return cachedResponse;
  }
  
  // Wait for network response
  return fetchPromise;
}

// Cache Only Strategy
async function cacheOnly(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline');
  }
  
  throw new Error('Resource not in cache');
}

// Utility functions
function isCacheValid(response, cacheName) {
  const cacheAge = Date.now() - new Date(response.headers.get('sw-cache-timestamp') || 0).getTime();
  const maxAge = getMaxAge(cacheName);
  
  return cacheAge < maxAge;
}

function getMaxAge(cacheName) {
  switch (cacheName) {
    case STATIC_CACHE:
      return CACHE_CONFIG.STATIC_CACHE_MAX_AGE;
    case DYNAMIC_CACHE:
      return CACHE_CONFIG.DYNAMIC_CACHE_MAX_AGE;
    case API_CACHE:
      return CACHE_CONFIG.API_CACHE_MAX_AGE;
    case IMAGE_CACHE:
      return CACHE_CONFIG.IMAGE_CACHE_MAX_AGE;
    default:
      return CACHE_CONFIG.DYNAMIC_CACHE_MAX_AGE;
  }
}

async function cleanupCache(cache, cacheName) {
  const keys = await cache.keys();
  const maxSize = cacheName === IMAGE_CACHE ? 
    CACHE_CONFIG.MAX_IMAGE_CACHE_SIZE : 
    CACHE_CONFIG.MAX_CACHE_SIZE;
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const entriesToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      size: keys.length,
      maxSize: cacheName === IMAGE_CACHE ? 
        CACHE_CONFIG.MAX_IMAGE_CACHE_SIZE : 
        CACHE_CONFIG.MAX_CACHE_SIZE
    };
  }
  
  return status;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('Service Worker: All caches cleared');
}

async function preloadData(urls) {
  const cache = await caches.open(API_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('Failed to preload:', url, error);
    }
  }
}

// Background sync functions
async function syncPropertySearches() {
  console.log('Service Worker: Syncing property searches');
  // Implement property search sync logic
}

async function syncWatchlistUpdates() {
  console.log('Service Worker: Syncing watchlist updates');
  // Implement watchlist sync logic
}

async function syncAnalyticsData() {
  console.log('Service Worker: Syncing analytics data');
  // Implement analytics sync logic
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
      event.waitUntil(updateCache());
    }
  });
}

async function updateCache() {
  console.log('Service Worker: Periodic cache update');
  
  // Update critical API endpoints
  const cache = await caches.open(API_CACHE);
  
  for (const endpoint of CACHEABLE_API_ENDPOINTS) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        await cache.put(endpoint, response);
      }
    } catch (error) {
      console.error('Failed to update cache for:', endpoint, error);
    }
  }
}

console.log('Service Worker: Enhanced PWA service worker loaded');
