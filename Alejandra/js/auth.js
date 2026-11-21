/* Autenticación Supabase Auth; LocalStorage queda solo como modo demostración sin conexión al backend. */
(function ($) {
  'use strict';
  const KT = window.KT = window.KT || {};

  const USERS_KEY = 'kt-users';
  const SESSION_KEY = 'kt-session';
  const DEMO = { id: 'demo', name: 'Usuario Demo', email: 'demo@tulum.com', pass: 'demo1234' };
  const ADMIN = { id: 'admin', name: 'Administrador', email: 'admin@tulum.com', pass: 'admin1234', role: 'admin' };
  const LOG_KEY = 'kt-bitacora';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let activeCloudUser = null;

  const hash = value => {
    let h = 5381;
    const text = String(value || '');
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return 'kt$' + (h >>> 0).toString(16);
  };
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };
  const mail = value => String(value || '').trim().toLowerCase();
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const allUsers = () => read(USERS_KEY, []);
  function seedDemo() {
    const list = allUsers();
    if (!list.some(u => u.email === DEMO.email)) {
      list.unshift({ id: DEMO.id, name: DEMO.name, email: DEMO.email, pass: hash(DEMO.pass), createdAt: new Date().toISOString() });
      write(USERS_KEY, list);
    }
    const current = allUsers();
    if (!current.some(u => u.email === ADMIN.email)) {
      current.unshift({ id: ADMIN.id, name: ADMIN.name, email: ADMIN.email, pass: hash(ADMIN.pass), role: 'admin', createdAt: new Date().toISOString() });
      write(USERS_KEY, current);
    }
  }
  function log(action, details, user) {
    const entries = read(LOG_KEY, []);
    entries.push({ id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), action, details: String(details || ''), userId: user && user.id || '', userName: user && user.name || 'Visitante', email: user && user.email || '', at: new Date().toISOString() });
    write(LOG_KEY, entries.slice(-500));
  }

  const auth = KT.auth = {
    /* Vista a la que volver después de iniciar sesión (la fija Reservas). */
    pending: null,

    current() {
      if (KT.cloud && KT.cloud.enabled) return activeCloudUser;
      const id = read(SESSION_KEY, null);
      return id ? (allUsers().find(u => u.id === id) || null) : null;
    },
    isLogged() { return !!auth.current(); },
    isAdmin() { const u = auth.current(); return !!u && u.role === 'admin'; },
    logs() { return KT.cloud && KT.cloud.enabled ? KT.cloud.logs : read(LOG_KEY, []); },
    record(action, details, user) { if (!(KT.cloud && KT.cloud.enabled)) log(action, details, user || auth.current()); if (KT.renderAdmin) KT.renderAdmin(); },

    async adminSaveUser(data) {
      if (!auth.isAdmin()) return { ok: false, error: 'Acceso solo para administradores.' };
      if (KT.cloud && KT.cloud.enabled) {
        const email = mail(data.email), name = String(data.name || '').trim();
        if (name.length < 3 || !EMAIL_RE.test(email)) return { ok: false, error: 'Verifica el nombre y el correo.' };
        if (!data.id && String(data.password || '').length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
        if (data.id && data.password && String(data.password).length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
        const current = auth.current();
        if (current && current.id === String(data.id) && data.role !== 'admin') return { ok: false, error: 'No puedes quitar el rol de administrador de tu cuenta activa.' };
        try {
          const action = data.id ? 'update' : 'create';
          await KT.cloud.manageAuthUser({ action, id: String(data.id || ''), name, email, role: data.role, password: String(data.password || '') });
          const user = (KT.cloud.profiles || []).find(item => item.id === String(data.id || '')) || { name, email, role: data.role };
          if (activeCloudUser && activeCloudUser.id === user.id) {
            activeCloudUser = user;
            try { localStorage.setItem('kt-cloud-profile', JSON.stringify(activeCloudUser)); } catch (_) {}
          }
          return { ok: true, user, created: !data.id };
        } catch (error) { return { ok: false, error: error.message || 'No se pudo actualizar el perfil.' }; }
      }
      const list = allUsers(), id = String(data.id || ''), email = mail(data.email), name = String(data.name || '').trim();
      const existing = id ? list.find(user => user.id === id) : null;
      if (id && !existing) return { ok: false, error: 'No se encontró esa cuenta.' };
      const current = auth.current();
      if (existing && current && existing.id === current.id && data.role !== 'admin') return { ok: false, error: 'No puedes quitar el rol de administrador de tu cuenta activa.' };
      if (name.length < 3 || !EMAIL_RE.test(email)) return { ok: false, error: 'Verifica el nombre y el correo.' };
      if (list.some(user => user.email === email && user.id !== id)) return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
      const password = String(data.password || '');
      if (!existing && password.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
      if (password && password.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
      const user = {
        ...(existing || {}), id: existing ? existing.id : 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name, email, role: data.role === 'admin' ? 'admin' : 'user',
        pass: password ? hash(password) : existing && existing.pass,
        createdAt: existing ? existing.createdAt : new Date().toISOString()
      };
      if (existing) list[list.indexOf(existing)] = user; else list.push(user);
      write(USERS_KEY, list);
      return { ok: true, user, created: !existing };
    },

    async adminDeleteUser(id) {
      if (!auth.isAdmin()) return { ok: false, error: 'Acceso solo para administradores.' };
      if (KT.cloud && KT.cloud.enabled) {
        const user = KT.cloud.profiles.find(item => item.id === String(id));
        try { await KT.cloud.manageAuthUser({ action: 'delete', id: String(id) }); return { ok: true, user }; }
        catch (error) { return { ok: false, error: error.message || 'No se pudo eliminar la cuenta.' }; }
      }
      const list = allUsers(), user = list.find(item => item.id === id), current = auth.current();
      if (!user) return { ok: false, error: 'No se encontró esa cuenta.' };
      if (current && current.id === user.id) return { ok: false, error: 'No puedes eliminar la cuenta que estás usando.' };
      write(USERS_KEY, list.filter(item => item.id !== id));
      return { ok: true, user };
    },

    async login(email, password, role) {
      if (KT.cloud && KT.cloud.enabled) {
        try {
          const { data, error } = await KT.supabase.auth.signInWithPassword({ email: mail(email), password });
          if (error) throw error;
          const result = await KT.supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (result.error) throw result.error;
          const profile = result.data;
          if ((role === 'admin') !== (profile.role === 'admin')) {
            await KT.supabase.auth.signOut();
            throw new Error('El tipo de cuenta seleccionado no coincide con tu perfil.');
          }
          activeCloudUser = { id: profile.id, name: profile.full_name, email: profile.email, role: profile.role, createdAt: profile.created_at };
          try { localStorage.setItem('kt-cloud-profile', JSON.stringify(activeCloudUser)); } catch (_) {}
          try { await KT.cloud.logAuthEvent('Inicio de sesión', activeCloudUser); } catch (logError) { console.warn('No se pudo guardar el evento de acceso.', logError); }
          auth.syncUI();
          await KT.cloud.refreshReservations();
          if (auth.isAdmin()) { await KT.cloud.refreshAdmin(); await KT.cloud.seedSongsIfEmpty(); }
          await KT.cloud.syncPendingReservations();
          return { ok: true, user: activeCloudUser };
        } catch (error) { return { ok: false, error: error.message || 'No se pudo iniciar sesión.' }; }
      }
      seedDemo();
      const user = allUsers().find(u => u.email === mail(email));
      if (!user || user.pass !== hash(password) || (role === 'admin') !== (user.role === 'admin')) return { ok: false, error: 'Correo, contraseña o tipo de acceso incorrectos.' };
      write(SESSION_KEY, user.id);
      log('Inicio de sesión', 'Acceso como ' + (user.role === 'admin' ? 'administrador' : 'usuario'), user);
      auth.syncUI();
      return { ok: true, user: user };
    },

    async register(name, email, password) {
      if (KT.cloud && KT.cloud.enabled) {
        try {
          const { data, error } = await KT.supabase.auth.signUp({ email: mail(email), password, options: { data: { full_name: String(name).trim() } } });
          if (error) throw error;
          if (!data.session) return { ok: true, pendingConfirmation: true };
          const result = await KT.supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (result.error) throw result.error;
          const profile = result.data;
          activeCloudUser = { id: profile.id, name: profile.full_name, email: profile.email, role: profile.role, createdAt: profile.created_at };
          try { localStorage.setItem('kt-cloud-profile', JSON.stringify(activeCloudUser)); } catch (_) {}
          auth.syncUI();
          return { ok: true, user: activeCloudUser };
        } catch (error) { return { ok: false, error: error.message || 'No se pudo crear la cuenta.' }; }
      }
      seedDemo();
      const list = allUsers(), address = mail(email);
      if (list.some(u => u.email === address)) return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
      const user = {
        id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: String(name).trim(), email: address, pass: hash(password), createdAt: new Date().toISOString()
      };
      list.push(user);
      write(USERS_KEY, list);
      write(SESSION_KEY, user.id);
      log('Registro', 'Creó una cuenta', user);
      auth.syncUI();
      return { ok: true, user: user };
    },

    async logout() {
      if (KT.cloud && KT.cloud.enabled) {
        if (activeCloudUser) { try { await KT.cloud.logAuthEvent('Cierre de sesión', activeCloudUser); } catch (_) {} }
        const { error } = await KT.supabase.auth.signOut();
        if (error) return { ok: false, error: error.message };
        activeCloudUser = null;
        KT.cloud.reservations = [];
        auth.syncUI();
        return { ok: true };
      }
      const user = auth.current();
      if (user) log('Cierre de sesión', 'Cerró su sesión', user);
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      auth.syncUI();
    },

    /* Protege las vistas personales. Lo llama KT.go() antes de mostrar cualquier vista. */
    guard(key) {
      if (auth.isAdmin() && key !== 'admin') {
        KT.go('admin');
        return false;
      }
      if (key === 'admin') {
        if (auth.isAdmin()) return true;
        KT.go('login'); KT.toast('El panel está disponible solo para administradores.'); return false;
      }
      if (key === 'historial' && !auth.isAdmin()) {
        KT.go('home'); KT.toast('La bitácora está disponible solo para administradores.'); return false;
      }
      if (key === 'configuracion' && !auth.isAdmin()) {
        KT.go('home'); KT.toast('La configuración está disponible solo para administradores.'); return false;
      }
      if (['perfil', 'mis-reservas', 'historial'].indexOf(key) === -1 || auth.isLogged()) return true;
      auth.pending = key;
      KT.go('login');
      KT.toast('Inicia sesión para continuar.');
      return false;
    },

    clearErrors() { $('[data-auth-err]').text(''); },

    syncUI() {
      const user = auth.current(), logged = !!user;
      const wasAdmin = $('body').hasClass('admin-mode');
      const isAdmin = logged && user.role === 'admin';
      $('body').toggleClass('logged-in', logged);
      $('body').toggleClass('admin-mode', isAdmin);
      if (wasAdmin !== isAdmin && KT.menu) {
        const drawer = innerWidth < 1024 || matchMedia('(min-width:1024px) and (max-width:1279px)').matches;
        KT.menu(!isAdmin && !drawer);
      }
      $('#sideLogin').prop('hidden', logged);
      $('#sideLogout').prop('hidden', !logged);
      $('#sideAdmin').prop('hidden', !logged || user.role !== 'admin');
      $('#sideHistory').prop('hidden', !logged || user.role !== 'admin');
      $('#sideSettings').prop('hidden', !logged || user.role !== 'admin');
      $('#bnAccount span').text(logged ? (user.role === 'admin' ? 'Admin' : 'Mi cuenta') : 'Ingresar');
      $('#accountBtn').attr('aria-label', logged ? ('Mi cuenta: ' + user.name) : 'Iniciar sesión');
      const chip = $('#userChip').text(logged ? user.name : '').prop('hidden', !logged);
      chip.attr('title', logged ? user.name : '');
      if (KT.renderProfile) KT.renderProfile();
      if (KT.renderReservations) KT.renderReservations();
      if (KT.renderAdmin) KT.renderAdmin();
    }
  };

  function showErrors($form, errors) {
    $form.find('[data-auth-err]').each(function () { $(this).text(errors[$(this).data('auth-err')] || ''); });
    const first = $form.find('[data-auth-err]:not(:empty)').first();
    if (first.length) first.closest('.auth-field').find('input').trigger('focus');
  }

  function finish(user) {
    const target = auth.pending || (user.role === 'admin' ? 'admin' : 'perfil');
    auth.pending = null;
    KT.go(target);
    KT.toast('¡Bienvenido, ' + user.name.split(' ')[0] + '!');
    if (target === 'reservas' && KT.openReserve) KT.openReserve();
  }

  async function doLogout() {
    const result = await auth.logout();
    if (result && result.ok === false) { KT.toast(result.error); return; }
    KT.go('home');
    KT.toast('Cerraste sesión.');
  }

  /* Perfil: contenido según el estado de la sesión. */
  KT.renderProfile = function () {
    const $box = $('#profileBody');
    if (!$box.length) return;
    const user = auth.current();

    if (!user) {
      $box.html('<div class="auth-empty">' + KT.ic('lock') + '<h3>Aún no has iniciado sesión</h3>' +
        '<p>Ingresa o crea una cuenta para guardar tus reservas y ver tu historial.</p>' +
        '<button class="btn-gold" data-view="login">Iniciar sesión</button></div>');
      return;
    }

    const date = new Date(user.createdAt);
    const since = isNaN(date) ? '—' : date.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
    const count = KT.cloud && KT.cloud.enabled ? KT.cloud.reservations.filter(r => r.userId === user.id).length : read('kt-reservas', []).filter(r => r.userId === user.id).length;
    $box.html('<div class="profile-card">' +
      '<span class="avatar xl profile-avatar">' + KT.ic('user') + '</span>' +
      '<h3>' + esc(user.name) + '</h3><p class="profile-mail">' + esc(user.email) + '</p>' +
      '<div class="profile-stats"><div><b>' + count + '</b><small>Reservas guardadas</small></div>' +
      '<div><b>' + esc(since) + '</b><small>Miembro desde</small></div></div>' +
      '<div class="profile-actions"><button class="btn-gold sm" data-view="mis-reservas">Mis reservas</button>' +
      '<button class="btn-ghost sm" id="profileLogout">' + KT.ic('logout') + 'Cerrar sesión</button></div></div>');
  };

  /* ---- Eventos ---- */
  $(document).off('click.ktAuth', '.auth-tab').on('click.ktAuth', '.auth-tab', function () {
    const tab = $(this).data('auth-tab');
    $('.auth-tab').removeClass('active').attr('aria-selected', 'false');
    $(this).addClass('active').attr('aria-selected', 'true');
    $('.auth-pane').removeClass('active');
    $('#pane-' + tab).addClass('active');
    auth.clearErrors();
  });

  $('#loginForm').off('submit.ktAuth').on('submit.ktAuth', async function (e) {
    e.preventDefault();
    const email = $('#loginMail').val(), password = $('#loginPass').val(), errors = {};
    if (!EMAIL_RE.test(email)) errors.mail = 'Ingresa un correo válido.';
    if (!password) errors.pass = 'Ingresa tu contraseña.';
    showErrors($(this), errors);
    if (Object.keys(errors).length) return;
    const res = await auth.login(email, password, $('input[name="loginRole"]:checked').val());
    if (!res.ok) { showErrors($(this), { pass: res.error }); return; }
    this.reset();
    finish(res.user);
  });

  $('#registerForm').off('submit.ktAuth').on('submit.ktAuth', async function (e) {
    e.preventDefault();
    const name = $('#regName').val().trim(), email = $('#regMail').val(),
      password = $('#regPass').val(), confirm = $('#regPass2').val(), errors = {};
    if (name.length < 3) errors.name = 'Escribe tu nombre completo.';
    if (!EMAIL_RE.test(email)) errors.mail = 'Ingresa un correo válido.';
    if (password.length < 6) errors.pass = 'Mínimo 6 caracteres.';
    if (confirm !== password) errors.confirm = 'Las contraseñas no coinciden.';
    showErrors($(this), errors);
    if (Object.keys(errors).length) return;
    const res = await auth.register(name, email, password);
    if (!res.ok) { showErrors($(this), { mail: res.error }); return; }
    this.reset();
    if (res.pendingConfirmation) { KT.toast('Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.'); $('.auth-tab[data-auth-tab="login"]').trigger('click'); return; }
    $('.auth-tab[data-auth-tab="login"]').trigger('click');
    finish(res.user);
  });

  $('#sideLogout').off('click.ktAuth').on('click.ktAuth', doLogout);
  $(document).off('click.ktAuth', '#profileLogout').on('click.ktAuth', '#profileLogout', doLogout);

  $(function () {
    if (!(KT.cloud && KT.cloud.enabled)) seedDemo();
    auth.syncUI();
    if (KT.cloud && KT.cloud.enabled) {
      KT.cloud.bootstrap().then(async result => {
        activeCloudUser = result && result.user || null;
        auth.syncUI();
        if (activeCloudUser) {
          await KT.cloud.refreshReservations();
          if (auth.isAdmin()) { await KT.cloud.refreshAdmin(); await KT.cloud.seedSongsIfEmpty(); }
          await KT.cloud.syncPendingReservations();
          auth.syncUI();
        }
      }).catch(error => { console.error('Supabase:', error); KT.toast('No se pudo cargar Supabase. Revisa tu conexión y la configuración.'); });
      KT.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') { activeCloudUser = null; auth.syncUI(); return; }
        if (event === 'SIGNED_IN' && session && (!activeCloudUser || activeCloudUser.id !== session.user.id)) {
          window.setTimeout(async () => {
            try {
              const { data, error } = await KT.supabase.from('profiles').select('*').eq('id', session.user.id).single();
              if (error) throw error;
              activeCloudUser = { id: data.id, name: data.full_name, email: data.email, role: data.role, createdAt: data.created_at };
              try { localStorage.setItem('kt-cloud-profile', JSON.stringify(activeCloudUser)); } catch (_) {}
              auth.syncUI(); await KT.cloud.refreshReservations(); if (auth.isAdmin()) await KT.cloud.refreshAdmin();
            } catch (error) { console.error('Perfil Supabase:', error); }
          }, 0);
        }
      });
    }
    $(window).off('storage.ktAuth').on('storage.ktAuth', function (e) {
      const key = e.originalEvent && e.originalEvent.key;
      if (key === SESSION_KEY || key === USERS_KEY) auth.syncUI();
    });
  });
})(jQuery);
