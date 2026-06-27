const CACHE_NAME = 'pg-infra-shell-v1';
const APP_SHELL = [
  '/test_pg_infrastructure/',
  '/test_pg_infrastructure/manifest.json',
  '/test_pg_infrastructure/icon-192.png',
  '/test_pg_infrastructure/icon-512.png',
];

function serviceUnavailableResponse() {
  return new Response(JSON.stringify({
    success: false,
    message: 'Network unavailable',
  }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'application/json' },
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => serviceUnavailableResponse()),
    );
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => serviceUnavailableResponse()),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match('/test_pg_infrastructure/').then((cached) => cached || serviceUnavailableResponse())),
  );
});
