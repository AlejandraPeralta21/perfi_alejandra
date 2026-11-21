/* Registro PWA y estado visible de conectividad. */
(function () {
  'use strict';

  const status = document.getElementById('networkStatus');
  function updateNetworkStatus() {
    const online = navigator.onLine;
    if (!status) return;
    status.classList.toggle('online', online);
    status.classList.toggle('offline', !online);
    const message = online ? 'En línea. Los datos se guardan en este dispositivo.' : 'Sin conexión. La aplicación usa datos guardados en este dispositivo.';
    status.setAttribute('aria-label', message);
    status.title = message;
    const label = status.querySelector('span');
    if (label) label.textContent = online ? 'En línea' : 'Sin conexión';
  }

  updateNetworkStatus();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // INSTALACIÓN PWA: mostrar el botón solo cuando el navegador ofrece instalar la app.
  let installPrompt = null;
  const installButton = document.getElementById('btnInstalarPWA');
  const installItem = document.getElementById('sideInstall');
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;
    if (installItem) installItem.hidden = false;
  });
  if (installButton) {
    installButton.addEventListener('click', async function () {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      if (installItem) installItem.hidden = true;
    });
  }

  if ('serviceWorker' in navigator) {
    // Si se activa una versión nueva, recarga también las páginas que ya estaban controladas por un SW anterior.
    let reloadingAfterUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloadingAfterUpdate) return;
      reloadingAfterUpdate = true;
      window.location.reload();
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').then(function (registration) {
        // Consulta actualizaciones al abrir para que localhost adopte los archivos nuevos.
        return registration.update();
      }).catch(function (error) {
        console.warn('No se pudo registrar el Service Worker:', error);
      });
    });
  }
})();
