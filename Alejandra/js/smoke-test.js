/* SMOKE TEST: inspecciona el DOM y muestra el resultado en el panel y en un aviso visible. */
(function () {
  'use strict';
  const button = document.getElementById('btnSmokeTest');
  const output = document.getElementById('salidaAudit');
  if (!button || !output) return;

  button.addEventListener('click', function (event) {
    // Mantiene disponible el menú para que el estudiante pueda leer el resultado.
    event.stopPropagation();
    const imagesWithoutAlt = document.querySelectorAll(
      'img:not([alt]), img[alt=""]:not([data-a11y-decorative="true"])'
    ).length;
    const emptyLinks = document.querySelectorAll('a[href=""], a:not([href])').length;
    const buttons = document.querySelectorAll('button').length;
    const ok = imagesWithoutAlt === 0 && emptyLinks === 0;
    const message = `Smoke Test ${ok ? 'OK' : 'Revisar'} · Botones: ${buttons} · Imágenes sin alt: ${imagesWithoutAlt} · Enlaces sin destino: ${emptyLinks}`;
    output.textContent = message;
    if (window.KT && KT.toast) KT.toast(message);
    if (window.KT && KT.menu) KT.menu(true);
  });
})();
