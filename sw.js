const CACHE_NAME = 'stall-abenteuerhof-shell-v12559-20261123';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest?v=1.25.59',
  './icon-192.png?v=1.25.59',
  './icon-512.png?v=1.25.59',
  './apple-touch-icon.png?v=1.25.59'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([...new Set(SHELL)]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('stall-abenteuerhof-shell-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, {cache:'no-store'}));
    return;
  }

  if (request.mode === 'navigate') {
    const pageKey = './index.html';
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => response.ok && cache.put(pageKey, copy));
          return response;
        })
        .catch(async () => (await caches.match(pageKey)) || Response.error())
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
