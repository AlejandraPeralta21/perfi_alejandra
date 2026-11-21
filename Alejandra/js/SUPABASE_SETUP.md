# Conectar Karaoke Tulum con Supabase

No necesitas instalar Supabase CLI para la primera conexión. El panel de Supabase se maneja desde el navegador; GitHub seguirá guardando el código y publicando la página.

## 1. Crear el proyecto

1. Abre [supabase.com/dashboard](https://supabase.com/dashboard) e inicia sesión. Puedes elegir GitHub si quieres usar la misma cuenta donde está tu repositorio.
2. Pulsa **New project** y crea un proyecto llamado `Karaoke Tulum`.
3. Elige una contraseña para la base de datos y guárdala en un lugar privado. Espera a que termine la creación.

## 2. Crear tablas y permisos

1. Abre el proyecto y entra a **SQL Editor**.
2. Crea una consulta nueva.
3. Abre `js/supabase/migrations/20261119000100_karaoke_schema.sql` en este proyecto, copia todo su contenido al editor SQL y pulsa **Run**.
4. En **Table Editor** deben aparecer `profiles`, `rooms`, `songs`, `reservations` y `activity_logs`. La migración activa RLS y agrega las cuatro salas del proyecto.
5. Ejecuta también `js/supabase/migrations/20261119000200_admin_and_auth_events.sql`; añade el permiso seguro para que el panel admin cree reservas y registra los accesos.

## 3. Obtener los datos públicos de conexión

1. En el dashboard, abre el diálogo **Connect** del proyecto (o **Settings → API Keys**).
2. Copia **Project URL** y **Publishable key**, que empieza con `sb_publishable_`.
3. Pega esos dos valores en `js/supabase-config.js`.

La Publishable key está diseñada para aparecer en el navegador. La protección real la hacen las políticas RLS. Nunca pongas en el frontend una clave `sb_secret_` o `service_role`.

## 4. Desplegar la función segura para administrar cuentas

El CRUD de usuarios de Auth requiere una Edge Function; su clave privilegiada nunca se coloca en el JavaScript del navegador.

1. En el Dashboard abre **Edge Functions → Deploy a new function → Via Editor**.
2. Crea la función `admin-users`.
3. Copia el contenido de `js/supabase/functions/admin-users/index.ts` al editor y pulsa **Deploy function**.
4. Conserva habilitada la verificación JWT predeterminada. La función verifica además que quien llama tenga rol `admin`.
5. Supabase inyecta las claves del proyecto a las Edge Functions. No copies ninguna Secret key al frontend ni al repositorio.

Consulta la [guía oficial del editor de Edge Functions](https://supabase.com/docs/guides/functions/quickstart-dashboard).

## 5. Crear la cuenta administradora

1. Crea tu usuario desde el formulario de registro de Karaoke Tulum (o desde **Authentication → Users**).
2. En **SQL Editor**, ejecuta esto cambiando el correo por el mismo que registraste:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('TU_CORREO_ADMIN');
```

El usuario queda como `user` por defecto. Solo el SQL del dashboard debe asignar `admin`; no se debe permitir que el formulario público cambie su propio rol.

## Estado de la aplicación

El login y registro usan Supabase Auth. Perfiles, salas, canciones, reservas y bitácoras se leen y guardan en Supabase. Las canciones de ejemplo se importan al iniciar sesión como administrador si la tabla todavía está vacía. Los datos antiguos de LocalStorage no se copian automáticamente a la nube.

Los cambios del proyecto pueden subirse a GitHub Pages. La seguridad de las tablas depende de RLS y la gestión privilegiada de usuarios vive en la Edge Function.

