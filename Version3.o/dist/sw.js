/* Service Worker: app shell, caché runtime y sincronización diferida de la cola.
   EJECUCIÓN: hilo de Service Worker del navegador, fuera del DOM; lo registra src/js/pwa.js.
   ACTIVACIÓN: eventos install, activate, fetch y sync; puede atender solicitudes sin pestaña visible. */
importScripts('./src/js/pwa-store.js');

const SHELL_CACHE = 'alejandra-space-shell-v19';
const RUNTIME_CACHE = 'alejandra-space-runtime-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  // Archivos fuente para servir el proyecto sin compilar.
  './src/css/style.css',
  './src/css/responsive.css',
  './src/css/animations.css',
  './src/js/app.js',
  './src/js/main.js',
  './src/js/navigation.js',
  './src/js/categories.js',
  './src/js/personal-cards.js',
  './src/js/cascade-filter.js',
  './src/js/security.js',
  './src/js/pwa-store.js',
  './src/js/pwa.js',
  './src/js/contact-form.js',
  './src/js/admin.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Salidas minificadas de Vite; algunas pueden no existir en modo fuente.
  './assets/index.js',
  './assets/icon.svg',
  './assets/manifest.json'
];
const OPTIONAL_NETWORK_ASSETS = [
  'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
  'https://code.jquery.com/jquery-3.7.1.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Outfit:wght@500;600;700;800&family=Poppins:wght@400;500;600&display=swap'
];

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(APP_SHELL.map(function (asset) {
      return cache.add(asset).catch(function () {
        // En modo fuente o compilado se ignoran las rutas exclusivas del otro modo.
      });
    }));
    const runtime = await caches.open(RUNTIME_CACHE);
    await Promise.all(OPTIONAL_NETWORK_ASSETS.map(async function (url) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) await runtime.put(url, response.clone());
      } catch (error) {
        // Las dependencias externas se intentarán guardar al cargarse con conexión.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.filter(function (name) {
      return (name.startsWith('alejandra-space-shell-') && name !== SHELL_CACHE) ||
        (name.startsWith('alejandra-space-runtime-') && name !== RUNTIME_CACHE);
    }).map(function (name) { return caches.delete(name); }));
    await self.clients.claim();
  })());
});

async function cacheNetworkResponse(request, cacheKey) {
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    try {
      const runtime = await caches.open(RUNTIME_CACHE);
      await runtime.put(cacheKey || request, response.clone());
    } catch (error) {
      // Una respuesta no almacenable no debe impedir que la página cargue.
    }
  }
  return response;
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.endsWith('/api/contact')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async function () {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(new URL('./index.html', self.registration.scope).href, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(new URL('./index.html', self.registration.scope).href);
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async function () {
    const sameOrigin = requestUrl.origin === self.location.origin;
    const cached = await caches.match(request, { ignoreSearch: sameOrigin });
    if (cached) return cached;
    try {
      return await cacheNetworkResponse(request);
    } catch (error) {
      if (request.destination === 'image') {
        return new Response('', { status: 503, statusText: 'Imagen no disponible sin conexión' });
      }
      throw error;
    }
  })());
});

async function syncContactOutbox() {
  const endpoint = new URL('./api/contact', self.registration.scope).href;
  const queue = await self.PWAStore.list();
  for (const entry of queue) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry.payload)
    });
    if (!response.ok) throw new Error('El servidor no aceptó el mensaje pendiente.');
    const result = await response.json();
    if (!result || result.ok !== true) throw new Error('El servidor no confirmó el mensaje.');
    await self.PWAStore.remove(entry.id);
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(function (client) { client.postMessage({ type: 'PWA_OUTBOX_SYNCED', ids: [entry.id] }); });
  }
}

self.addEventListener('sync', function (event) {
  if (event.tag === 'alejandra-contact-outbox') event.waitUntil(syncContactOutbox());
});
