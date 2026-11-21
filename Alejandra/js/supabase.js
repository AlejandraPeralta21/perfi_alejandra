/* Cliente Supabase del frontend estático. Requiere js/supabase-config.js y el SDK CDN. */
(function (window) {
  'use strict';
  const KT = window.KT = window.KT || {};
  const config = window.KT_SUPABASE_CONFIG || {};
  const sdk = window.supabase;
  const validUrl = typeof config.url === 'string' && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url.trim());
  const validKey = typeof config.publishableKey === 'string' && (/^sb_publishable_/.test(config.publishableKey.trim()) || /^eyJ/.test(config.publishableKey.trim()));

  KT.supabase = null;
  KT.supabaseConfigured = false;
  if (!validUrl || !validKey || !sdk || typeof sdk.createClient !== 'function') return;

  KT.supabase = sdk.createClient(config.url.trim().replace(/\/$/, ''), config.publishableKey.trim(), {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  KT.supabaseConfigured = true;
})(window);
