/* ACCESIBILIDAD: alterna el contraste, persiste la preferencia y anuncia la acción. */
(function () {
  'use strict';
  const button = document.getElementById('btnSimularContraste');
  if (!button) return;

  const storageKey = 'karaoke-tulum-high-contrast';
  let enabled = false;
  try { enabled = localStorage.getItem(storageKey) === 'true'; } catch (_) {}

  function applyHighContrast(active) {
    enabled = Boolean(active);
    document.body.classList.toggle('alto-contraste', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Desactivar simulación de alto contraste' : 'Activar simulación de alto contraste');
    button.title = enabled ? 'Desactivar alto contraste' : 'Activar alto contraste';
    try { localStorage.setItem(storageKey, String(enabled)); } catch (_) {}
  }

  applyHighContrast(enabled);
  button.addEventListener('click', function (event) {
    // Evita que el clic llegue al fondo del drawer y lo cierre antes de mostrar el resultado.
    event.stopPropagation();
    applyHighContrast(!enabled);
    if (window.KT && KT.toast) KT.toast(enabled ? 'Alto contraste activado: fondo negro, bordes amarillos y foco cian.' : 'Alto contraste desactivado.');
  });
})();
