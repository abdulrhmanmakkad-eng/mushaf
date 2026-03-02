// Service Worker — المصحف الشريف
const CACHE = 'mushaf-v1';
const QURAN_CACHE = 'mushaf-pages-v1';

// Cache the app shell on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./mushaf.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== QURAN_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Quran page images — cache first
  if (url.includes('quran.com/images/pages') || url.includes('page0') || url.match(/page\d{3}/)) {
    e.respondWith(
      caches.open(QURAN_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const resp = await fetch(e.request);
          if (resp.ok) cache.put(e.request, resp.clone());
          return resp;
        } catch {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // App shell — cache first
  if (url.includes('mushaf.html') || e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
    return;
  }
});
