// Strings service worker
// - Handles push notifications (existing behavior preserved)
// - Adds offline-shell caching for /, /legal/*, /guidelines
// - Network-first for HTML; cache-first for immutable static assets
// - Skips /api, /socket.io, /_next/webpack-hmr, /uploads entirely

const VERSION = 'v1';
const SHELL_CACHE = 'strings-shell-' + VERSION;
const STATIC_CACHE = 'strings-static-' + VERSION;

const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

// ---- Install: precache shell ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

// ---- Activate: clear old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ---- Fetch: caching strategy ----
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never touch API, sockets, HMR, uploads, admin
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/uploads') ||
    url.pathname.startsWith('/admin')
  ) {
    return;
  }

  // Cache-first for immutable static assets
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first for HTML, fallback to offline page for navigations
  const isNavigation =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache only landing page + legal docs
          const cacheable =
            url.pathname === '/' ||
            url.pathname.startsWith('/legal') ||
            url.pathname === '/guidelines';
          if (cacheable && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          return caches.match(req).then((hit) => {
            if (hit) return hit;
            return caches.match('/offline.html').then((off) =>
              off ||
              new Response('You are offline.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              })
            );
          });
        })
    );
    return;
  }
});

// ---- Push: preserved from original ----
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Strings', body: event.data.text() };
  }
  const opts = {
    body: data.body || '',
    tag: data.tag || 'strings',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: { link: data.link || '/app' },
    vibrate: [80, 40, 80],
    renotify: true,
  };
  // Show push notifications even when another Strings tab is visible.
  // This lets users notice messages and updates while viewing another page.
  event.waitUntil(
    self.registration.showNotification(data.title || 'Strings', opts)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/app';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if (c.url.includes(self.location.origin)) {
            c.focus();
            if ('navigate' in c) c.navigate(link);
            return;
          }
        }
        return self.clients.openWindow(link);
      })
  );
});
