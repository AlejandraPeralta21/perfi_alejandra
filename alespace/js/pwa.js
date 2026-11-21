/* Estado online/offline, instalación y sincronización de la cola local.
   EJECUCIÓN: hilo principal del navegador; js/app.js lo importa después de pwa-store.js.
   INICIO: escucha la red/cola y registra sw.js al evento load (o inmediatamente si ya cargó). */
(function () {
  'use strict';

  const MESSAGE_KEY = 'as-contact-messages';
  const endpoint = new URL('./api/contact', window.location.href).href;
  const badge = document.getElementById('networkStatus');
  const status = document.getElementById('formStatus');
  let serviceWorkerRegistration = null;

  function readMessages() {
    try {
      const messages = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]');
      return Array.isArray(messages) ? messages : [];
    } catch (error) { return []; }
  }

  function updateNetworkBadge(pendingCount) {
    if (!badge) return;
    const offline = !navigator.onLine;
    const count = Number(pendingCount) || 0;
    const text = offline
      ? 'Sin conexión' + (count ? ' · ' + count + ' pendiente(s)' : '')
      : 'En línea' + (count ? ' · ' + count + ' pendiente(s) por enviar' : '');
    badge.classList.toggle('is-offline', offline);
    badge.classList.toggle('is-online', !offline);
    badge.setAttribute('aria-label', text);
    const icon = document.createElement('i');
    icon.className = 'bi ' + (offline ? 'bi-wifi-off' : 'bi-wifi');
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = text;
    badge.replaceChildren(icon, label);
  }

  function setFormStatus(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.classList.remove('is-valid', 'is-expired', 'is-pending');
    if (kind) status.classList.add(kind);
  }

  async function refreshNetworkBadge() {
    let count = readMessages().filter(function (message) { return message.syncStatus !== 'synced'; }).length;
    try { count = (await window.PWAStore.list()).length; } catch (error) { /* localStorage count remains available */ }
    updateNetworkBadge(count);
  }

  function markSynced(ids) {
    const normalizedIds = ids.map(String);
    const messages = readMessages();
    let changed = false;
    messages.forEach(function (message) {
      if (normalizedIds.indexOf(String(message.id)) !== -1) {
        message.syncStatus = 'synced';
        message.syncedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
      document.dispatchEvent(new CustomEvent('as:messages-updated'));
      setFormStatus('Mensaje sincronizado con el servidor.', 'is-valid');
    }
    refreshNetworkBadge();
  }

  async function syncFromPage() {
    if (!navigator.onLine || !window.PWAStore) return;
    const entries = await window.PWAStore.list();
    for (const entry of entries) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.payload)
        });
        if (!response.ok) throw new Error('Servidor no disponible.');
        const result = await response.json();
        if (!result || result.ok !== true) throw new Error('No hubo confirmación del servidor.');
        await window.PWAStore.remove(entry.id);
        markSynced([entry.id]);
      } catch (error) {
        setFormStatus('Guardado localmente; el servidor no está disponible y quedó pendiente.', 'is-pending');
        break;
      }
    }
    refreshNetworkBadge();
  }

  async function registerBackgroundSync() {
    try {
      const registration = serviceWorkerRegistration || await navigator.serviceWorker.ready;
      if (registration.sync) await registration.sync.register('alejandra-contact-outbox');
      else if (navigator.onLine) await syncFromPage();
    } catch (error) {
      if (navigator.onLine) await syncFromPage();
    }
  }

  async function enqueueMessage(event) {
    if (!event.detail || !window.PWAStore) return;
    try {
      await window.PWAStore.enqueue(event.detail);
      await refreshNetworkBadge();
      if (navigator.onLine) await syncFromPage();
      else await registerBackgroundSync();
    } catch (error) {
      setFormStatus('Mensaje guardado en este navegador; la cola offline no estuvo disponible.', 'is-pending');
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(window.location.protocol)) {
      refreshNetworkBadge();
      if (navigator.onLine) syncFromPage();
      return;
    }
    navigator.serviceWorker.register('./sw.js').then(function (registration) {
      serviceWorkerRegistration = registration;
      return refreshNetworkBadge().then(function () {
        // Reintenta la cola al abrir la página, incluso si la conexión volvió antes de cargarla.
        if (navigator.onLine) return syncFromPage();
      });
    }).catch(function () {
      updateNetworkBadge(readMessages().filter(function (message) { return message.syncStatus !== 'synced'; }).length);
      // Si falla el Service Worker, la página todavía puede intentar enviar los pendientes.
      if (navigator.onLine) syncFromPage();
    });
  }

  jQuery(document).off('as:outbox-message.asPwa').on('as:outbox-message.asPwa', function (event) {
    enqueueMessage({ detail: event.originalEvent ? event.originalEvent.detail : event.detail });
  });
  jQuery(document).off('as:messages-changed.asPwa').on('as:messages-changed.asPwa', refreshNetworkBadge);
  jQuery(window).off('online.asPwa').on('online.asPwa', function () {
    refreshNetworkBadge();
    registerBackgroundSync();
  });
  jQuery(window).off('offline.asPwa').on('offline.asPwa', refreshNetworkBadge);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'PWA_OUTBOX_SYNCED') markSynced(event.data.ids || []);
    });
  }

  const installButton = document.getElementById('installPwa');
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  if (installButton) installButton.addEventListener('click', async function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener('appinstalled', function () {
    if (installButton) installButton.hidden = true;
  });

  if (document.readyState === 'complete') registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker, { once: true });
  refreshNetworkBadge();
})();
