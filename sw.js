const CACHE_NAME = 'stall-abenteuerhof-shell-v1244-20261020';
const SHELL = [
  './',
  './index.html',
  './helfi.html',
  './manifest.webmanifest',
  './access-v122.js',
  './access-v122.css',
  './access-v122.js?v=1244',
  './access-v122.css?v=1244',
  './pony-planner.js',
  './pony-planner.css',
  './pony-planner.js?v=1244',
  './pony-planner.css?v=1244',
  './icon-192.png',
  './icon-512.png'
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
  if (url.pathname.includes('/onesignal/')) return;

  if (url.origin === self.location.origin && url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, {cache:'no-store'}));
    return;
  }

  if (request.mode === 'navigate') {
    const pageKey = url.pathname.endsWith('/helfi.html') ? './helfi.html' : './index.html';
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
