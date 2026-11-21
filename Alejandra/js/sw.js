const SHELL_CACHE = 'karaoke-tulum-shell-v15';
const RUNTIME_CACHE = 'karaoke-tulum-runtime-v1';
const OPTIONAL_CACHE_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/dompurify@3.4.17/dist/purify.min.js'
];
const APP_SHELL = [
  './',
  './index.html',
  './sw.js',
  './js/manifest.json',
  './js/assets/icons/app-icon.svg',
  './js/assets/icons/track-placeholder.svg',
  './js/assets/logo/logo.png',
  './js/assets/promociones/noche-grupo.jpg',
  './js/assets/promociones/cumpleanos-vip.jpg',
  './js/assets/promociones/entre-semana.jpg',
  './js/data/pistas.json',
  './css/themes.css',
  './css/styles.css',
  './css/animations.css',
  './css/responsive.css',
  './css/auth.css',
  './css/accessibility.css',
  './css/specificity.css',
  './js/theme.js',
  './js/security.js',
  './js/sw.js',
  './js/supabase-config.js',
  './js/supabase.js',
  './js/catalogo.js',
  './js/supabase-data.js',
  './js/navigation.js',
  './js/animations.js',
  './js/auth.js',
  './js/main.js',
  './js/reservas.js',
  './js/admin.js',
  './js/accessibility.js',
  './js/smoke-test.js',
  './js/a11y-audit.js',
  './js/pwa.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_SHELL);
    // Cachea también recursos CORS opacos (por ejemplo jQuery CDN), que cache.add() rechaza.
    await Promise.all(OPTIONAL_CACHE_URLS.map(async url => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const request = new Request(url, { mode: 'no-cors', signal: controller.signal });
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') await cache.put(request, response);
      } catch (_) { /* El shell local sigue instalándose aunque un CDN no responda. */ }
      finally { clearTimeout(timeout); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, RUNTIME_CACHE];
    const names = await caches.keys();
    await Promise.all(names.filter(name => !keep.includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isLocal = url.origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put('./index.html', response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  const cachedResponse = caches.match(request);
  // Si ya no hay red, responde rápido con la copia guardada o falla rápido para imágenes no visitadas.
  if (self.navigator.onLine === false) {
    event.respondWith(cachedResponse.then(cached => cached || (isLocal ? fetch(request) : Response.error())));
    return;
  }

  const cacheName = isLocal ? SHELL_CACHE : RUNTIME_CACHE;
  const updateResponse = fetch(request).then(async response => {
    if (response && (response.ok || response.type === 'opaque')) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
      } catch (_) { /* Una cuota llena no debe impedir servir la respuesta de red. */ }
    }
    return response;
  });

  event.waitUntil(updateResponse.then(() => undefined).catch(() => undefined));
  event.respondWith(cachedResponse.then(cached => cached || updateResponse).catch(() => Response.error()));
});







