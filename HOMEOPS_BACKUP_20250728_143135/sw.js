const CACHE_NAME = 'homeops-v2025-07-11';
const OFFLINE_URL = '/';

// Essential files to cache for offline functionality
const ESSENTIAL_CACHE = [
  '/',
  '/dashboard.html',
  '/style.css',
  '/dashboard.css', 
  '/chat-ui.css',
  '/auth.css',
  '/layout.js',
  '/dashboard.js',
  '/chat.js',
  '/config.js',
  '/img/homeops-logo.svg',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(ESSENTIAL_CACHE);
      })
      .then(() => {
        console.log('✅ Essential files cached');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      self.clients.claim();
    })
  );
});

// Fetch event - handle network requests with proper redirect handling
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    fetch(request, { 
      redirect: 'follow',  // Allow redirects
      credentials: 'same-origin' 
    })
    .then(response => {
      // Don't cache redirected responses that might cause issues
      if (response.redirected && response.type === 'opaqueredirect') {
        return response;
      }
      
      // Clone response for caching
      const responseToCache = response.clone();
      
      // Only cache successful responses
      if (response.status === 200) {
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, responseToCache);
          })
          .catch(error => {
            console.warn('Cache put failed:', error);
          });
      }
      
      return response;
    })
    .catch(error => {
      console.warn('Fetch failed, trying cache:', error);
      
      // Try to serve from cache
      return caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If offline and no cache, return offline page
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
          
          throw error;
        });
    })
  );
});
const DYNAMIC_CACHE = 'homeops-dynamic-v1';

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('🔧 HomeOps PWA: Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 HomeOps PWA: Caching essential files');
        return cache.addAll(ESSENTIAL_CACHE);
      })
      .then(() => {
        console.log('✅ HomeOps PWA: Service Worker installed');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ HomeOps PWA: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 HomeOps PWA: Activating Service Worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ HomeOps PWA: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ HomeOps PWA: Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle navigation requests (app shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              // Cache successful navigation responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // Offline fallback
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses for offline access
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request)
            .then(response => {
              if (response) {
                // Add offline indicator header
                const headers = new Headers(response.headers);
                headers.set('X-Served-By', 'ServiceWorker-Cache');
                return new Response(response.body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: headers
                });
              }
              // Return offline message for API calls
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'This feature requires an internet connection',
                  cached: false 
                }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
            }
            return response;
          });
      })
  );
});

// Background sync for calendar updates
self.addEventListener('sync', event => {
  console.log('🔄 HomeOps PWA: Background sync triggered');
  if (event.tag === 'calendar-sync') {
    event.waitUntil(syncCalendarData());
  }
});

// Push notifications for calendar reminders
self.addEventListener('push', event => {
  console.log('🔔 HomeOps PWA: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New HomeOps notification',
    icon: '/img/homeops-logo.svg',
    badge: '/img/homeops-logo.svg',
    vibrate: [200, 100, 200],
    tag: 'homeops-notification',
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/img/homeops-logo.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HomeOps Agent', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🖱️ HomeOps PWA: Notification clicked');
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync calendar data function
async function syncCalendarData() {
  try {
    console.log('📅 HomeOps PWA: Syncing calendar data...');
    // This would sync with your calendar API
    // Implementation depends on your calendar integration
    const response = await fetch('/api/calendar-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ HomeOps PWA: Calendar sync successful');
    }
  } catch (error) {
    console.error('❌ HomeOps PWA: Calendar sync failed', error);
  }
}

// Message handling from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
