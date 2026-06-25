const CACHE = 'flowai-v1';

const API_PREFIXES = [
  '/health', '/login', '/register', '/me', '/logout',
  '/dashboard', '/leads', '/ai', '/campaigns',
  '/whatsapp', '/email', '/connections', '/mvp', '/scraper', '/anon',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/offline.html']))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isApi = API_PREFIXES.some(
    p => url.pathname === p || url.pathname.startsWith(p + '/')
  );

  if (isApi) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(
          JSON.stringify({ offline: true, error: 'You are offline. Connect to try again.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const networkFetch = fetch(e.request)
          .then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          })
          .catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || networkFetch;
      })
    )
  );
});
