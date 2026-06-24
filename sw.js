const CACHE_NAME = 'ppe-register-v5';
const STATIC_ASSETS = [
  './icon-192.png',
  './icon-512.png'
];

// Install — only pre-cache icons (small, never change)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Activate — delete ALL old caches, claim all clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - GAS API         → network only (live data, never cache)
//   - HTML / manifest → network-first (always get latest version)
//   - Everything else → network with cache fallback (offline support)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // GAS API — network only, return offline error if fails
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline — reconnect to load data.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // HTML and manifest — always fetch fresh from network
  if (request_is_html(event.request) || url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // All other assets — network with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

function request_is_html(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept') &&
     req.headers.get('accept').includes('text/html'));
}
