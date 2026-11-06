// Replaces the old offline worker on the old host: drops its caches and sends every open window to /move.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  const cleared = (async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await self.clients.claim();
  })();
  event.waitUntil(cleared);
  // Outside waitUntil: a navigation waits for activation to end, so waiting on it here would never finish.
  cleared.then(async () => {
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.map((client) => client.navigate('/move').catch(() => {})));
  });
});

// A reload from the old app must reach /move too, because every other path on the old host redirects away.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') event.respondWith(fetch('/move', { cache: 'no-store' }));
});
