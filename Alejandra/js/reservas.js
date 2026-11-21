/* Reservas: formulario y persistencia Supabase con respaldo local sin conexión. */
(function ($) {
  'use strict';
  const KT = window.KT = window.KT || {};

  const KEY = 'kt-reservas';
  let reserveTimer = null;
  let reserveSeconds = 30;
  let pendingReservation = null;
  const money = n => n + ' Bs';
  const room = id => (KT.ROOMS || []).find(r => r.id === id) || (KT.ROOMS || [])[0];

  const all = () => {
    if (KT.cloud && KT.cloud.enabled) return KT.cloud.reservations || [];
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
    catch (e) { return []; }
  };
  const save = list => { if (KT.cloud && KT.cloud.enabled) { KT.cloud.reservations = list; return; } try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
  const mine = () => {
    const user = KT.auth && KT.auth.current();
    return user ? all().filter(r => r.userId === user.id && r.status !== 'cancelled') : [];
  };

  const paintCountdown = () => {
    const minutes = Math.floor(reserveSeconds / 60);
    const seconds = reserveSeconds % 60;
    $('#reserveCountdown').text(String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0'));
  };
  // Detiene el interval de confirmación para que no siga activo después del modal.
  KT.stopReserveCountdown = function () {
    clearInterval(reserveTimer);
    reserveTimer = null;
  };
  function resetReserveStep() {
    pendingReservation = null;
    $('#rTitle').text('Reservar sala');
    $('#reserveConfirm').prop('hidden', true);
    $('#reserveForm').prop('hidden', false);
  }
  function startReserveCountdown() {
    // TEMPORIZADOR DE RESERVA: reinicia el interval y expira la confirmación tras 30 segundos.
    KT.stopReserveCountdown();
    reserveSeconds = 30;
    paintCountdown();
    reserveTimer = setInterval(function () {
      reserveSeconds -= 1;
      paintCountdown();
      if (reserveSeconds > 0) return;
      KT.stopReserveCountdown();
      pendingReservation = null;
      const $modal = $('#reserveModal');
      $modal.stop(true, true).fadeOut(300, function () {
        $(this).removeClass('open').attr('aria-hidden', 'true').css('display', '');
        if (KT.lastFocus && KT.lastFocus.focus) KT.lastFocus.focus();
      });
      KT.toast('Tarifa Flash Expirada');
    }, 1000);
  }

  function estimate() {
    const r = room($('#fRoom').val());
    if (!r) return;
    $('#fPrice').text(money(r.price * (+$('#fDur').val() || 1)));
    $('#fPeople').attr({ min: r.min, max: r.max });
    $('#peopleHint').text('Capacidad: ' + r.min + ' a ' + r.max + ' personas');
  }

  function fillUser() {
    const user = KT.auth && KT.auth.current();
    if (!user) return;
    if (!$('#fName').val()) $('#fName').val(user.name);
    if (!$('#fMail').val()) $('#fMail').val(user.email);
  }

  function showErrors($form, errors) {
    $form.find('[data-err]').each(function () { $(this).text(errors[$(this).data('err')] || ''); });
    const first = $form.find('.err:not(:empty)').first();
    if (first.length) first.prev('input').trigger('focus');
  }

  /* Abre el modal. Si no hay sesión, lleva al acceso y recuerda la intención. */
  KT.openReserve = function (id) {
    if (KT.auth && KT.auth.isAdmin()) {
      KT.toast('El administrador solo puede supervisar el sistema.');
      return;
    }
    if (!KT.auth || !KT.auth.isLogged()) {
      if (KT.auth) {
        KT.auth.pending = 'reservas';
        KT.go('login');
        KT.toast('Inicia sesión para reservar tu sala.');
      }
      return;
    }
    resetReserveStep();
    if (id) $('#fRoom').val(id);
    fillUser();
    estimate();
    KT.openModal('#reserveModal');
  };

  // XSS: los valores guardados en LocalStorage se crean como nodos y se imprimen con .text().
  KT.renderReservations = function () {
    const $box = $('#myReservations');
    if (!$box.length) return;
    const list = mine();

    if (!list.length) {
      $box.html('<div class="auth-empty reservation-list__empty">' + KT.ic('calendar') + '<h3>Todavía no tienes reservas</h3>' +
        '<p>Elige una sala, fecha y hora para guardar tu primera reserva.</p>' +
        '<button class="btn-gold" data-reserve="">Reservar sala</button></div>');
      return;
    }

    $box.empty();
    list.slice().reverse().forEach(r => {
      // Los datos guardados localmente también se consideran no confiables: renderizar como texto.
      const $top = $('<div>').addClass('reservation-card__header').append(
        $(KT.ic('sofa')),
        $('<h3>').addClass('reservation-card__title').text(String(r.roomName || 'Sala')),
        $('<span>').addClass('reservation-card__price').text(money(Number(r.price) || 0))
      );
      const $meta = $('<div>').addClass('reservation-card__details');
      [
        ['calendar', r.date],
        ['clock', `${r.time || ''} · ${Number(r.duration) || 0} h`],
        ['users', `${Number(r.people) || 0} personas`],
        ['user', r.name]
      ].forEach(([icon, value]) => {
        $meta.append($('<span>').append($(KT.ic(icon)), document.createTextNode(String(value || ''))));
      });
      const $cancel = $('<button>').addClass('reservation-card__cancel')
        .attr('data-cancel-res', String(r.id || '')).text('Cancelar reserva');
      $box.append($('<article>').addClass('reservation-card').append($top, $meta, $cancel));
    });
  };

  $(document).off('click.ktReservations', '[data-reserve]').on('click.ktReservations', '[data-reserve]', function () { KT.openReserve($(this).data('reserve')); });

  $(document).off('click.ktReservations', '[data-cancel-res]').on('click.ktReservations', '[data-cancel-res]', async function () {
    const id = $(this).data('cancel-res');
    const cancelled = all().find(r => r.id === id);
    if (KT.cloud && KT.cloud.enabled) {
      try { await KT.cloud.cancelReservation(id); await KT.cloud.refreshReservations(); }
      catch (error) { KT.toast(error.message || 'No se pudo cancelar la reserva.'); return; }
    } else save(all().filter(r => r.id !== id));
    if (KT.auth && KT.auth.record) KT.auth.record('Reserva cancelada', (cancelled ? cancelled.roomName + ' · ' + cancelled.date + ' ' + cancelled.time : 'Reserva ' + id));
    KT.renderReservations();
    if (KT.auth) KT.auth.syncUI();
    KT.toast('Reserva cancelada.');
  });

  $(function () {
    // PUNTO 4 · ANTI-XSS EN FORMULARIOS: las salas vienen de Supabase.
    // Se crean <option> como nodos y se escribe el rótulo con .text(), nunca concatenando HTML.
    const $roomSelect = $('#fRoom').empty();
    (KT.ROOMS || []).forEach(r => $('<option>').val(String(r.id || '')).text(String(r.name || 'Sala') + ' · ' + Number(r.price || 0) + ' Bs/hora').appendTo($roomSelect));

    let hours = '';
    for (let h = 12; h <= 23; h++) hours += '<option>' + String(h).padStart(2, '0') + ':00</option>';
    $('#fTime').html(hours);

    let durations = '';
    for (let d = 1; d <= 5; d++) durations += '<option value="' + d + '">' + d + ' ' + (d === 1 ? 'hora' : 'horas') + '</option>';
    $('#fDur').html(durations);

    const today = new Date();
    const minDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    $('#fDate').attr('min', minDate);

    $('#fRoom,#fDur').on('change', estimate);
    $('#fPhone').on('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 8); });

    $('#reserveForm').on('submit', function (e) {
      e.preventDefault();
      if (KT.auth && KT.auth.isAdmin()) {
        KT.toast('El administrador no puede crear reservas.');
        return;
      }
      const r = room($('#fRoom').val()), errors = {};

      if ($('#fName').val().trim().length < 3) errors.name = 'Escribe tu nombre completo.';
      if (!/^\d{8}$/.test($('#fPhone').val())) errors.phone = 'Ingresa un teléfono de 8 dígitos.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#fMail').val())) errors.mail = 'Ingresa un correo válido.';
      const date = $('#fDate').val();
      if (!date || date < minDate) errors.date = 'Elige una fecha desde hoy.';
      const people = +$('#fPeople').val();
      if (!people || people < r.min || people > r.max) errors.people = 'Esta sala admite de ' + r.min + ' a ' + r.max + ' personas.';

      showErrors($(this), errors);
      if (Object.keys(errors).length) return;

      const user = KT.auth && KT.auth.current();
      if (!user) {
        KT.closeModal($('#reserveModal'));
        KT.auth.pending = 'reservas';
        KT.go('login');
        KT.toast('Inicia sesión para guardar la reserva.');
        return;
      }

      const duration = +$('#fDur').val();
      const item = {
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        userId: user.id, roomId: r.id, roomName: r.name,
        name: $('#fName').val().trim(), phone: $('#fPhone').val(), mail: $('#fMail').val().trim(),
        date: date, time: $('#fTime').val(), people: people, duration: duration,
        price: r.price * duration, createdAt: new Date().toISOString()
      };
      pendingReservation = item;
      $('#confirmName').text(item.name);
      $('#confirmRoom').text(item.roomName);
      $('#confirmDateTime').text(item.date + ' · ' + item.time);
      $('#confirmPeople').text(item.people + ' personas');
      $('#confirmDuration').text(item.duration + (item.duration === 1 ? ' hora' : ' horas'));
      $('#confirmPrice').text(money(item.price));
      $('#rTitle').text('Confirmar reserva');
      $('#reserveForm').prop('hidden', true);
      $('#reserveConfirm').prop('hidden', false);
      startReserveCountdown();
    });

    $('#editPendingReservation').on('click', function () {
      KT.stopReserveCountdown();
      resetReserveStep();
    });

    $('#cancelPendingReservation').on('click', function () {
      KT.stopReserveCountdown();
      resetReserveStep();
      KT.closeModal($('#reserveModal'));
      KT.toast('Reserva cancelada.');
    });

    $('#confirmReservation').on('click', async function () {
      if (!pendingReservation) return;
      if (KT.auth && KT.auth.isAdmin()) {
        KT.stopReserveCountdown();
        resetReserveStep();
        KT.closeModal($('#reserveModal'));
        KT.toast('El administrador no puede crear reservas.');
        return;
      }
      const user = KT.auth && KT.auth.current();
      if (!user) {
        KT.stopReserveCountdown();
        resetReserveStep();
        KT.closeModal($('#reserveModal'));
        KT.toast('Inicia sesión para confirmar la reserva.');
        return;
      }
      const item = pendingReservation;
      if (KT.cloud && KT.cloud.enabled) {
        try {
          const saved = await KT.cloud.createReservation(item, user);
          item.status = saved.status;
          item.id = saved.id;
          KT.cloud.reservations = [saved].concat(all());
          if (saved.status !== 'pending') await KT.cloud.refreshReservations();
        } catch (error) {
          KT.toast(error.message || 'No se pudo guardar la reserva en Supabase.');
          return;
        }
      } else {
        const list = all(); list.push(item); save(list);
      }
      if (KT.auth && KT.auth.record) KT.auth.record('Nueva reserva', item.roomName + ' · ' + item.date + ' ' + item.time + ' · ' + item.name);
      KT.stopReserveCountdown();
      pendingReservation = null;
      KT.closeModal($('#reserveModal'));
      $('#reserveConfirm').prop('hidden', true);
      $('#reserveForm').prop('hidden', false)[0].reset();
      estimate();
      KT.renderReservations();
      if (KT.auth) KT.auth.syncUI();
      KT.go('mis-reservas');
      KT.toast(KT.cloud && KT.cloud.enabled ? (item.status === 'pending' ? 'Guardada localmente · pendiente de sincronización.' : 'Reserva guardada en Supabase.') : (navigator.onLine ? 'Reserva guardada en este dispositivo.' : 'Reserva guardada localmente · sin conexión.'));
    });

    // PUNTO 4 · La lista informativa también usa nodos y .text() para tratar nombres como texto.
    const $roomList = $('#resList').empty();
    (KT.ROOMS || []).forEach(r => {
      const $item = $('<li>');
      $item.append($('<span>').text(String(r.name || 'Sala') + ' · ' + Number(r.min || 0) + '-' + Number(r.max || 0) + ' personas'));
      $item.append($('<b>').text(Number(r.price || 0) + ' Bs/hora'));
      $roomList.append($item);
    });

    estimate();
    KT.renderReservations();
  });
})(jQuery);
