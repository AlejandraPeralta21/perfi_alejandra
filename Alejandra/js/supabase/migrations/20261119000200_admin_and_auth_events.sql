-- Permite al administrador crear reservas desde el panel y a cada usuario
-- registrar solamente sus propios eventos de inicio/cierre de sesión.
drop policy if exists "reservations_admin_insert" on public.reservations;
create policy "reservations_admin_insert" on public.reservations
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "auth_events_insert_self" on public.activity_logs;
create policy "auth_events_insert_self" on public.activity_logs
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and action in ('Inicio de sesión', 'Cierre de sesión')
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.email = actor_email
        and p.full_name = actor_name
    )
  );

grant insert on public.activity_logs to authenticated;
