/* elgoharyX — service worker (stale-while-revalidate).
   Serves same-origin GETs from cache INSTANTLY (no waiting on a slow network),
   then refreshes the cache in the background. This prevents the long "hang" that
   network-first caused when the network stalled. Firebase / cross-origin traffic
   is never intercepted, so live data always comes fresh from the database. */
const CACHE = 'elgoharyx-v46';
const CORE = ['./', './index.html', './assets/styles.css', './assets/app.js', './assets/firebase.js', './assets/core.js', './assets/imagehost.js', './assets/site.js', './assets/fx.js', './assets/pwa.js', './assets/ads.js', './assets/promo.js', './assets/i18n.js', './explore.html', './hub.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  // cache each asset independently so one missing/404 file can't abort the whole
  // precache (addAll is all-or-nothing); the site still works from the network.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;               // let Firebase & CDNs pass through untouched
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const netFetch = fetch(req).then(res => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => null);
    // cached first (instant); otherwise wait for network; final fallback = home page
    return cached || (await netFetch) || caches.match('./index.html');
  })());
});
