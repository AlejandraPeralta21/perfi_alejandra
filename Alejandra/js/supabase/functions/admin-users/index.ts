import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Método no permitido.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const readDefaultKey = (name: string) => {
    try { return JSON.parse(Deno.env.get(name) || '{}').default || ''; } catch { return ''; }
  };
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || readDefaultKey('SUPABASE_PUBLISHABLE_KEYS');
  const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || readDefaultKey('SUPABASE_SECRET_KEYS');
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!url || !publicKey || !adminKey || !token) return response({ error: 'Configuración de la función incompleta.' }, 500);

  const userClient = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return response({ error: 'Sesión inválida.' }, 401);
  const { data: profile, error: profileError } = await userClient.from('profiles').select('role').eq('id', authData.user.id).single();
  if (profileError || profile?.role !== 'admin') return response({ error: 'Acceso solo para administradores.' }, 403);

  let payload: { action?: string; id?: string; name?: string; email?: string; role?: string; password?: string };
  try { payload = await request.json(); } catch { return response({ error: 'Solicitud inválida.' }, 400); }
  const service = createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    if (payload.action === 'create') {
      const email = String(payload.email || '').trim().toLowerCase();
      const name = String(payload.name || '').trim();
      const password = String(payload.password || '');
      if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || password.length < 6) {
        return response({ error: 'Verifica nombre, correo y contraseña (mínimo 6 caracteres).' }, 400);
      }
      const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
      if (error) throw error;
      const { error: updateError } = await service.from('profiles').update({ full_name: name, role: payload.role === 'admin' ? 'admin' : 'user' }).eq('id', data.user.id);
      if (updateError) throw updateError;
      return response({ ok: true, id: data.user.id });
    }

    if (payload.action === 'update') {
      const id = String(payload.id || '');
      const name = String(payload.name || '').trim();
      const email = String(payload.email || '').trim().toLowerCase();
      if (!id || name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return response({ error: 'Datos de usuario inválidos.' }, 400);
      if (id === authData.user.id && payload.role !== 'admin') return response({ error: 'No puedes quitar el rol de tu cuenta activa.' }, 400);
      const password = String(payload.password || '');
      if (password && password.length < 6) return response({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
      const updates: { email: string; email_confirm: boolean; user_metadata: { full_name: string }; password?: string } = { email, email_confirm: true, user_metadata: { full_name: name } };
      if (password) updates.password = password;
      const { error: authUpdateError } = await service.auth.admin.updateUserById(id, updates);
      if (authUpdateError) throw authUpdateError;
      const { error } = await service.from('profiles').update({ full_name: name, email, role: payload.role === 'admin' ? 'admin' : 'user' }).eq('id', id);
      if (error) throw error;
      return response({ ok: true, id });
    }

    if (payload.action === 'delete') {
      const id = String(payload.id || '');
      if (!id || id === authData.user.id) return response({ error: 'No puedes eliminar la cuenta que estás usando.' }, 400);
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) throw error;
      return response({ ok: true, id });
    }
    return response({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'No se pudo completar la operación.' }, 400);
  }
});
