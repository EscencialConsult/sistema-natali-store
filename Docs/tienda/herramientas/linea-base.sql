-- ═══════════════════════════════════════════════════════════════════════
-- LÍNEA BASE DE LA BASE DE DATOS (SOLO LECTURA)
--
-- Para qué: sacar una "foto" de cómo está hoy la base de Renzo, para comparar después de aplicar
-- cualquier cambio de la tienda y demostrar que ningún objeto naty_* se tocó.
--
-- Es un único SELECT. No crea, no modifica ni borra nada. No trae datos de personas ni de ventas:
-- solo conteos, nombres de objetos y huellas (md5) de sus definiciones.
--
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run → copiar la única celda del resultado
-- (columna "linea_base") a un archivo .json.
-- ═══════════════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'generado_en', now(),
  'postgres', version(),
  'base', current_database(),
  'tamano_bytes', pg_database_size(current_database()),

  -- Cantidad de filas por tabla (informativo: las ventas legítimas lo hacen crecer).
  'filas', (
    select coalesce(jsonb_object_agg(c.relname,
             (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text::bigint), '{}'::jsonb)
      from pg_class c join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and c.relkind = 'r'
  ),

  -- Tablas y vistas: dueño, RLS, opciones y huella de la definición.
  'relaciones', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'nombre', c.relname,
             'tipo', case c.relkind when 'r' then 'tabla' when 'v' then 'vista' else c.relkind::text end,
             'dueno', pg_get_userbyid(c.relowner),
             'rls', c.relrowsecurity,
             'rls_forzado', c.relforcerowsecurity,
             'opciones', coalesce(c.reloptions::text, ''),
             'md5_vista', case when c.relkind = 'v' then md5(pg_get_viewdef(c.oid)) end
           ) order by c.relname), '[]'::jsonb)
      from pg_class c join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and c.relkind in ('r', 'v')
  ),

  'columnas', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tabla', table_name, 'columna', column_name, 'tipo', data_type, 'udt', udt_name,
             'nulo', is_nullable, 'default', column_default) order by table_name, ordinal_position), '[]'::jsonb)
      from information_schema.columns where table_schema = 'public'
  ),

  'politicas', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tabla', tablename, 'politica', policyname, 'cmd', cmd, 'roles', roles::text,
             'qual', qual, 'with_check', with_check) order by tablename, policyname), '[]'::jsonb)
      from pg_policies where schemaname = 'public'
  ),

  'funciones', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'nombre', p.proname, 'args', pg_get_function_identity_arguments(p.oid),
             'security_definer', p.prosecdef, 'dueno', pg_get_userbyid(p.proowner),
             'md5', md5(pg_get_functiondef(p.oid))) order by p.proname, p.oid), '[]'::jsonb)
      from pg_proc p join pg_namespace s on s.oid = p.pronamespace
     where s.nspname = 'public' and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  ),

  'permisos_tablas', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tabla', table_name, 'para', grantee, 'permiso', privilege_type)
             order by table_name, grantee, privilege_type), '[]'::jsonb)
      from information_schema.role_table_grants
     where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
  ),

  'permisos_funciones', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'funcion', routine_name, 'para', grantee, 'permiso', privilege_type)
             order by routine_name, grantee), '[]'::jsonb)
      from information_schema.routine_privileges
     where routine_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
  ),

  'enums', (
    select coalesce(jsonb_object_agg(typname, valores), '{}'::jsonb)
      from (select t.typname, jsonb_agg(e.enumlabel order by e.enumsortorder) as valores
              from pg_type t join pg_enum e on e.enumtypid = t.oid
              join pg_namespace n on n.oid = t.typnamespace
             where n.nspname = 'public' group by t.typname) x
  ),

  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tabla', c.relname, 'trigger', t.tgname, 'md5', md5(pg_get_triggerdef(t.oid)))
             order by c.relname, t.tgname), '[]'::jsonb)
      from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and not t.tgisinternal
  ),

  'indices', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tabla', tablename, 'indice', indexname, 'md5', md5(indexdef))
             order by tablename, indexname), '[]'::jsonb)
      from pg_indexes where schemaname = 'public'
  ),

  'restricciones', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tabla', c.relname, 'nombre', con.conname, 'tipo', con.contype::text,
             'md5', md5(pg_get_constraintdef(con.oid))) order by c.relname, con.conname), '[]'::jsonb)
      from pg_constraint con join pg_class c on c.oid = con.conrelid
      join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public'
  ),

  'extensiones', (
    select coalesce(jsonb_object_agg(extname, extversion), '{}'::jsonb) from pg_extension
  ),

  -- Solo los NOMBRES de las claves de configuración, nunca sus valores.
  'config_claves', (select coalesce(jsonb_agg(clave order by clave), '[]'::jsonb) from public.naty_config),

  -- Personas por rol, sin nombres ni teléfonos.
  'perfiles_por_rol', (
    select coalesce(jsonb_agg(jsonb_build_object('rol', rol::text, 'activo', activo, 'cantidad', n) order by rol::text, activo), '[]'::jsonb)
      from (select rol, activo, count(*) as n from public.naty_perfiles group by rol, activo) x
  ),

  'storage_buckets', (
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'publico', public) order by id), '[]'::jsonb)
      from storage.buckets
  ),
  'storage_objetos_por_bucket', (
    select coalesce(jsonb_object_agg(bucket_id, n), '{}'::jsonb)
      from (select bucket_id, count(*) as n from storage.objects group by bucket_id) x
  )
)) as linea_base;
