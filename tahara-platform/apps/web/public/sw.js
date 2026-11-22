/* TAHARA service worker – static assets only.
 *
 * Privacy rule: this worker must NEVER store personal data. It caches only
 * build assets that are identical for every visitor (hashed JS/CSS/fonts under
 * /_next/static/, app icons) and a self-contained offline page.
 * Every other request – pages, RSC payloads, /api, /auth, any cross-origin call
 * (e.g. Supabase) – is left to the network untouched (no respondWith, no cache).
 *
 * The policy is exposed on `self.__TAHARA_SW__` so it is unit-tested
 * (apps/web/src/sw.test.ts) and checked end-to-end (tests/e2e/pwa-cache.spec.ts).
 */
'use strict';

const CACHE_VERSION = 'tahara-static-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

/** True only for public, user-independent static assets on our own origin. */
function isCacheable(requestUrl, method, origin) {
  if (method !== 'GET') return false;
  let url;
  try {
    url = new URL(requestUrl);
  } catch (e) {
    return false;
  }
  if (url.origin !== origin) return false;
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.search) return false;
  return PRECACHE_URLS.indexOf(url.pathname) !== -1;
}

self.__TAHARA_SW__ = { CACHE_VERSION, OFFLINE_URL, PRECACHE_URLS, isCacheable };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Page navigations: always network. If offline, show the static offline page
  // (which contains no personal data). The live response is never stored.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (!isCacheable(req.url, req.method, self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && res.type === 'basic') cache.put(req, res.clone());
            return res;
          }),
      ),
    ),
  );
});
