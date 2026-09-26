const CACHE_NAME = 'stall-abenteuerhof-shell-v1140-20260926';

const SHELL = [
  './',
  './index.html',
  './helfi.html',
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
          .filter(key =>
            key.startsWith('stall-abenteuerhof-shell-') &&
            key !== CACHE_NAME
          )
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

  // OneSignal nicht über den App-Cache laufen lassen.
  if (url.pathname.includes('/onesignal/')) return;

  // version.json immer frisch laden.
  if (
    url.origin === self.location.origin &&
    url.pathname.endsWith('/version.json')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
    );
    return;
  }

  // HTML / Navigation: zuerst Netzwerk, bei Fehler aus Cache.
  if (request.mode === 'navigate') {
    const pageKey = url.pathname.endsWith('/helfi.html')
      ? './helfi.html'
      : './index.html';

    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            if (response.ok) {
              cache.put(pageKey, copy);
            }
          });

          return response;
        })
        .catch(async () => {
          return (await caches.match(pageKey)) || Response.error();
        })
    );

    return;
  }

  // Eigene statische Dateien: Cache verwenden und im Hintergrund aktualisieren.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, copy);
              });
            }

            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
    );
  }
});
