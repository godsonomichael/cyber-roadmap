const CACHE = 'crp-v3';
const ASSETS = [
  '/cyber-roadmap/',
  '/cyber-roadmap/index.html',
  '/cyber-roadmap/manifest.json',
  '/cyber-roadmap/logo.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Never intercept Firebase, Groq API or Google Fonts — must stay live
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('firestore') || url.includes('groq-proxy') ||
      url.includes('gstatic') || url.includes('googleapis') || url.includes('fonts.')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful GET responses for app shell files
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/cyber-roadmap/index.html'));
    })
  );
});
