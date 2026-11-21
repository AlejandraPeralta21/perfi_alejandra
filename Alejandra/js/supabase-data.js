/* Acceso a datos Supabase. La interfaz conserva caché local para catálogo/offline. */
(function (window) {
  'use strict';
  const KT = window.KT = window.KT || {};
  const db = KT.cloud = { enabled: !!(KT.supabaseConfigured && KT.supabase), rooms: [], songs: [], reservations: [], profiles: [], logs: [] };
  const client = KT.supabase;
  const PENDING_RESERVATIONS = 'kt-pending-reservations';
  const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING_RESERVATIONS) || '[]'); } catch (_) { return []; } };
  const writePending = list => { try { localStorage.setItem(PENDING_RESERVATIONS, JSON.stringify(list)); } catch (_) {} };

  const fail = result => { if (result && result.error) throw result.error; return result && result.data; };
  const mapRoom = row => {
    const fallback = (KT.ROOMS || []).find(room => room.id === row.id) || {};
    return { ...fallback, id: row.id, name: row.name, light: row.light, min: row.capacity_min, max: row.capacity_max,
      price: Number(row.price_per_hour), color: row.color, img: row.image_url || fallback.img || '', active: row.is_active };
  };
  const mapSong = row => {
    const artist = (KT.ARTISTS || []).find(item => item.name === row.artist);
    return { id: row.id, title: row.title, artist: row.artist, cats: row.categories || (artist && artist.cats) || [],
      subs: row.subgenres || (artist && artist.subs) || [], thumbnail: row.thumbnail_url || (artist && artist.img) || '' };
  };
  const mapReservation = row => {
    const room = (KT.ROOMS || []).find(item => item.id === row.room_id) || {};
    return { id: row.id, userId: row.user_id, name: row.customer_name, mail: row.customer_email, phone: row.customer_phone,
      roomId: row.room_id, roomName: room.name || row.room_id, date: row.reservation_date,
      time: String(row.start_time || '').slice(0, 5), people: row.people_count, duration: row.duration_hours,
      price: Number(row.total_price), status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
  };
  const mapProfile = row => ({ id: row.id, name: row.full_name, email: row.email, role: row.role, createdAt: row.created_at });

  db.refreshCatalog = async function () {
    if (!db.enabled) return;
    if (!navigator.onLine) return;
    const [roomResult, songResult] = await Promise.all([
      client.from('rooms').select('*').eq('is_active', true).order('sort_order'),
      client.from('songs').select('*').order('artist').order('title')
    ]);
    const roomRows = fail(roomResult) || [];
    db.rooms = roomRows.map(mapRoom);
    if (db.rooms.length) KT.ROOMS = db.rooms;
    const songRows = fail(songResult) || [];
    if (songRows.length) {
      db.songs = songRows.map(mapSong);
      KT.SONGS = db.songs.slice();
      try { localStorage.setItem('kt-admin-music', JSON.stringify(KT.SONGS)); } catch (_) {}
    }
    if (KT.renderRooms) KT.renderRooms();
    $('[data-stat="rooms"]').text(String(KT.ROOMS.length));
    $('[data-stat="songs"]').text(songRows.length ? songRows.length.toLocaleString('es-BO') : '+1.200');
    if (KT.refresh) KT.refresh();
    if (KT.renderAdmin) KT.renderAdmin();
  };

  db.refreshReservations = async function () {
    if (!db.enabled || !KT.auth || !KT.auth.isLogged()) { db.reservations = []; return db.reservations; }
    if (!navigator.onLine) {
      try { db.reservations = JSON.parse(localStorage.getItem('kt-reservas') || '[]'); } catch (_) { db.reservations = []; }
      db.reservations = db.reservations.concat(readPending());
      return db.reservations;
    }
    const result = await client.from('reservations').select('*').order('created_at', { ascending: false });
    db.reservations = (fail(result) || []).map(mapReservation).concat(readPending());
    try { localStorage.setItem('kt-reservas', JSON.stringify(db.reservations)); } catch (_) {}
    return db.reservations;
  };

  db.refreshAdmin = async function () {
    if (!db.enabled || !KT.auth || !KT.auth.isAdmin()) return;
    if (!navigator.onLine) {
      try { db.profiles = JSON.parse(localStorage.getItem('kt-cloud-profiles') || '[]'); db.logs = JSON.parse(localStorage.getItem('kt-cloud-logs') || '[]'); } catch (_) {}
      if (KT.renderAdmin) KT.renderAdmin();
      return;
    }
    const [profiles, logs] = await Promise.all([
      client.from('profiles').select('*').order('created_at', { ascending: false }),
      client.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(300)
    ]);
    db.profiles = (fail(profiles) || []).map(mapProfile);
    db.logs = (fail(logs) || []).map(row => ({ id: row.id, userName: row.actor_name, email: row.actor_email,
      action: row.action, details: row.details, at: row.created_at }));
    try { localStorage.setItem('kt-cloud-profiles', JSON.stringify(db.profiles)); localStorage.setItem('kt-cloud-logs', JSON.stringify(db.logs)); } catch (_) {}
    if (KT.renderAdmin) KT.renderAdmin();
  };

  db.createReservation = async function (item, user) {
    if (!navigator.onLine) {
      const local = { ...item, id: 'offline-' + Date.now().toString(36), userId: user.id, status: 'pending' };
      writePending(readPending().concat(local));
      return local;
    }
    const result = await client.from('reservations').insert({ user_id: user.id, room_id: item.roomId,
      customer_name: item.name, customer_email: item.mail, customer_phone: item.phone,
      reservation_date: item.date, start_time: item.time, people_count: item.people, duration_hours: item.duration }).select().single();
    return mapReservation(fail(result));
  };
  db.syncPendingReservations = async function () {
    if (!db.enabled || !navigator.onLine || !KT.auth || !KT.auth.isLogged()) return;
    const pending = readPending();
    if (!pending.length) return;
    const remaining = [];
    for (const item of pending) {
      try { await db.createReservation({ ...item }, { id: item.userId }); }
      catch (_) { remaining.push(item); }
    }
    writePending(remaining);
    await db.refreshReservations();
    if (KT.auth) KT.auth.syncUI();
    if (remaining.length < pending.length) KT.toast('Reservas pendientes sincronizadas.');
  };
  db.createAdminReservation = async function (item, userId) {
    const result = await client.from('reservations').insert({ user_id: userId || null, room_id: item.roomId,
      customer_name: item.name, customer_email: item.mail, customer_phone: item.phone,
      reservation_date: item.date, start_time: item.time, people_count: item.people, duration_hours: item.duration }).select().single();
    return mapReservation(fail(result));
  };
  db.updateReservation = async function (id, item, userId) {
    const result = await client.from('reservations').update({ user_id: userId || null, room_id: item.roomId,
      customer_name: item.name, customer_email: item.mail, customer_phone: item.phone,
      reservation_date: item.date, start_time: item.time, people_count: item.people, duration_hours: item.duration })
      .eq('id', id).select().single();
    return mapReservation(fail(result));
  };
  db.cancelReservation = async function (id) {
    const result = await client.from('reservations').update({ status: 'cancelled' }).eq('id', id).select().single();
    return mapReservation(fail(result));
  };
  db.deleteReservation = async function (id) { fail(await client.from('reservations').delete().eq('id', id)); };

  db.saveSong = async function (song, id) {
    const payload = { title: song.title, artist: song.artist, categories: song.cats || [], subgenres: song.subs || [], thumbnail_url: song.thumbnail || null };
    const query = id ? client.from('songs').update(payload).eq('id', id) : client.from('songs').insert(payload);
    const result = await query.select().single();
    return mapSong(fail(result));
  };
  db.deleteSong = async function (id) { fail(await client.from('songs').delete().eq('id', id)); };
  db.logAuthEvent = async function (action, user) {
    if (!db.enabled || !user) return;
    fail(await client.from('activity_logs').insert({ actor_id: user.id, actor_name: user.name, actor_email: user.email, action, details: '' }));
  };
  db.seedSongsIfEmpty = async function () {
    if (!db.enabled || !KT.auth.isAdmin() || db.songs.length) return;
    const local = KT.SONGS || [];
    for (let start = 0; start < local.length; start += 100) {
      const batch = local.slice(start, start + 100).map(song => ({ title: song.title, artist: song.artist,
        categories: song.cats || [], subgenres: song.subs || [], thumbnail_url: song.thumbnail || null }));
      fail(await client.from('songs').upsert(batch, { onConflict: 'title,artist', ignoreDuplicates: true }));
    }
    await db.refreshCatalog();
  };
  db.saveProfile = async function (id, name, role) {
    const result = await client.from('profiles').update({ full_name: name, role }).eq('id', id).select().single();
    return mapProfile(fail(result));
  };
  db.manageAuthUser = async function (body) {
    const { data, error } = await client.functions.invoke('admin-users', { body });
    if (error) {
      let message = error.message;
      try { const details = await error.context.json(); message = details.error || message; } catch (_) {}
      throw new Error(message);
    }
    if (data && data.error) throw new Error(data.error);
    await db.refreshAdmin();
    return data;
  };

  db.bootstrap = async function () {
    if (!db.enabled) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;
    const result = await client.from('profiles').select('*').eq('id', data.session.user.id).single();
    let user;
    if (result.error) {
      if (navigator.onLine) throw result.error;
      try { user = JSON.parse(localStorage.getItem('kt-cloud-profile') || 'null'); } catch (_) {}
      if (!user || user.id !== data.session.user.id) return null;
    } else {
      user = mapProfile(result.data);
      try { localStorage.setItem('kt-cloud-profile', JSON.stringify(user)); } catch (_) {}
    }
    if (navigator.onLine) await db.refreshCatalog();
    try { db.profiles = JSON.parse(localStorage.getItem('kt-cloud-profiles') || '[]'); db.logs = JSON.parse(localStorage.getItem('kt-cloud-logs') || '[]'); } catch (_) {}
    return { session: data.session, user };
  };
  window.addEventListener('online', () => { db.syncPendingReservations().catch(error => console.warn('No se pudieron sincronizar reservas pendientes.', error)); });
})(window);
