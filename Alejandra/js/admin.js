/* Panel exclusivo del administrador: CRUD Supabase para reservas/canciones/perfiles y bitácora SQL. */
(function ($) {
  'use strict';
  const KT = window.KT = window.KT || {};
  const RESERVATIONS_KEY = 'kt-reservas';
  const MUSIC_KEY = 'kt-admin-music';
  const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { KT.toast('No se pudo guardar en este dispositivo.'); return false; } };
  // PUNTO 4 · ANTI-XSS DEL PANEL: antes de formar filas HTML, codifica todos los valores
  // recuperados de Supabase (reservas, canciones, perfiles y bitácora). No interpolar datos
  // de usuario directamente en .html(); los nodos que no requieren markup usan .text().
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const date = value => { const d = new Date(value); return isNaN(d) ? '—' : d.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }); };
  const audit = (action, detail) => { if (KT.auth && KT.auth.record) KT.auth.record(action, detail); };
  const reservations = () => KT.cloud && KT.cloud.enabled ? KT.cloud.reservations : read(RESERVATIONS_KEY);
  const users = () => KT.cloud && KT.cloud.enabled ? KT.cloud.profiles : read('kt-users');
  const logs = () => KT.cloud && KT.cloud.enabled ? KT.cloud.logs : KT.auth.logs();

  function renderReservations() {
    const items = reservations().slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (!items.length) { $('#adminBookingTable').html('<div class="admin-empty">Todavía no hay reservas registradas.</div>'); return; }
    const rows = items.map(r => '<tr><td>' + esc(r.name) + '<small>' + esc(r.mail) + ' · ' + esc(r.phone) + '</small></td><td>' + esc(r.roomName) + '</td><td>' + esc(r.date) + ' · ' + esc(r.time) + '<small>Creada ' + date(r.createdAt) + '</small></td><td>' + esc(r.people) + '</td><td>' + esc(r.price) + ' Bs</td><td class="admin-actions"><button class="admin-row-edit" data-admin-res-edit="' + esc(r.id) + '">Editar</button><button class="admin-row-delete" data-admin-res-delete="' + esc(r.id) + '">Eliminar</button></td></tr>').join('');
    $('#adminBookingTable').html('<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Cliente</th><th>Sala</th><th>Fecha y hora</th><th>Personas</th><th>Total</th><th>Acciones</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
  }

  function renderMusic() {
    const query = String($('#adminMusicSearch').val() || '').trim().toLocaleLowerCase('es');
    const songs = KT.SONGS || [];
    const rows = songs.map((song, index) => ({ song, index })).filter(({ song }) => !query || (song.title + ' ' + song.artist).toLocaleLowerCase('es').includes(query));
    if (!rows.length) { $('#adminMusicTable').html('<div class="admin-empty">No se encontraron canciones.</div>'); return; }
    $('#adminMusicTable').html('<div class="admin-table-wrap admin-table-wrap--tall"><table class="admin-table"><thead><tr><th>Canción</th><th>Artista</th><th>Categorías</th><th>Acciones</th></tr></thead><tbody>' + rows.map(({ song, index }) => '<tr><td>' + esc(song.title) + '</td><td>' + esc(song.artist) + '</td><td>' + esc((song.cats || []).map(id => ((KT.CATS || []).find(category => category.id === id) || {}).name || id).join(', ') || '—') + '</td><td class="admin-actions"><button class="admin-row-edit" data-admin-music-edit="' + index + '">Editar</button><button class="admin-row-delete" data-admin-music-delete="' + index + '">Eliminar</button></td></tr>').join('') + '</tbody></table></div>');
  }

  function renderUsers() {
    const userRows = users();
    const allBookings = reservations();
    const current = KT.auth && KT.auth.current();
    const rows = userRows.map(u => '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + (u.role === 'admin' ? 'Administrador' : 'Usuario') + '</td><td>' + date(u.createdAt) + '</td><td>' + allBookings.filter(r => r.userId === u.id).length + '</td><td class="admin-actions"><button class="admin-row-edit" data-admin-user-edit="' + esc(u.id) + '">Editar</button>' + (current && current.id === u.id ? '<span class="muted">Cuenta actual</span>' : '<button class="admin-row-delete" data-admin-user-delete="' + esc(u.id) + '">Eliminar</button>') + '</td></tr>').join('');
    if (KT.cloud && KT.cloud.enabled) $('#adminUsers .admin-toolbar p').text('Administra cuentas de Supabase Auth y sus roles desde este panel.');
    $('#adminUserTable').html('<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registro</th><th>Reservas</th><th>Acciones</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">Sin usuarios registrados.</td></tr>') + '</tbody></table></div>');
  }

  function renderLogs() {
    const items = logs().slice().reverse();
    const rows = items.slice(0, 300).map(l => '<tr><td>' + date(l.at) + '</td><td>' + esc(l.userName) + '<small>' + esc(l.email) + '</small></td><td>' + esc(l.action) + '</td><td>' + esc(l.details) + '</td></tr>').join('');
    $('#adminLogTable').html('<div class="admin-table-wrap admin-table-wrap--tall"><table class="admin-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Todavía no hay eventos.</td></tr>') + '</tbody></table></div>');
  }

  KT.renderAdmin = function () {
    if (!$('#view-admin').length || !KT.auth || !KT.auth.isAdmin()) return;
    const bookings = reservations();
    const userRows = users();
    const logRows = logs();
    $('#adminStats').html('<article><b>' + bookings.length + '</b><span>Reservas</span></article><article><b>' + (KT.SONGS || []).length + '</b><span>Canciones</span></article><article><b>' + userRows.filter(u => u.role !== 'admin').length + '</b><span>Usuarios</span></article><article><b>' + logRows.length + '</b><span>Eventos en bitácora</span></article>');
    $('#adminResRoom').html((KT.ROOMS || []).map(room => '<option value="' + esc(room.id) + '">' + esc(room.name) + ' · ' + esc(room.price) + ' Bs/h</option>').join(''));
    $('#adminMusicCategory').html((KT.CATS || []).filter(category => category.id !== 'todos').map(category => '<option value="' + esc(category.id) + '">' + esc(category.name) + '</option>').join(''));
    renderReservations(); renderMusic(); renderUsers(); renderLogs();
  };

  function setTab(tab) {
    $('.admin-tab').each(function () {
      const selected = $(this).data('admin-tab') === tab;
      $(this).toggleClass('active', selected).attr('aria-selected', String(selected));
    });
    $('[data-admin-menu-tab]').each(function () { $(this).toggleClass('active', $(this).data('admin-menu-tab') === tab); });
    $('#adminBookings').prop('hidden', tab !== 'bookings');
    $('#adminMusic').prop('hidden', tab !== 'music');
    $('#adminUsers').prop('hidden', tab !== 'users');
    $('#adminLogs').prop('hidden', tab !== 'logs');
  }

  function resetReservationForm() { $('#adminReservationForm')[0].reset(); $('#adminReservationId').val(''); $('#adminReservationForm').prop('hidden', true); }
  function resetMusicForm() { $('#adminMusicForm')[0].reset(); $('#adminMusicIndex').val(''); $('#adminMusicSave').text('Agregar canción'); $('#cancelAdminMusicEdit').prop('hidden', true); }
  function resetUserForm() { $('#adminUserForm')[0].reset(); $('#adminUserId').val(''); $('#adminUserSave').text('Crear usuario'); $('#cancelAdminUserEdit').prop('hidden', true); }

  $(document).off('click.ktAdmin', '[data-admin-tab]').on('click.ktAdmin', '[data-admin-tab]', function () { setTab($(this).data('admin-tab')); });
  $(document).off('click.ktAdmin', '[data-admin-menu-tab]').on('click.ktAdmin', '[data-admin-menu-tab]', function () { setTab($(this).data('admin-menu-tab')); KT.menu(false); });
  $('#adminLogout').off('click.ktAdmin').on('click.ktAdmin', function () { $('#sideLogout').trigger('click'); });

  $('#newAdminReservation').off('click.ktAdmin').on('click.ktAdmin', function () {
    if (!KT.auth.isAdmin()) return;
    const firstRoom = KT.ROOMS[0] || { min: 1, max: 20 };
    resetReservationForm(); $('#adminReservationForm').prop('hidden', false); $('#adminResDate').val(new Date().toISOString().slice(0, 10)); $('#adminResPeople').attr({ min: firstRoom.min, max: firstRoom.max }).val(firstRoom.min); $('#adminReservationForm').find('input:visible').first().trigger('focus');
  });
  $('#cancelAdminReservation').off('click.ktAdmin').on('click.ktAdmin', resetReservationForm);
  $('#adminResRoom').off('change.ktAdmin').on('change.ktAdmin', function () { const room = KT.ROOMS.find(item => item.id === this.value); if (room) $('#adminResPeople').attr({ min: room.min, max: room.max }).val(room.min); });
  $('#adminReservationForm').off('submit.ktAdmin').on('submit.ktAdmin', async function (event) {
    event.preventDefault(); if (!KT.auth.isAdmin()) return;
    const list = reservations(), id = $('#adminReservationId').val(), room = KT.ROOMS.find(item => item.id === $('#adminResRoom').val());
    if (!room) return;
    const people = Number($('#adminResPeople').val()), duration = Number($('#adminResDuration').val());
    if (people < room.min || people > room.max || duration < 1 || duration > 5) { KT.toast('Verifica la capacidad de la sala (' + room.min + ' a ' + room.max + ') y la duración.'); return; }
    const index = list.findIndex(item => item.id === id);
    const linkedUser = index < 0 ? users().find(user => user.email.toLowerCase() === $('#adminResEmail').val().trim().toLowerCase()) : null;
    const reservation = {
      ...(index >= 0 ? list[index] : { id: 'r' + Date.now().toString(36), userId: linkedUser ? linkedUser.id : '' }),
      name: $('#adminResName').val().trim(), mail: $('#adminResEmail').val().trim(), phone: $('#adminResPhone').val().replace(/\D/g, '').slice(0, 8),
      roomId: room.id, roomName: room.name, date: $('#adminResDate').val(), time: $('#adminResTime').val(), people, duration, price: room.price * duration,
      createdAt: index >= 0 ? list[index].createdAt : new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    if (!/^\d{8}$/.test(reservation.phone)) { KT.toast('El teléfono debe tener 8 dígitos.'); return; }
    try {
      if (KT.cloud && KT.cloud.enabled) {
        if (index >= 0) await KT.cloud.updateReservation(id, reservation, reservation.userId);
        else await KT.cloud.createAdminReservation(reservation, linkedUser && linkedUser.id);
        await KT.cloud.refreshReservations(); await KT.cloud.refreshAdmin();
      } else {
        if (index >= 0) list[index] = reservation; else list.push(reservation);
        if (!write(RESERVATIONS_KEY, list)) return;
      }
      resetReservationForm(); KT.renderAdmin(); audit(index >= 0 ? 'Reserva editada por administrador' : 'Reserva creada por administrador', reservation.roomName + ' · ' + reservation.date + ' · ' + reservation.name);
    } catch (error) { KT.toast(error.message || 'No se pudo guardar la reserva.'); }
  });
  $(document).off('click.ktAdmin', '[data-admin-res-edit]').on('click.ktAdmin', '[data-admin-res-edit]', function () {
    const item = reservations().find(reservation => reservation.id === String($(this).data('admin-res-edit'))); if (!item || !KT.auth.isAdmin()) return;
    $('#adminReservationId').val(item.id); $('#adminResName').val(item.name); $('#adminResEmail').val(item.mail); $('#adminResPhone').val(item.phone); $('#adminResRoom').val(item.roomId); $('#adminResDate').val(item.date); $('#adminResTime').val(item.time); $('#adminResPeople').val(item.people).attr('max', (KT.ROOMS.find(room => room.id === item.roomId) || {}).max || 20); $('#adminResDuration').val(item.duration || 1); $('#adminReservationForm').prop('hidden', false).get(0).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $(document).off('click.ktAdmin', '[data-admin-res-delete]').on('click.ktAdmin', '[data-admin-res-delete]', async function () {
    if (!KT.auth.isAdmin() || !window.confirm('¿Eliminar esta reserva?')) return;
    const id = String($(this).data('admin-res-delete')), list = reservations(), item = list.find(reservation => reservation.id === id);
    try {
      if (KT.cloud && KT.cloud.enabled) { await KT.cloud.deleteReservation(id); await KT.cloud.refreshReservations(); await KT.cloud.refreshAdmin(); }
      else if (!write(RESERVATIONS_KEY, list.filter(reservation => reservation.id !== id))) return;
      KT.renderAdmin(); audit('Reserva eliminada por administrador', item ? item.roomName + ' · ' + item.date + ' · ' + item.name : id);
    } catch (error) { KT.toast(error.message || 'No se pudo eliminar la reserva.'); }
  });

  $('#adminMusicForm').off('submit.ktAdmin').on('submit.ktAdmin', async function (event) {
    event.preventDefault(); if (!KT.auth.isAdmin()) return;
    const indexValue = $('#adminMusicIndex').val(), index = indexValue === '' ? -1 : Number(indexValue);
    const categories = ($('#adminMusicCategory').val() || ['pop']).filter(id => KT.CATS.some(item => item.id === id));
    const song = { title: $('#adminMusicTitle').val().trim(), artist: $('#adminMusicArtist').val().trim(), cats: categories.length ? categories : ['pop'], subs: $('#adminMusicSubs').val().split(',').map(value => value.trim()).filter(Boolean), thumbnail: $('#adminMusicThumbnail').val().trim() };
    const firstCategory = KT.CATS.find(item => item.id === song.cats[0]) || KT.CATS[1];
    if (!song.subs.length) song.subs = firstCategory.subs.slice(0, 1);
    try {
      if (KT.cloud && KT.cloud.enabled) {
        const savedSong = await KT.cloud.saveSong(song, index >= 0 && KT.SONGS[index] ? KT.SONGS[index].id : null);
        if (index >= 0) KT.SONGS[index] = savedSong; else KT.SONGS.push(savedSong);
        await KT.cloud.refreshCatalog(); await KT.cloud.refreshAdmin();
      } else {
        if (index >= 0 && KT.SONGS[index]) KT.SONGS[index] = song; else KT.SONGS.push(song);
        if (!write(MUSIC_KEY, KT.SONGS)) return;
      }
    } catch (error) { KT.toast(error.message || 'No se pudo guardar la canción.'); return; }
    resetMusicForm(); KT.state.page = 1; KT.refresh(); KT.renderAdmin(); audit(index >= 0 ? 'Canción editada' : 'Canción agregada', song.title + ' · ' + song.artist);
  });
  $('#cancelAdminMusicEdit').off('click.ktAdmin').on('click.ktAdmin', resetMusicForm);
  $('#adminMusicSearch').off('input.ktAdmin').on('input.ktAdmin', renderMusic);
  $(document).off('click.ktAdmin', '[data-admin-music-edit]').on('click.ktAdmin', '[data-admin-music-edit]', function () {
    if (!KT.auth.isAdmin()) return;
    const index = Number($(this).data('admin-music-edit')), song = KT.SONGS[index]; if (!song) return;
    $('#adminMusicIndex').val(index); $('#adminMusicTitle').val(song.title); $('#adminMusicArtist').val(song.artist); $('#adminMusicCategory').val(song.cats || ['pop']); $('#adminMusicSubs').val((song.subs || []).join(', ')); $('#adminMusicThumbnail').val(song.thumbnail || ''); $('#adminMusicSave').text('Guardar cambios'); $('#cancelAdminMusicEdit').prop('hidden', false); $('#adminMusicForm').get(0).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $(document).off('click.ktAdmin', '[data-admin-music-delete]').on('click.ktAdmin', '[data-admin-music-delete]', async function () {
    if (!KT.auth.isAdmin() || !window.confirm('¿Eliminar esta canción del catálogo?')) return;
    const index = Number($(this).data('admin-music-delete')), song = KT.SONGS[index]; if (!song) return;
    try {
      if (KT.cloud && KT.cloud.enabled) { await KT.cloud.deleteSong(song.id); await KT.cloud.refreshCatalog(); await KT.cloud.refreshAdmin(); }
      else { KT.SONGS.splice(index, 1); if (!write(MUSIC_KEY, KT.SONGS)) return; }
    } catch (error) { KT.toast(error.message || 'No se pudo eliminar la canción.'); return; }
    KT.state.page = 1; KT.refresh(); KT.renderAdmin(); audit('Canción eliminada', song.title + ' · ' + song.artist);
  });

  $('#adminUserForm').off('submit.ktAdmin').on('submit.ktAdmin', async function (event) {
    event.preventDefault(); if (!KT.auth.isAdmin()) return;
    const result = await KT.auth.adminSaveUser({ id: $('#adminUserId').val(), name: $('#adminUserName').val().trim(), email: $('#adminUserEmail').val().trim(), role: $('#adminUserRole').val(), password: $('#adminUserPassword').val() });
    if (!result.ok) { KT.toast(result.error); return; }
    resetUserForm(); if (KT.cloud && KT.cloud.enabled) await KT.cloud.refreshAdmin(); KT.auth.syncUI(); KT.renderAdmin(); audit(result.created ? 'Usuario creado por administrador' : 'Usuario actualizado por administrador', result.user.name + ' · ' + result.user.email);
  });
  $('#cancelAdminUserEdit').off('click.ktAdmin').on('click.ktAdmin', resetUserForm);
  $(document).off('click.ktAdmin', '[data-admin-user-edit]').on('click.ktAdmin', '[data-admin-user-edit]', function () {
    if (!KT.auth.isAdmin()) return;
    const user = users().find(item => item.id === String($(this).data('admin-user-edit'))); if (!user) return;
    $('#adminUserId').val(user.id); $('#adminUserName').val(user.name); $('#adminUserEmail').val(user.email); $('#adminUserRole').val(user.role || 'user'); $('#adminUserPassword').val(''); $('#adminUserSave').text('Guardar cambios'); $('#cancelAdminUserEdit').prop('hidden', false); $('#adminUserForm').get(0).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $(document).off('click.ktAdmin', '[data-admin-user-delete]').on('click.ktAdmin', '[data-admin-user-delete]', async function () {
    if (!KT.auth.isAdmin() || !window.confirm('¿Eliminar esta cuenta de usuario?')) return;
    const result = await KT.auth.adminDeleteUser(String($(this).data('admin-user-delete')));
    if (!result.ok) { KT.toast(result.error); return; }
    if (KT.cloud && KT.cloud.enabled) await KT.cloud.refreshAdmin(); KT.auth.syncUI(); audit('Usuario eliminado por administrador', result.user.name + ' · ' + result.user.email);
  });

  $(function () { setTab('bookings'); KT.renderAdmin(); });
})(jQuery);
