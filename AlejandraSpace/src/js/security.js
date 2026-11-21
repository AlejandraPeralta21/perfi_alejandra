/* Seguridad de salida HTML para datos que puedan venir de API, almacenamiento o formularios.
   DOMPurify aplica una lista segura; sin conexión/CDN, el llamador debe insertar el valor como texto plano. */
export function sanitizeHtml(untrustedHtml) {
  const input = String(untrustedHtml == null ? '' : untrustedHtml);
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false
    });
  }
  // Sin biblioteca disponible, el llamador debe mostrar el contenido con textContent/.text(), nunca como HTML.
  return null;
}
