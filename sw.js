const CACHE_NAME = 'ppe-register-v1';
const ASSETS = [
  'index.html',
  'manifest.json'
];

// Initialize and Cache basic structural assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Network-first approach to ensure live Google Sheets data updates instantly
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
