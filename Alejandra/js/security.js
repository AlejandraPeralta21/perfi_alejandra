/* DOMPURIFY: sanitiza cada cadena que jQuery inserta como HTML.
   Los datos variables siguen escapándose antes de formar plantillas; DOMPurify añade
   una segunda defensa ante etiquetas, atributos de evento y URLs ejecutables.
   En este proyecto el CDN también se guarda en la caché del Service Worker. */
(function (window, $) {
  'use strict';
  const KT = window.KT = window.KT || {};
  const originalHTML = $.fn.html;

  KT.sanitizeHTML = markup => {
    const source = String(markup == null ? '' : markup);
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(source);
    }
    // Respaldo offline: las plantillas locales ya codifican los valores externos con escapeHTML/esc.
    return source;
  };

  // Sanitiza también las vistas creadas después de iniciar sesión, filtros y CRUD del administrador.
  $.fn.html = function (markup) {
    if (arguments.length === 0 || markup === undefined) return originalHTML.apply(this, arguments);
    if (typeof markup === 'function') {
      return originalHTML.call(this, function (index, oldHTML) {
        return KT.sanitizeHTML(markup.call(this, index, oldHTML));
      });
    }
    return originalHTML.call(this, typeof markup === 'string' ? KT.sanitizeHTML(markup) : markup);
  };

  // DOMPurify quita atributos onerror. Conservamos la retirada de imágenes rotas con delegación segura.
  document.addEventListener('error', function (event) {
    if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-remove-on-error')) {
      event.target.remove();
    }
  }, true);
})(window, window.jQuery);
