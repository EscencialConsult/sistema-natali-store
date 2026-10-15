-- ═══════════════════════════════════════════════════════════════════════════════
-- TIENDA PÚBLICA MAYORISTA · esquema ADITIVO (prefijo tienda_)
--
-- Reglas de este archivo (ver Docs/tienda/PLAN.md, regla 0 y decisiones D1 a D19):
--   · SOLO crea objetos nuevos `tienda_*`. No altera, reemplaza ni borra nada de `naty_*`.
--   · No tiene DELETE, DROP de tablas, TRUNCATE ni ALTER TYPE. Nada se borra: lo "oculto" es una marca.
--   · Es idempotente: se puede correr más de una vez.
--   · No se aplica a producción a mano: se usa app/scripts/aplicar-tienda.mjs, que lo corre en una
--     transacción, compara la estructura de `naty_*` antes y después, y revierte si algo cambió.
--   · No lee stock, costos, ventas ni personas (naty_perfiles, naty_movimientos_stock, naty_ventas).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Prerrequisito: el sistema de nota ya está aplicado.
do $$
begin
  if to_regclass('public.naty_productos') is null
     or to_regclass('public.naty_config') is null
     or to_regprocedure('public.naty_es_rol(naty_rol_usuario[])') is null then
    raise exception 'Falta el esquema del sistema de nota (naty_*). Aplicá naty_schema.sql antes que tienda_schema.sql.';
  end if;
end $$;

-- ── Configuración propia de la tienda ───────────────────────────────────────────
-- Una fila por clave. `publico = true` la deja leer a cualquiera (la ven las clientas); el resto solo la ve la administración.
-- Claves previstas: transferencia, como_comprar, locales, horarios, contactos, mapa.
-- No se borra: para "quitar" algo se guarda un valor vacío.
create table if not exists tienda_config (
  clave text primary key check (clave ~ '^[a-z0-9_]{1,60}$'),
  valor jsonb not null check (pg_column_size(valor) <= 20000),
  publico boolean not null default false,
  updated_at timestamptz not null default clock_timestamp()
);

-- ── Productos ocultos en la tienda ──────────────────────────────────────────────
-- Ocultar es EDITORIAL: saca el producto de la tienda, no de `naty_catalogo_publico` ni del bucket (siguen públicos).
-- Sin clave foránea a `naty_productos`: no se agregan triggers ni dependencias sobre tablas de Renzo.
create table if not exists tienda_oculto (
  producto_id uuid primary key,
  oculto boolean not null default true,
  creado_por uuid default auth.uid(),
  updated_at timestamptz not null default clock_timestamp()
);

-- `updated_at` lo pone el servidor.
create or replace function tienda_tocar_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists trg_tienda_config_upd on tienda_config;
create trigger trg_tienda_config_upd before update on tienda_config for each row execute function tienda_tocar_updated_at();
drop trigger if exists trg_tienda_oculto_upd on tienda_oculto;
create trigger trg_tienda_oculto_upd before update on tienda_oculto for each row execute function tienda_tocar_updated_at();

-- ── Vista pública del catálogo ──────────────────────────────────────────────────
-- Lista blanca de columnas. Sin stock, sin costos, sin colores (se vende por docena, sin color).
-- Un producto aparece si está activo, tiene al menos una foto y no está oculto.
-- El precio solo sale si la administración lo habilitó (`mostrar_precios_publico`), igual que `/c`.
-- Se pagina desde el cliente por (codigo, id). Se crea con el dueño de la base, como `naty_catalogo_publico`,
-- por eso proyecta columnas explícitas y usa security_barrier.
create or replace view tienda_catalogo_publico with (security_barrier = true) as
select
  p.id,
  p.codigo,
  p.nombre,
  p.categoria_id,
  c.nombre as categoria,
  p.descripcion,
  p.nuevo,
  case when coalesce((select valor = 'true'::jsonb from naty_config where clave = 'mostrar_precios_publico'), false)
       then p.precio_docena_usd_cent end as precio_docena_usd_cent,
  (select jsonb_agg(f.ruta order by f.orden, f.id) from naty_producto_fotos f
    where f.producto_id = p.id and length(trim(f.ruta)) > 0) as fotos
from naty_productos p
left join naty_categorias c on c.id = p.categoria_id
where p.activo
  and exists (select 1 from naty_producto_fotos f where f.producto_id = p.id and length(trim(f.ruta)) > 0)
  and not exists (select 1 from tienda_oculto o where o.producto_id = p.id and o.oculto);

-- ── Vista pública de ajustes (lista blanca, también dentro del JSON) ────────────
-- Una sola fila. Cada dato se valida: una tasa inválida (cero, texto) sale como NULL y la app muestra solo USD.
create or replace view tienda_ajustes_publicos with (security_barrier = true) as
select
  nullif(trim(coalesce((select valor ->> 'nombre' from naty_config where clave = 'negocio'), '')), '') as negocio_nombre,
  (select case when jsonb_typeof(valor -> 'bs') = 'number'
               then case when (valor ->> 'bs')::numeric > 0 then (valor ->> 'bs')::numeric end end
     from naty_config where clave = 'tipo_cambio') as tipo_cambio_bs,
  (select case when jsonb_typeof(valor -> 'ars') = 'number'
               then case when (valor ->> 'ars')::numeric > 0 then (valor ->> 'ars')::numeric end end
     from naty_config where clave = 'tipo_cambio') as tipo_cambio_ars,
  coalesce((select valor -> 'ejemplo' = 'true'::jsonb from naty_config where clave = 'tipo_cambio'), false) as tipo_cambio_es_ejemplo,
  (select nullif(valor ->> 'actualizado_en', '') from naty_config where clave = 'tipo_cambio') as tipo_cambio_actualizado_en,
  coalesce((select valor = 'true'::jsonb from naty_config where clave = 'mostrar_precios_publico'), false) as mostrar_precios,
  nullif(regexp_replace(coalesce((select valor #>> '{}' from naty_config where clave = 'whatsapp_tienda'), ''), '[^0-9]', '', 'g'), '') as whatsapp_tienda;

-- ── Seguridad a nivel de fila ───────────────────────────────────────────────────
alter table tienda_config enable row level security;
alter table tienda_oculto enable row level security;

-- tienda_config: cualquiera lee lo marcado público; la administración (admin y superadmin) lee todo y escribe.
-- No hay política de DELETE: nadie puede borrar filas desde la app.
drop policy if exists "tienda_config_publica_leer" on tienda_config;
create policy "tienda_config_publica_leer" on tienda_config for select to anon, authenticated using (publico);
drop policy if exists "tienda_config_admin_leer" on tienda_config;
create policy "tienda_config_admin_leer" on tienda_config for select to authenticated using (naty_es_rol('admin'));
drop policy if exists "tienda_config_admin_insertar" on tienda_config;
create policy "tienda_config_admin_insertar" on tienda_config for insert to authenticated with check (naty_es_rol('admin'));
drop policy if exists "tienda_config_admin_actualizar" on tienda_config;
create policy "tienda_config_admin_actualizar" on tienda_config for update to authenticated
  using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

-- tienda_oculto: solo la administración. Tampoco hay DELETE: "mostrar de nuevo" es poner oculto = false.
drop policy if exists "tienda_oculto_admin_leer" on tienda_oculto;
create policy "tienda_oculto_admin_leer" on tienda_oculto for select to authenticated using (naty_es_rol('admin'));
drop policy if exists "tienda_oculto_admin_insertar" on tienda_oculto;
create policy "tienda_oculto_admin_insertar" on tienda_oculto for insert to authenticated with check (naty_es_rol('admin'));
drop policy if exists "tienda_oculto_admin_actualizar" on tienda_oculto;
create policy "tienda_oculto_admin_actualizar" on tienda_oculto for update to authenticated
  using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

-- ── Privilegios mínimos (solo objetos tienda_*) ─────────────────────────────────
revoke all on table tienda_config, tienda_oculto, tienda_catalogo_publico, tienda_ajustes_publicos from public, anon, authenticated;
revoke all on function tienda_tocar_updated_at() from public, anon, authenticated;

grant select on tienda_catalogo_publico, tienda_ajustes_publicos to anon, authenticated;
grant select on tienda_config to anon, authenticated;
grant insert, update on tienda_config to authenticated;
grant select, insert, update on tienda_oculto to authenticated;
