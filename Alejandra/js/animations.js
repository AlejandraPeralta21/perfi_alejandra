/* Modales, toast, carrusel y animaciones de interfaz */
(function ($) {
  const KT = window.KT;
  let toastTimer = null;
  let modalFocusTimer = null;
  KT.openModal = sel => {
    const $m = $(sel); KT.lastFocus = document.activeElement;
    $m.addClass('open').attr('aria-hidden', 'false');
    clearTimeout(modalFocusTimer);
    modalFocusTimer = setTimeout(() => {
      if ($m.hasClass('open')) $m.find('.close').first().trigger('focus');
    }, 60);
  };
  // LIMPIEZA DE TEMPORIZADORES: al cerrar, cancela el foco pendiente y el contador de reservas.
  KT.closeModal = $m => {
    $m = $m && $m.length ? $m : $('.modal.open');
    clearTimeout(modalFocusTimer);
    modalFocusTimer = null;
    if ($m.is('#reserveModal') && KT.stopReserveCountdown) KT.stopReserveCountdown();
    $m.removeClass('open').attr('aria-hidden', 'true');
    if (KT.lastFocus && KT.lastFocus.focus) KT.lastFocus.focus();
  };
  // Evita acumular timeouts: cada aviso reemplaza el temporizador del aviso anterior.
  KT.toast = msg => {
    const $t = $('#toast').text(msg).addClass('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $t.removeClass('show'), 3200);
  };

  // PREVENCIÓN DE FUGAS: elimina los listeners de esta capa antes de registrar su único set delegado.
  $(document).off('.ktAnimations');
  $(document).on('click.ktAnimations', '.modal', function (e) { if (e.target === this) KT.closeModal($(this)); });
  $(document).on('click.ktAnimations', '.modal .close, .modal [data-close]', function () { KT.closeModal($(this).closest('.modal')); });
  $(document).on('keydown.ktAnimations', e => {
    if (e.key !== 'Escape') return;
    if ($('.modal.open').length) KT.closeModal();
    else if ($('body').hasClass('menu-open')) KT.menu(false);
  });

  $(document).on('click.ktAnimations', '.car-btn', function () {
    const el = $(this).siblings('.track')[0];
    el.scrollBy({ left: ($(this).hasClass('prev') ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' });
  });

  // Toque en la navegación inferior: animación ligera
  $(document).on('click.ktAnimations', '.bn', function () {
    const $b = $(this).removeClass('pop'); void this.offsetWidth; $b.addClass('pop');
  });
  // Toque fuera de una tarjeta activa la desactiva (celular)
  $(document).on('click.ktAnimations', e => { if (!$(e.target).closest('.artist-card').length) $('.artist-card--active').removeClass('artist-card--active'); });
})(jQuery);
