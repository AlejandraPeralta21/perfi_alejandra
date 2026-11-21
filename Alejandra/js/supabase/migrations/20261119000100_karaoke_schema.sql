-- Karaoke Tulum: tablas base, RLS y auditoría.
-- Ejecuta este archivo una sola vez desde Supabase Dashboard > SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key,
  name text not null,
  light text not null default '',
  capacity_min integer not null check (capacity_min > 0),
  capacity_max integer not null check (capacity_max >= capacity_min),
  price_per_hour numeric(10,2) not null check (price_per_hour >= 0),
  color text not null default '#d4af37',
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  categories text[] not null default '{}',
  subgenres text[] not null default '{}',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint songs_title_artist_unique unique (title, artist)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  room_id text not null references public.rooms(id) on update cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null check (customer_phone ~ '^[0-9]{8}$'),
  reservation_date date not null,
  start_time time not null,
  people_count integer not null check (people_count > 0),
  duration_hours integer not null check (duration_hours between 1 and 5),
  total_price numeric(10,2) not null default 0 check (total_price >= 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'Sistema',
  actor_email text not null default '',
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

-- Los usuarios nuevos siempre comienzan como user; el rol admin se asigna desde SQL seguro.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'user'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Función de autorización usada por las políticas RLS; el cliente no puede editar roles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- El precio se recalcula en la base, y no se confía en el precio enviado por el navegador.
create or replace function public.calculate_reservation_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_room public.rooms%rowtype;
begin
  select * into selected_room from public.rooms where id = new.room_id;
  if not found then raise exception 'La sala seleccionada no existe.'; end if;
  if not selected_room.is_active and not public.is_admin() then raise exception 'La sala no está disponible.'; end if;
  if new.people_count < selected_room.capacity_min or new.people_count > selected_room.capacity_max then
    raise exception 'La cantidad de personas no coincide con la capacidad de la sala.';
  end if;
  if new.reservation_date < current_date then raise exception 'No se puede reservar una fecha pasada.'; end if;
  new.total_price := selected_room.price_per_hour * new.duration_hours;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists before_reservation_price on public.reservations;
create trigger before_reservation_price
  before insert or update of room_id, people_count, duration_hours on public.reservations
  for each row execute function public.calculate_reservation_price();

-- Bitácora automática para cambios en las tablas principales.
create or replace function public.audit_karaoke_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  actor_name_value text;
  actor_email_value text;
  details_value text;
  action_value text;
begin
  if tg_op = 'DELETE' then row_data := to_jsonb(old); else row_data := to_jsonb(new); end if;
  select coalesce(full_name, 'Administrador'), coalesce(email, '')
    into actor_name_value, actor_email_value
    from public.profiles where id = (select auth.uid());
  actor_name_value := coalesce(actor_name_value, 'Sistema');
  actor_email_value := coalesce(actor_email_value, '');

  if tg_table_name = 'reservations' then
    action_value := 'Reserva ' || lower(tg_op);
    details_value := concat_ws(' · ', row_data ->> 'customer_name', row_data ->> 'room_id', row_data ->> 'reservation_date', row_data ->> 'start_time');
  elsif tg_table_name = 'songs' then
    action_value := 'Canción ' || lower(tg_op);
    details_value := concat_ws(' · ', row_data ->> 'title', row_data ->> 'artist');
  elsif tg_table_name = 'profiles' then
    action_value := 'Usuario ' || lower(tg_op);
    details_value := concat_ws(' · ', row_data ->> 'full_name', row_data ->> 'email');
  else
    action_value := tg_table_name || ' ' || lower(tg_op);
    details_value := row_data::text;
  end if;

  insert into public.activity_logs (actor_id, actor_name, actor_email, action, details)
  values ((select auth.uid()), actor_name_value, actor_email_value, action_value, details_value);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_reservations on public.reservations;
create trigger audit_reservations after insert or update or delete on public.reservations
  for each row execute function public.audit_karaoke_change();
drop trigger if exists audit_songs on public.songs;
create trigger audit_songs after insert or update or delete on public.songs
  for each row execute function public.audit_karaoke_change();
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.audit_karaoke_change();

-- Acceso público solo de lectura a salas activas y canciones. Todo cambio requiere rol admin.
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.songs enable row level security;
alter table public.reservations enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage" on public.profiles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "rooms_read_active" on public.rooms;
create policy "rooms_read_active" on public.rooms
  for select to anon, authenticated using (is_active or (select public.is_admin()));
drop policy if exists "rooms_admin_manage" on public.rooms;
create policy "rooms_admin_manage" on public.rooms
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "songs_read_public" on public.songs;
create policy "songs_read_public" on public.songs
  for select to anon, authenticated using (true);
drop policy if exists "songs_admin_manage" on public.songs;
create policy "songs_admin_manage" on public.songs
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "reservations_read_owner_or_admin" on public.reservations;
create policy "reservations_read_owner_or_admin" on public.reservations
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "reservations_create_owner" on public.reservations;
create policy "reservations_create_owner" on public.reservations
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'confirmed');
drop policy if exists "reservations_update_owner_or_admin" on public.reservations;
create policy "reservations_update_owner_or_admin" on public.reservations
  for update to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "reservations_delete_admin" on public.reservations;
create policy "reservations_delete_admin" on public.reservations
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "logs_read_admin" on public.activity_logs;
create policy "logs_read_admin" on public.activity_logs
  for select to authenticated using ((select public.is_admin()));

-- Revoca permisos amplios por defecto y concede solo lo que la aplicación necesita.
revoke all on public.profiles, public.rooms, public.songs, public.reservations, public.activity_logs from anon, authenticated;
grant select on public.rooms, public.songs to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.rooms, public.songs, public.reservations to authenticated;
grant select on public.activity_logs to authenticated;

insert into public.rooms (id, name, light, capacity_min, capacity_max, price_per_hour, color, sort_order)
values
  ('premium', 'Sala Premium', 'morada', 6, 8, 65, '#7a2cff', 1),
  ('vip', 'Sala VIP', 'azul', 8, 12, 100, '#2a52ff', 2),
  ('party', 'Sala Party', 'roja', 12, 20, 120, '#ff2a3d', 3),
  ('gold', 'Sala Gold', 'dorada', 4, 6, 85, '#d4af37', 4)
on conflict (id) do nothing;
