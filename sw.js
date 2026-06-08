// Service Worker désactivé — ne bloque plus les appels API
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => clients.claim())
));
// Pas de fetch handler — tout passe normalement
