const CACHE_NAME = 'stall-abenteuerhof-shell-v191-20260920';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
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
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // OneSignal hat einen eigenen Worker/Scope und soll nicht durch den App-Cache laufen.
  if (url.pathname.includes('/onesignal/')) return;

  // version.json immer frisch aus dem Netz prüfen.
  if (url.origin === self.location.origin && url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, { cache:'no-store' }));
    return;
  }

  // Navigation / HTML: network-first. So sehen Nutzer:innen neue GitHub-Versionen
  // schnell, haben bei schlechtem Netz aber weiterhin die letzte funktionierende App.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(async () => {
          return (await caches.match('./index.html')) || (await caches.match('./'));
        })
    );
    return;
  }

  // Nur eigene statische Dateien cachen; externe APIs/Fonts bleiben browserverwaltet.
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
