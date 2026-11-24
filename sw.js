/* Gold Trading v5: la calculadora funciona offline y actualiza el oro al conectarse. */
const CACHE_VERSION = 'goldtrading-offline-v8';
const OFFLINE_FILES = [
  './', './index.html', './styles.css', './math.js', './app.js',
  './images/results-gold.png', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION)
    .then(cache => cache.addAll(OFFLINE_FILES.map(file => new Request(file, {cache:'reload'}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('goldtrading-offline-') && k !== CACHE_VERSION).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE_VERSION).then(async cache => {
    const cached = await cache.match(request, {ignoreSearch:true});
    if (request.mode === 'navigate') {
      try {
        const fresh = await fetch(request, {cache:'no-store'});
        if (fresh.ok) { cache.put('./index.html', fresh.clone()); return fresh; }
      } catch (_) {}
      return cached || cache.match('./index.html');
    }
    return cached || fetch(request);
  }));
});
