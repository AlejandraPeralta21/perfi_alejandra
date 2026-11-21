/* Acceso demo local, mensajes del formulario y bitácora del sitio
   EJECUCIÓN: hilo principal del navegador; js/app.js lo importa después de jQuery.
   INICIO: al ejecutarse, busca los nodos del panel; si existen, enlaza acceso y renderizado local. */
(function () {
  'use strict';
  const ACCOUNT_KEY = 'as-admin-account-v1';
  const SESSION_KEY = 'as-admin-session-v1';
  const EVENT_KEY = 'as-site-event-log-v1';
  const MESSAGE_KEY = 'as-contact-messages';
  const setup = document.getElementById('adminSetup');
  const login = document.getElementById('adminLogin');
  const gate = document.getElementById('adminGate');
  const dashboard = document.getElementById('adminDashboard');
  if (!setup || !login || !gate || !dashboard) return;

  function readList(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch (error) { return []; }
  }
  function getAccount() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null'); }
    catch (error) { return null; }
  }
  function hex(bytes) { return Array.from(new Uint8Array(bytes)).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join(''); }
  async function hashPassword(password, salt) {
    if (!window.crypto || !crypto.subtle) throw new Error('SECURE_CONTEXT_REQUIRED');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + password));
    return hex(digest);
  }
  function newSalt() { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return hex(bytes); }
  function openSetup() { gate.hidden = false; dashboard.hidden = true; setup.hidden = false; login.hidden = true; }
  function openLogin() { gate.hidden = false; dashboard.hidden = true; setup.hidden = true; login.hidden = false; }
  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Fecha desconocida' : date.toLocaleString('es-BO');
  }

  function renderMessages() {
    const list = document.getElementById('messageList');
    if (!list) return;
    const messages = readList(MESSAGE_KEY);
    list.replaceChildren();
    document.getElementById('messageCount').textContent = String(messages.length);
    document.getElementById('messageTotal').textContent = messages.length + (messages.length === 1 ? ' recibido' : ' recibidos');
    document.getElementById('emptyMessages').hidden = messages.length > 0;
    messages.forEach(function (message) {
      const item = document.createElement('article'); item.className = 'admin-message card';
      const heading = document.createElement('div'); heading.className = 'admin-message-head';
      const name = document.createElement('strong'); name.textContent = message.name || 'Sin nombre';
      const time = document.createElement('time'); time.dateTime = message.createdAt || ''; time.textContent = formatTime(message.createdAt);
      heading.append(name, time);
      const email = document.createElement('p'); email.className = 'message-email'; email.textContent = message.email || '';
      const subject = document.createElement('h4'); subject.textContent = message.subject || 'Sin asunto';
      const body = document.createElement('p'); body.className = 'message-body'; body.textContent = message.message || '';
      item.append(heading, email, subject);
      const details = [
        message.phone ? 'Teléfono: ' + (message.countryCode || '') + ' ' + message.phone : '',
        message.reason ? 'Motivo: ' + message.reason : '',
        message.contactPreference ? 'Respuesta por: ' + message.contactPreference : '',
        message.syncStatus ? (message.syncStatus === 'synced' ? 'Sincronización completada' : 'Pendiente de sincronización') : ''
      ].filter(Boolean).join(' · ');
      if (details) {
        const meta = document.createElement('p'); meta.className = 'message-meta'; meta.textContent = details;
        item.appendChild(meta);
      }
      item.append(body); list.appendChild(item);
    });
  }

  function renderSiteLogs() {
    const list = document.getElementById('siteLogList');
    if (!list) return;
    const filter = document.getElementById('eventFilter').value;
    const entries = readList(EVENT_KEY).filter(function (entry) { return filter === 'all' || entry.category === filter; }).slice(0, 150);
    list.replaceChildren();
    document.getElementById('siteLogEmpty').hidden = entries.length > 0;
    entries.forEach(function (entry) {
      const row = document.createElement('li');
      const time = document.createElement('time'); time.dateTime = entry.createdAt || ''; time.textContent = formatTime(entry.createdAt);
      const detail = document.createElement('span'); detail.className = 'event-detail';
      detail.textContent = (entry.type || 'EVENTO') + ': ' + (entry.detail || '');
      row.append(time, detail); list.appendChild(row);
    });
  }
  function logSiteEvent(category, type, detail) {
    try {
      const entries = readList(EVENT_KEY);
      entries.unshift({ category: category, type: type, detail: detail, createdAt: new Date().toISOString() });
      localStorage.setItem(EVENT_KEY, JSON.stringify(entries.slice(0, 500)));
      renderSiteLogs();
    } catch (error) { /* El sitio sigue funcionando aunque el almacenamiento esté bloqueado. */ }
  }
  function labelOf(element) {
    return (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  }
  function showAdminPanel(name) {
    const messages = name === 'messages';
    document.getElementById('adminMessagesPanel').hidden = !messages;
    document.getElementById('adminLogsPanel').hidden = messages;
    document.querySelectorAll('[data-admin-panel]').forEach(function (button) {
      const active = button.dataset.adminPanel === name;
      button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active));
    });
    if (messages) renderMessages(); else renderSiteLogs();
  }
  function enterDashboard() {
    gate.hidden = true; dashboard.hidden = false;
    renderMessages(); renderSiteLogs(); showAdminPanel('logs');
  }

  $(setup).off('submit.asAdmin').on('submit.asAdmin', async function (event) {
    event.preventDefault();
    const username = document.getElementById('setupUsername').value.trim();
    const password = document.getElementById('setupPassword').value;
    const confirm = document.getElementById('setupPasswordConfirm').value;
    const status = document.getElementById('setupStatus');
    if (username.length < 3) { status.textContent = 'El usuario debe tener al menos 3 caracteres.'; return; }
    if (password.length < 8) { status.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
    if (password !== confirm) { status.textContent = 'Las contraseñas no coinciden.'; return; }
    try {
      const salt = newSalt(); const passwordHash = await hashPassword(password, salt);
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ username: username, salt: salt, passwordHash: passwordHash }));
      sessionStorage.setItem(SESSION_KEY, 'active'); status.textContent = ''; enterDashboard();
    } catch (error) { status.textContent = 'Este navegador no permite configurar el acceso aquí. Abre la página desde localhost o HTTPS.'; }
  });
  $(login).off('submit.asAdmin').on('submit.asAdmin', async function (event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const status = document.getElementById('loginStatus'); const account = getAccount();
    try {
      const candidate = account ? await hashPassword(password, account.salt) : '';
      if (!account || username !== account.username || candidate !== account.passwordHash) { status.textContent = 'Usuario o contraseña incorrectos.'; return; }
      sessionStorage.setItem(SESSION_KEY, 'active'); status.textContent = ''; enterDashboard();
    } catch (error) { status.textContent = 'No se pudo validar el acceso en este navegador.'; }
  });
  $('#adminLogout').off('click.asAdmin').on('click.asAdmin', function () {
    sessionStorage.removeItem(SESSION_KEY); document.getElementById('adminPassword').value = ''; openLogin();
  });
  $(dashboard).off('click.asAdmin', '[data-admin-panel]').on('click.asAdmin', '[data-admin-panel]', function () { showAdminPanel(this.dataset.adminPanel); });
  $('#eventFilter').off('change.asAdmin').on('change.asAdmin', renderSiteLogs);

  $(document).off('click.asAdminLog').on('click.asAdminLog', function (event) {
    const target = event.target.closest('a[data-target]');
    if (target && target.dataset.target !== 'admin') logSiteEvent('navigation', 'NAVEGACIÓN', 'Abrió la sección ' + target.dataset.target);
    const category = event.target.closest('.cat-card, #catTabs .tab');
    if (category) logSiteEvent('interests', 'CATEGORÍA', 'Seleccionó ' + labelOf(category));
    const subcategory = event.target.closest('.subchip');
    if (subcategory) logSiteEvent('interests', 'SUBCATEGORÍA', 'Seleccionó ' + labelOf(subcategory));
    const flip = event.target.closest('.flip-toggle');
    if (flip) logSiteEvent('cards', 'TARJETA', labelOf(flip));
    const page = event.target.closest('.page-nav');
    if (page && !page.disabled) logSiteEvent('cards', 'PAGINACIÓN', page.dataset.pageStep === '1' ? 'Avanzó a la página siguiente de tarjetas' : 'Volvió a la página anterior de tarjetas');
    const artist = event.target.closest('.artist-nav');
    if (artist && !artist.disabled) logSiteEvent('interests', 'ARTISTA', artist.dataset.artistStep === '1' ? 'Avanzó al artista siguiente' : 'Volvió al artista anterior');
    const galleryItem = event.target.closest('#gallery button, #gallery a, #gallery [role="button"]');
    if (galleryItem) logSiteEvent('gallery', 'GALERÍA', 'Abrió ' + labelOf(galleryItem));
    if (event.target.closest('#themeToggle')) logSiteEvent('appearance', 'TEMA', 'Cambió la apariencia de la página');
    if (event.target.closest('#menuBtn')) logSiteEvent('navigation', 'MENÚ', 'Abrió o cerró el menú de navegación');
  });
  $(document).off('as:form-invalid.asAdminLog').on('as:form-invalid.asAdminLog', function () { logSiteEvent('contact', 'FORMULARIO_INVÁLIDO', 'Intentó enviar el formulario con campos incompletos o incorrectos'); });
  $(document).off('as:messages-changed.asAdminLog').on('as:messages-changed.asAdminLog', function () {
    renderMessages(); logSiteEvent('contact', 'FORMULARIO_ENVIADO', 'Se guardó un mensaje desde Contacto');
  });
  $(document).off('as:messages-updated.asAdminLog').on('as:messages-updated.asAdminLog', renderMessages);
  $(window).off('storage.asAdminLog').on('storage.asAdminLog', function (event) {
    const storageEvent = event.originalEvent || event;
    if (storageEvent.key === MESSAGE_KEY) renderMessages();
    if (storageEvent.key === EVENT_KEY) renderSiteLogs();
  });

  if (sessionStorage.getItem(SESSION_KEY) === 'active' && getAccount()) enterDashboard();
  else if (getAccount()) openLogin();
  else openSetup();
})();
