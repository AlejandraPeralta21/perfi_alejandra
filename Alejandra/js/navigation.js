/* Navegación entre vistas y menú lateral */
(function ($) {
  const KT = window.KT;
  const EXTRA = {
    historial: ['Mi bitácora', 'Actividad reciente de tu cuenta.'],
    contacto: ['Contacto', 'Estamos en La Paz. Escríbenos o visítanos para reservar tu próxima noche de karaoke.'],
    configuracion: ['Configuración', 'Por ahora puedes cambiar el tema con el interruptor del encabezado.']
  };
  // Datos de contacto de ejemplo. Edita estos valores cuando tengas los datos definitivos del local.
  const CONTACT_INFO = {
    phone: '+591 700 00000',
    whatsapp: '+591 700 00000',
    email: 'reservas@karaoketulum.example.com',
    address: 'Zona Sopocachi, La Paz, Bolivia',
    hours: 'Martes a domingo · 18:00 a 02:00 (lunes cerrado)'
  };
  const VIEWS = ['home', 'catalogo', 'salas', 'reservas', 'promociones', 'login', 'perfil', 'mis-reservas', 'admin'];
  // El contenedor desktop se presenta como marco PWA; dentro de él la navegación usa drawer.
  const isDrawer = () => innerWidth < 1024 || matchMedia('(min-width: 1024px) and (max-width: 1279px)').matches;

  function renderContact() {
    const digits = CONTACT_INFO.phone.replace(/\D/g, '');
    const whatsapp = CONTACT_INFO.whatsapp.replace(/\D/g, '');
    const $hero = $('#contactHero').empty();
    const leadRoom = KT.ROOMS && KT.ROOMS[0];
    if (leadRoom) {
      $('<img>').addClass('contact-hero__image').attr({ src: leadRoom.img, alt: 'Ambiente de ' + leadRoom.name, width: 1200, height: 560, loading: 'lazy', decoding: 'async' }).on('error', function () { $(this).remove(); }).appendTo($hero);
    }
    const $copy = $('<div>').addClass('contact-hero__copy').appendTo($hero);
    $('<span>').addClass('contact-hero__eyebrow').text('KARAOKE LOUNGE VIP · LA PAZ, BOLIVIA').appendTo($copy);
    $('<h3>').text('Tu próxima noche empieza aquí').appendTo($copy);
    $('<p>').text('Celebra, canta y comparte en un espacio privado pensado para disfrutar con tu grupo.').appendTo($copy);
    $('<a>').addClass('contact-hero__action').attr({ href: 'https://wa.me/' + whatsapp, target: '_blank', rel: 'noopener noreferrer' }).text('Escríbenos por WhatsApp ↗').appendTo($copy);
    $hero.prop('hidden', false);

    const items = [
      { icon: '☎', title: 'Llámanos', value: CONTACT_INFO.phone, href: 'tel:' + digits },
      { icon: '◉', title: 'WhatsApp', value: CONTACT_INFO.whatsapp, href: 'https://wa.me/' + whatsapp },
      { icon: '✉', title: 'Correo', value: CONTACT_INFO.email, href: 'mailto:' + CONTACT_INFO.email },
      { icon: '⌖', title: 'Ubicación', value: CONTACT_INFO.address, href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONTACT_INFO.address) },
      { icon: '◷', title: 'Horario', value: CONTACT_INFO.hours }
    ];
    const $box = $('#contactDetails').empty();
    items.forEach(item => {
      const $card = $('<article>').addClass('contact-card');
      $('<span>').addClass('contact-card__icon').attr('aria-hidden', 'true').text(item.icon).appendTo($card);
      const $content = $('<div>').addClass('contact-card__content').appendTo($card);
      $('<b>').addClass('contact-card__title').text(item.title).appendTo($content);
      if (item.href) {
        $('<a>').addClass('contact-card__value').attr({ href: item.href, target: item.href.startsWith('https:') ? '_blank' : null, rel: item.href.startsWith('https:') ? 'noopener noreferrer' : null }).text(item.value).appendTo($content);
      } else {
        $('<span>').addClass('contact-card__value').text(item.value).appendTo($content);
      }
      $box.append($card);
    });

    const $rooms = $('#contactRooms').empty();
    $('<div>').addClass('contact-rooms__heading').append(
      $('<div>').append($('<span>').text('VIVE LA EXPERIENCIA'), $('<h3>').text('Un espacio para cada ocasión')),
      $('<a>').attr('href', '#salas').attr('data-view', 'salas').text('Explorar salas ↗')
    ).appendTo($rooms);
    const $gallery = $('<div>').addClass('contact-rooms__gallery').appendTo($rooms);
    (KT.ROOMS || []).slice(0, 3).forEach(room => {
      const $tile = $('<article>').addClass('contact-room');
      $('<img>').attr({ src: room.img, alt: room.name, width: 640, height: 360, loading: 'lazy', decoding: 'async' }).on('error', function () { $(this).remove(); }).appendTo($tile);
      $('<span>').text(room.name).appendTo($tile);
      $gallery.append($tile);
    });
    $rooms.prop('hidden', false);
  }

  KT.menu = open => {
    $('body').toggleClass('menu-open', open);
    $('#burger').attr({ 'aria-expanded': open, 'aria-label': open ? 'Cerrar menú' : 'Abrir menú' });
    // ACCESIBILIDAD: un menú cerrado no debe recibir foco ni aparecer en el árbol accesible.
    const side = document.getElementById('side');
    if (side) {
      side.inert = !open;
      side.setAttribute('aria-hidden', String(!open));
      if (!open && side.contains(document.activeElement)) document.getElementById('burger').focus();
    }
  };

  KT.go = (key, mode) => {
    // auth.js decide si la vista requiere sesión (perfil, mis-reservas, historial).
    if (KT.auth && KT.auth.guard && KT.auth.guard(key) === false) return;
    const view = EXTRA[key] ? 'extra' : (VIEWS.includes(key) ? key : 'home');
    key = view === 'extra' ? key : view;
    if (EXTRA[key]) {
      $('#extraTitle').text(EXTRA[key][0]); $('#extraText').text(EXTRA[key][1]);
      const isContact = key === 'contacto';
      $('#contactDetails').prop('hidden', !isContact);
      $('#contactHero,#contactRooms').prop('hidden', !isContact);
      $('#personalLogs').prop('hidden', isContact);
      $('#view-extra .panel').toggleClass('contact-panel', isContact);
      $('#view-extra [data-reserve]').prop('hidden', isContact || key === 'historial');
      if (isContact) renderContact();
    }
    if (key === 'historial' && KT.renderPersonalLogs) KT.renderPersonalLogs();
    if (key === 'admin' && KT.renderAdmin) KT.renderAdmin();
    if (view === 'catalogo' && mode) KT.setMode(mode);
    $('.view').removeClass('active');
    $('#view-' + view).addClass('active').scrollTop(0);
    $('[data-view]').each(function () {
      const $e = $(this), m = $e.data('mode');
      $e.toggleClass('active', $e.data('view') === key && (!m || m === KT.state.mode));
    });
    $('#catToggle').toggleClass('active', key === 'catalogo');
    $('#catItem').toggleClass('open', key === 'catalogo');
    $('#catToggle').attr('aria-expanded', key === 'catalogo');
    $('.artist-card--active').removeClass('artist-card--active');
    try { history.replaceState(null, '', '#' + key + (view === 'catalogo' ? '' : '')); } catch (e) {}
    if (isDrawer()) KT.menu(false);
  };

  // HIDRATACIÓN: conserva el menú del HTML y conecta aquí sus eventos sin recrear el DOM.
  KT.initNav = () => {
    // La estructura del menú ya viene en el HTML; aquí solo conectamos interacciones,
    // sin recrear el DOM. .off() permite volver a inicializar la SPA sin duplicarlas.
    $('#burger,#overlay,#catToggle').off('.ktNavigation');
    $(document).off('.ktNavigation');
    $(window).off('.ktNavigation');
    let wasDrawer = isDrawer();
    KT.menu(!wasDrawer && !$('body').hasClass('admin-mode'));
    $('#burger').on('click.ktNavigation', () => KT.menu(!$('body').hasClass('menu-open')));
    $('#overlay').on('click.ktNavigation', () => KT.menu(false));
    $('#catToggle').on('click.ktNavigation', function () {
      const open = !$('#catItem').hasClass('open');
      $('#catItem').toggleClass('open', open); $(this).attr('aria-expanded', open);
    });
    $(document).on('click.ktNavigation', '[data-view]', function (e) { e.preventDefault(); KT.go($(this).data('view'), $(this).data('mode')); });
    $(document).on('keydown.ktNavigation', function (e) {
      if (e.key === 'Escape' && $('body').hasClass('menu-open') && isDrawer()) KT.menu(false);
    });
    $(window).on('resize.ktNavigation', () => {
      const d = isDrawer();
      if (d !== wasDrawer) { wasDrawer = d; KT.menu(!d && !$('body').hasClass('admin-mode')); }
      KT.renderCatalog();
    });
    // Indica que el menú está interactivo después de conectar sus controladores.
    $('#side').attr('data-hidratado', 'true');
    KT.go((location.hash || '#home').slice(1));
    // La vista de inicio debe abrir siempre desde su encabezado, incluso si
    // el navegador restauró una posición de desplazamiento anterior.
    requestAnimationFrame(() => {
      $('#view-home').scrollTop(0);
      $('#main').scrollTop(0);
      window.scrollTo(0, 0);
    });
  };
})(jQuery);
