/* AUDITORÍA HTML5: cuenta estructura semántica y alternativas de imagen en vivo, sin recargar. */
(function () {
  'use strict';
  const button = document.getElementById('btnAuditarA11Y');
  const report = document.getElementById('reporteA11Y');
  if (!button || !report) return;

  button.addEventListener('click', function (event) {
    // Evita que el drawer se cierre antes de anunciar el diagnóstico.
    event.stopPropagation();
    const semanticZones = document.querySelectorAll('header, nav, main, article, footer').length;
    const imagesWithoutAlt = document.querySelectorAll(
      'img:not([alt]), img[alt=""]:not([data-a11y-decorative="true"])'
    ).length;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    const message = `Auditoría HTML5 · ${semanticZones} zonas semánticas · ${headings} encabezados · ${imagesWithoutAlt} imágenes sin texto alternativo.`;
    report.textContent = message;
    if (window.KT && KT.toast) KT.toast(message);
    if (window.KT && KT.menu) KT.menu(true);
  });
})();
