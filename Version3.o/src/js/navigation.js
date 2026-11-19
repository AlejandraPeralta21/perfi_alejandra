/* ALEJANDRA SPACE · navegación por pantallas sin desplazamiento
   EJECUCIÓN: hilo principal del navegador; se importa desde src/js/app.js después de cargar jQuery.
   INICIO: DOM listo → hydrateNavigation enlaza menú y enlaces; clicks/cambios de tamaño actualizan la vista. */
(function ($) {
  'use strict';
  const $menu = $('#sideMenu'), $overlay = $('#overlay'), $btn = $('#menuBtn');

  function openMenu() {
    $menu.addClass('open').attr('aria-hidden', 'false');
    $overlay.addClass('open');
    $btn.attr({ 'aria-expanded': 'true', 'aria-label': 'Cerrar menú de navegación' });
    $('#menuClose').trigger('focus');
  }
  function closeMenu(returnFocus) {
    if (!$menu.hasClass('open')) return;
    $menu.removeClass('open').attr('aria-hidden', 'true');
    $overlay.removeClass('open');
    $btn.attr({ 'aria-expanded': 'false', 'aria-label': 'Abrir menú de navegación' });
    if (returnFocus) $btn.trigger('focus');
  }
  function goTo(id) {
    const target = document.getElementById(id);
    if (!target || !target.matches('main > section')) return;
    document.querySelectorAll('main > section').forEach(function (section) {
      const active = section === target;
      section.classList.toggle('screen-active', active);
      section.setAttribute('aria-hidden', String(!active));
      section.inert = !active;
    });
    target.querySelectorAll('.reveal').forEach(function (item) { item.classList.add('in'); });
    if (window.location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    $('.nav-link').each(function () {
      const active = $(this).data('target') === id;
      $(this).toggleClass('active', active);
      if (active) this.setAttribute('aria-current', 'page'); else this.removeAttribute('aria-current');
    });
  }
  function hydrateNavigation() {
    if ($menu.attr('data-hidratado') === 'true') return;

    $btn.off('click.asNavigation').on('click.asNavigation', function () { $menu.hasClass('open') ? closeMenu(true) : openMenu(); });
    $('#menuClose').off('click.asNavigation').on('click.asNavigation', function () { closeMenu(true); });
    $overlay.off('click.asNavigation').on('click.asNavigation', function () { closeMenu(true); });
    $(document).off('keydown.asNavigation').on('keydown.asNavigation', function (e) { if (e.key === 'Escape') closeMenu(true); });
    $(window).off('resize.asNavigation').on('resize.asNavigation', function () { if (window.innerWidth >= 900) closeMenu(false); });
    // El teclado móvil reduce VisualViewport; medimos esa zona para que Contacto pueda desplazarse sin quedar bajo la barra inferior.
    const viewport = window.visualViewport;
    function syncKeyboardViewport() {
      const editingContact = window.matchMedia('(max-width: 899px)').matches &&
        document.activeElement && document.activeElement.closest('#contacto .contact-form');
      document.documentElement.classList.toggle('keyboard-open', Boolean(editingContact));
      if (viewport && editingContact) {
        document.documentElement.style.setProperty('--keyboard-viewport-height', viewport.height + 'px');
      } else {
        document.documentElement.style.removeProperty('--keyboard-viewport-height');
      }
    }
    $(document).off('focusin.asKeyboard focusout.asKeyboard', '#contacto .contact-form input, #contacto .contact-form textarea, #contacto .contact-form select')
      .on('focusin.asKeyboard focusout.asKeyboard', '#contacto .contact-form input, #contacto .contact-form textarea, #contacto .contact-form select', function () {
        window.setTimeout(syncKeyboardViewport, 50);
      });
    if (viewport) {
      $(viewport).off('resize.asKeyboard scroll.asKeyboard').on('resize.asKeyboard scroll.asKeyboard', syncKeyboardViewport);
    }
    $(document).off('click.asNavigation', 'a[data-target]').on('click.asNavigation', 'a[data-target]', function (e) {
      e.preventDefault();
      closeMenu(false);
      goTo($(this).data('target'));
    });

    $menu.attr('data-hidratado', 'true');
  }
  $(function () {
    hydrateNavigation();
    // Limpia cualquier estado de teclado al cambiar de sección o al iniciar la vista.
    $(document).off('click.asKeyboardNav', 'a[data-target]').on('click.asKeyboardNav', 'a[data-target]', function () {
      window.setTimeout(function () {
        if (!document.activeElement || !document.activeElement.closest('#contacto .contact-form')) {
          document.documentElement.classList.remove('keyboard-open');
          document.documentElement.style.removeProperty('--keyboard-viewport-height');
        }
      }, 0);
    });
    const initial = window.location.hash.slice(1);
    goTo(document.getElementById(initial) ? initial : 'inicio');
  });
})(jQuery);
