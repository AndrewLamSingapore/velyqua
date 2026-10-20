const CACHE = 'velyqua-shell-v2';
const SHELL = ['/', '/manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('velyqua-shell-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Cache public shell assets only, never Supabase/auth traffic or query variants.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search || url.pathname.startsWith('/api/') || request.headers.has('authorization')) return;
  const navigation = request.mode === 'navigate';
  const staticAsset = SHELL.includes(url.pathname) || url.pathname === '/velyqua-icon.png' ||
    url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/');
  if (!staticAsset && !navigation) return;
  event.respondWith(fetch(request).then(response => {
    if (staticAsset && response.ok && !response.redirected) event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())).catch(() => {}));
    return response;
  }).catch(async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (navigation) return await caches.match('/') || Response.error();
    return Response.error();
  }));
});
