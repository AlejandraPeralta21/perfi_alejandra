/* Filtro académico en cascada de tres niveles para Mi espacio.
   EJECUCIÓN: hilo principal del navegador; js/app.js importa este módulo una sola vez.
   CAMBIOS: área repuebla categoría; categoría repuebla detalle; resultado final se sanitiza antes de renderizarse. */
import { sanitizeHtml } from './security.js';

(function ($) {
  'use strict';

  const optionsByArea = {
    academico: [
      { value: 'diseno-web', label: 'Diseño Web II (SIS-0141)', details: [
        { value: 'ui', label: 'Interfaces web responsivas', description: 'Práctica de maquetación adaptable para que el portafolio funcione en laptop y celular.' },
        { value: 'jquery', label: 'Interacciones con jQuery', description: 'Filtros dinámicos, validaciones y componentes interactivos sin recargar la página.' }
      ] },
      { value: 'ingenieria', label: 'Ingeniería de Sistemas', details: [
        { value: 'ciberseguridad', label: 'Ciberseguridad', description: 'Quiero seguir aprendiendo sobre seguridad digital y buenas prácticas para proteger aplicaciones.' },
        { value: 'sistemas', label: 'Sistemas Informáticos', description: 'Estudié un Técnico Medio en Sistemas Informáticos y continúo mi formación en UPDS.' }
      ] }
    ],
    desarrollo: [
      { value: 'pwa', label: 'Arquitectura PWA', details: [
        { value: 'offline', label: 'Funcionamiento sin conexión', description: 'La aplicación conserva recursos y mensajes localmente para seguir disponible sin internet.' },
        { value: 'service-worker', label: 'Service Worker y caché', description: 'El Service Worker guarda recursos y permite actualizar la aplicación instalada.' }
      ] },
      { value: 'proyectos', label: 'Proyectos personales', details: [
        { value: 'velora', label: 'Velora · reserva de autos', description: 'Una página en la que practico cómo presentar vehículos y organizar reservas.' },
        { value: 'reposteria', label: 'Página de repostería', description: 'Proyecto web que está en proceso y que sigo desarrollando.' }
      ] }
    ]
  };

  const $area = $('#filterArea');
  const $category = $('#filterCategory');
  const $detail = $('#filterDetail');
  const $result = $('#filterResult');
  if (!$area.length || !$category.length || !$detail.length || !$result.length) return;

  function resetSelect($select, placeholder) {
    $select.empty().append(new Option(placeholder, '')).prop('disabled', true);
  }

  function fillSelect($select, options, placeholder) {
    resetSelect($select, placeholder);
    options.forEach(function (option) {
      $select.append(new Option(option.label, option.value));
    });
    $select.prop('disabled', false);
  }

  // Capa 1 controla las opciones disponibles en la capa 2 y limpia la capa 3 anterior.
  $area.off('change.asCascade').on('change.asCascade', function () {
    resetSelect($category, this.value ? 'Elige categoría' : 'Elige área primero');
    resetSelect($detail, 'Elige categoría');
    $result.text('Selecciona las opciones para explorar mis estudios y proyectos.');
    if (optionsByArea[this.value]) fillSelect($category, optionsByArea[this.value], 'Elige categoría');
  });

  // Capa 2 carga los detalles asociados a la combinación elegida en las dos primeras capas.
  $category.off('change.asCascade').on('change.asCascade', function () {
    resetSelect($detail, this.value ? 'Elige un detalle' : 'Elige categoría');
    $result.text('Selecciona un detalle para ver más información.');
    const category = (optionsByArea[$area.val()] || []).find(function (option) { return option.value === this.value; }, this);
    if (category) fillSelect($detail, category.details, 'Elige un detalle');
  });

  // Capa 3 presenta solo texto; la selección nunca se interpreta como HTML.
  $detail.off('change.asCascade').on('change.asCascade', function () {
    const category = (optionsByArea[$area.val()] || []).find(function (option) { return option.value === $category.val(); });
    const detail = category && category.details.find(function (option) { return option.value === this.value; }, this);
    const description = detail ? detail.description : 'Selecciona las opciones anteriores.';
    const cleanHtml = sanitizeHtml(description);
    $result.empty();
    // Solo DOMPurify autoriza HTML; si no cargó (por ejemplo en la primera apertura offline), se inserta texto plano.
    if (cleanHtml === null) $result.text(description);
    else $result.html(cleanHtml);
  });
})(jQuery);
