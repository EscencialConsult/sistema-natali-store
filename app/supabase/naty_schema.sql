-- ═══════════════════════════════════════════════════════════════════════
-- MODAS NATY — Notas de venta y catálogo · Esquema Supabase
-- Identificador (prefijo de todo lo que crea este archivo): naty
-- Instancia: PROVISORIA en el Supabase compartido de Área ID. Cuando el sistema esté
--            terminado se migra a una cuenta de Supabase de la clienta (ver SUPABASE-REGLAS.md).
--
-- ARCHIVO ÚNICO — regla fija de la skill `supabase-automatizacion-skill`:
--   · TODO cambio de base (tablas, columnas, políticas, índices) se agrega DIRECTO en este
--     archivo, como sección nueva al final, con comentario de fecha.
--   · NUNCA se crea un migration_*.sql aparte. NUNCA se toca la estructura desde el dashboard.
--   · Es siempre seguro correrlo ENTERO de punta a punta, las veces que haga falta
--     (todo usa IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS / ON CONFLICT).
--   · Solo agrega objetos con prefijo `naty_` (más la tabla maestra `proyectos`): no toca nada de
--     los otros proyectos que viven en la misma instancia.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar TODO el archivo → Run.
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 0 · TABLA MAESTRA `proyectos` (idéntica en el archivo de todos los proyectos)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists proyectos (
  id            uuid primary key default gen_random_uuid(),
  identificador text not null unique,
  nombre        text not null,
  descripcion   text not null default '',
  tablas        jsonb not null default '[]'::jsonb,
  link_github   text not null default '',
  link_web      text not null default '',
  estado        text not null default 'en_desarrollo',
  fecha_alta    timestamptz not null default now(),
  actualizado   timestamptz not null default now()
);

comment on table  proyectos is 'Registro central de los proyectos hospedados en esta instancia de Supabase. Cada identificador es el prefijo de las tablas de ese proyecto.';
comment on column proyectos.identificador is 'Slug corto en minusculas. Prefija TODAS las tablas y buckets del proyecto.';
comment on column proyectos.tablas is 'Array JSON con los nombres reales de las tablas y buckets del proyecto. Se actualiza al cerrar cada hito.';

create index if not exists idx_proyectos_identificador on proyectos(identificador);
create index if not exists idx_proyectos_estado        on proyectos(estado);

create or replace function set_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado = now();
  return new;
end;
$$;

drop trigger if exists trg_proyectos_actualizado on proyectos;
create trigger trg_proyectos_actualizado
  before update on proyectos
  for each row execute function set_actualizado();

alter table proyectos enable row level security;


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 1 · TIPOS Y TABLAS DE NATY (todo con prefijo `naty_`)
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type where typname = 'naty_rol_usuario') then
    create type naty_rol_usuario as enum ('admin', 'vendedor', 'enc_tienda', 'enc_ventas', 'enc_deposito');
  end if;
  if not exists (select 1 from pg_type where typname = 'naty_moneda') then
    create type naty_moneda as enum ('usd', 'ars', 'bs');
  end if;
  if not exists (select 1 from pg_type where typname = 'naty_metodo_pago') then
    create type naty_metodo_pago as enum ('efectivo', 'transferencia');
  end if;
  if not exists (select 1 from pg_type where typname = 'naty_tipo_movimiento') then
    create type naty_tipo_movimiento as enum ('entrada', 'salida', 'venta', 'anulacion', 'ajuste');
  end if;
  if not exists (select 1 from pg_type where typname = 'naty_estado_venta') then
    create type naty_estado_venta as enum ('activa', 'anulada');
  end if;
  if not exists (select 1 from pg_type where typname = 'naty_unidad_venta') then
    create type naty_unidad_venta as enum ('docena', 'unidad');
  end if;
end $$;

-- `updated_at` lo pone el servidor: la app descarga "lo cambiado desde la última vez" con ese campo.
create or replace function naty_tocar_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

-- Personas del sistema. El id es el del usuario de Supabase Auth. SOLO existe perfil si la administración lo creó
-- (naty_configurar_usuario): en esta instancia compartida hay usuarios de otros proyectos que NO deben entrar acá.
create table if not exists naty_perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  -- Únicas: forman el número de nota (NV-<iniciales>-0001). Si dos personas compartieran iniciales, sus números se pisarían.
  iniciales text not null unique check (length(iniciales) between 1 and 4),
  rol naty_rol_usuario not null,
  telefono text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists naty_categorias (
  id uuid primary key,
  nombre text not null unique check (length(trim(nombre)) > 0),
  orden integer not null default 0,
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists naty_productos (
  id uuid primary key,
  codigo text not null unique check (length(trim(codigo)) > 0),
  nombre text not null check (length(trim(nombre)) > 0),
  categoria_id uuid references naty_categorias (id),
  descripcion text not null default '',
  precio_docena_usd_cent integer not null check (precio_docena_usd_cent >= 0),
  nuevo boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default clock_timestamp()
);

-- Un color nunca se borra de verdad (el stock y las ventas apuntan a él): se marca `eliminado`.
create table if not exists naty_producto_colores (
  id uuid primary key,
  producto_id uuid not null references naty_productos (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  hex text not null default '#cccccc',
  orden integer not null default 0,
  eliminado boolean not null default false,
  updated_at timestamptz not null default clock_timestamp()
);

-- `ruta`: dirección pública de la foto en el bucket naty_productos (o una ruta dentro del bucket).
create table if not exists naty_producto_fotos (
  id uuid primary key,
  producto_id uuid not null references naty_productos (id) on delete cascade,
  orden integer not null default 0,
  ruta text not null,
  updated_at timestamptz not null default clock_timestamp()
);

-- Las ventas se anulan, nunca se borran. El número lo arma cada dispositivo (NV-<iniciales>-<correlativo>) para poder vender sin internet.
create table if not exists naty_ventas (
  id uuid primary key,
  numero text not null,
  vendedor_id uuid not null references naty_perfiles (id),
  vendedor_nombre text not null default '',
  moneda naty_moneda not null,
  tipo_cambio numeric(14, 4) not null check (tipo_cambio > 0),
  metodo_pago naty_metodo_pago not null,
  cliente_nombre text not null default '',
  cliente_telefono text not null default '',
  total_cent bigint not null check (total_cent >= 0),
  estado naty_estado_venta not null default 'activa',
  anulada_en timestamptz,
  anulacion_motivo text,
  creada_en timestamptz not null,
  updated_at timestamptz not null default clock_timestamp()
);

-- Copia de código, nombre y color al momento de la venta: la nota no cambia si el producto se edita después.
create table if not exists naty_venta_items (
  id uuid primary key,
  venta_id uuid not null references naty_ventas (id) on delete cascade,
  producto_id uuid not null references naty_productos (id),
  color_id uuid not null references naty_producto_colores (id),
  codigo text not null,
  nombre text not null,
  color_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  unidad naty_unidad_venta not null default 'docena',
  unidades integer not null check (unidades > 0),
  precio_cent bigint not null check (precio_cent >= 0),
  subtotal_cent bigint not null check (subtotal_cent >= 0)
);

-- El stock no es un número guardado: es la suma de movimientos (dos dispositivos que venden lo mismo se suman bien).
create table if not exists naty_movimientos_stock (
  id uuid primary key,
  producto_id uuid not null references naty_productos (id),
  color_id uuid not null references naty_producto_colores (id),
  tipo naty_tipo_movimiento not null,
  delta integer not null check (delta <> 0),
  motivo text not null default '',
  usuario_id uuid references naty_perfiles (id),
  venta_id uuid references naty_ventas (id),
  creado_en timestamptz not null,
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists naty_config (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default clock_timestamp()
);

-- Índices
create index if not exists idx_naty_productos_updated on naty_productos (updated_at);
create index if not exists idx_naty_colores_producto on naty_producto_colores (producto_id);
create index if not exists idx_naty_fotos_producto on naty_producto_fotos (producto_id);
create index if not exists idx_naty_ventas_vendedor_fecha on naty_ventas (vendedor_id, creada_en desc);
create index if not exists idx_naty_ventas_updated on naty_ventas (updated_at);
create index if not exists idx_naty_ventas_numero on naty_ventas (numero);
create index if not exists idx_naty_items_venta on naty_venta_items (venta_id);
create index if not exists idx_naty_mov_producto on naty_movimientos_stock (producto_id);
create index if not exists idx_naty_mov_color on naty_movimientos_stock (color_id);
create index if not exists idx_naty_mov_updated on naty_movimientos_stock (updated_at);
create index if not exists idx_naty_mov_venta on naty_movimientos_stock (venta_id);

-- updated_at automático
drop trigger if exists trg_naty_perfiles_upd on naty_perfiles;
create trigger trg_naty_perfiles_upd before update on naty_perfiles for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_categorias_upd on naty_categorias;
create trigger trg_naty_categorias_upd before update on naty_categorias for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_productos_upd on naty_productos;
create trigger trg_naty_productos_upd before update on naty_productos for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_colores_upd on naty_producto_colores;
create trigger trg_naty_colores_upd before update on naty_producto_colores for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_fotos_upd on naty_producto_fotos;
create trigger trg_naty_fotos_upd before update on naty_producto_fotos for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_ventas_upd on naty_ventas;
create trigger trg_naty_ventas_upd before update on naty_ventas for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_mov_upd on naty_movimientos_stock;
create trigger trg_naty_mov_upd before update on naty_movimientos_stock for each row execute function naty_tocar_updated_at();
drop trigger if exists trg_naty_config_upd on naty_config;
create trigger trg_naty_config_upd before update on naty_config for each row execute function naty_tocar_updated_at();

-- Cambiar colores o fotos "toca" al producto, para que la descarga incremental lo incluya.
create or replace function naty_tocar_producto() returns trigger language plpgsql as $$
begin
  update naty_productos set updated_at = clock_timestamp() where id = coalesce(new.producto_id, old.producto_id);
  return coalesce(new, old);
end $$;
drop trigger if exists trg_naty_colores_toca on naty_producto_colores;
create trigger trg_naty_colores_toca after insert or update or delete on naty_producto_colores for each row execute function naty_tocar_producto();
drop trigger if exists trg_naty_fotos_toca on naty_producto_fotos;
create trigger trg_naty_fotos_toca after insert or update or delete on naty_producto_fotos for each row execute function naty_tocar_producto();


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 2 · FUNCIONES (rol del usuario, ventas, anulaciones, productos, alta de personas, catálogo público)
-- ═══════════════════════════════════════════════════════════════════════

-- ¿La persona que consulta es parte de Modas Naty? En esta instancia hay usuarios de OTROS proyectos: sin perfil activo no ven nada.
create or replace function naty_es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from naty_perfiles where id = auth.uid() and activo)
$$;

create or replace function naty_rol_actual() returns naty_rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from naty_perfiles where id = auth.uid() and activo
$$;

create or replace function naty_es_rol(variadic roles naty_rol_usuario[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(naty_rol_actual() = any (roles), false)
$$;

-- Alta/edición de una persona del equipo. La ejecuta quien administra el proyecto desde el SQL Editor (o un script con la clave
-- de servicio). NADIE desde la app puede llamarla. NO hay trigger automático sobre auth.users: en la instancia compartida cada
-- usuario nuevo de otro proyecto se habría convertido en vendedor de Modas Naty.
create or replace function naty_configurar_usuario(
  p_email text,
  p_rol naty_rol_usuario,
  p_nombre text,
  p_iniciales text,
  p_telefono text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'No existe un usuario con el correo %. Crealo primero en Authentication → Users.', p_email using errcode = '02000';
  end if;

  insert into naty_perfiles (id, nombre, iniciales, rol, telefono, activo)
  values (v_id, trim(p_nombre), upper(trim(p_iniciales)), p_rol, nullif(trim(coalesce(p_telefono, '')), ''), true)
  on conflict (id) do update
    set nombre = excluded.nombre, iniciales = excluded.iniciales, rol = excluded.rol,
        telefono = coalesce(excluded.telefono, naty_perfiles.telefono), activo = true;
  return v_id;
end $$;

-- Registrar una venta. La app la manda desde el dispositivo (a veces horas después de hacerla, por la mala conexión):
--  · idempotente (reenviar la misma venta no la duplica) · todo o nada (venta + ítems + descuento de stock)
--  · el servidor revisa permiso, titularidad y que el total coincida con los ítems.
-- p = { id, numero, vendedor_id, vendedor_nombre, moneda, tipo_cambio, metodo_pago, cliente_nombre, cliente_telefono,
--       total_cent, creada_en, items: [ { id, producto_id, color_id, codigo, nombre, color_nombre, cantidad, unidad, unidades,
--       precio_cent, subtotal_cent } ], movimientos: [ { id, producto_id, color_id, delta, motivo, creado_en } ] }
create or replace function naty_registrar_venta(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_vendedor uuid := (p ->> 'vendedor_id')::uuid;
  v_calculado bigint;
  v_item jsonb;
  v_mov jsonb;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if not naty_es_rol('admin', 'vendedor', 'enc_tienda', 'enc_ventas') then
    raise exception 'Tu rol no puede registrar ventas' using errcode = '42501';
  end if;
  if v_vendedor <> auth.uid() and not naty_es_rol('admin') then
    raise exception 'La venta debe quedar a nombre de quien la registra' using errcode = '42501';
  end if;
  if exists (select 1 from naty_ventas where id = v_id) then
    return v_id;
  end if;
  if coalesce(jsonb_array_length(p -> 'items'), 0) = 0 then
    raise exception 'La venta no tiene productos' using errcode = '22023';
  end if;

  select coalesce(sum((i ->> 'cantidad')::int * (i ->> 'precio_cent')::bigint), 0)
    into v_calculado from jsonb_array_elements(p -> 'items') i;
  if v_calculado <> (p ->> 'total_cent')::bigint then
    raise exception 'El total (%) no coincide con la suma de los productos (%)', p ->> 'total_cent', v_calculado using errcode = '22023';
  end if;

  insert into naty_ventas (id, numero, vendedor_id, vendedor_nombre, moneda, tipo_cambio, metodo_pago, cliente_nombre, cliente_telefono, total_cent, creada_en)
  values (v_id, p ->> 'numero', v_vendedor, coalesce(p ->> 'vendedor_nombre', ''), (p ->> 'moneda')::naty_moneda, (p ->> 'tipo_cambio')::numeric,
          (p ->> 'metodo_pago')::naty_metodo_pago, coalesce(p ->> 'cliente_nombre', ''), coalesce(p ->> 'cliente_telefono', ''),
          (p ->> 'total_cent')::bigint, (p ->> 'creada_en')::timestamptz);

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    insert into naty_venta_items (id, venta_id, producto_id, color_id, codigo, nombre, color_nombre, cantidad, unidad, unidades, precio_cent, subtotal_cent)
    values ((v_item ->> 'id')::uuid, v_id, (v_item ->> 'producto_id')::uuid, (v_item ->> 'color_id')::uuid, v_item ->> 'codigo', v_item ->> 'nombre',
            v_item ->> 'color_nombre', (v_item ->> 'cantidad')::int, (v_item ->> 'unidad')::naty_unidad_venta, (v_item ->> 'unidades')::int,
            (v_item ->> 'precio_cent')::bigint, (v_item ->> 'subtotal_cent')::bigint);
  end loop;

  -- Los movimientos conservan el id que les puso el dispositivo: así, al descargar, no se cuentan dos veces.
  for v_mov in select * from jsonb_array_elements(coalesce(p -> 'movimientos', '[]'::jsonb)) loop
    if (v_mov ->> 'delta')::int >= 0 then
      raise exception 'Un movimiento de venta debe restar stock' using errcode = '22023';
    end if;
    insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, usuario_id, venta_id, creado_en)
    values ((v_mov ->> 'id')::uuid, (v_mov ->> 'producto_id')::uuid, (v_mov ->> 'color_id')::uuid, 'venta', (v_mov ->> 'delta')::int,
            coalesce(v_mov ->> 'motivo', ''), v_vendedor, v_id, (v_mov ->> 'creado_en')::timestamptz);
  end loop;

  return v_id;
end $$;

-- Anular una venta (solo administración). Idempotente. p = { id, motivo, anulada_en, movimientos: [ {id, producto_id, color_id, delta, motivo, creado_en} ] }
create or replace function naty_anular_venta(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_mov jsonb;
begin
  if not naty_es_rol('admin') then
    raise exception 'Solo la administración puede anular ventas' using errcode = '42501';
  end if;
  if coalesce(trim(p ->> 'motivo'), '') = '' then
    raise exception 'Falta el motivo de la anulación' using errcode = '22023';
  end if;
  if not exists (select 1 from naty_ventas where id = v_id) then
    raise exception 'La venta no existe' using errcode = '02000';
  end if;
  if (select estado from naty_ventas where id = v_id) = 'anulada' then
    return v_id;
  end if;

  update naty_ventas
     set estado = 'anulada', anulada_en = coalesce((p ->> 'anulada_en')::timestamptz, now()), anulacion_motivo = p ->> 'motivo'
   where id = v_id;

  for v_mov in select * from jsonb_array_elements(coalesce(p -> 'movimientos', '[]'::jsonb)) loop
    if (v_mov ->> 'delta')::int <= 0 then
      raise exception 'Un movimiento de anulación debe sumar stock' using errcode = '22023';
    end if;
    insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, usuario_id, venta_id, creado_en)
    values ((v_mov ->> 'id')::uuid, (v_mov ->> 'producto_id')::uuid, (v_mov ->> 'color_id')::uuid, 'anulacion', (v_mov ->> 'delta')::int,
            coalesce(v_mov ->> 'motivo', ''), auth.uid(), v_id, (v_mov ->> 'creado_en')::timestamptz)
    on conflict (id) do nothing;
  end loop;
  return v_id;
end $$;

-- Crear o editar un producto con sus colores y fotos (administración y encargada de depósito). Idempotente.
-- Los colores que ya no vienen en la lista se marcan `eliminado` (no se borran). Las fotos se reemplazan por completo.
-- p = { id, codigo, nombre, categoria: { id, nombre, orden }, descripcion, precio_docena_usd_cent, nuevo, activo,
--       colores: [ { id, nombre, hex, orden } ], fotos: [ { id, orden, ruta } ] }
create or replace function naty_guardar_producto(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_cat uuid;
  v_color jsonb;
  v_foto jsonb;
begin
  if not naty_es_rol('admin', 'enc_deposito') then
    raise exception 'Tu rol no puede modificar el catálogo' using errcode = '42501';
  end if;

  if p -> 'categoria' is not null and p -> 'categoria' <> 'null'::jsonb then
    insert into naty_categorias (id, nombre, orden)
    values ((p -> 'categoria' ->> 'id')::uuid, p -> 'categoria' ->> 'nombre', coalesce((p -> 'categoria' ->> 'orden')::int, 0))
    on conflict (id) do update set nombre = excluded.nombre, orden = excluded.orden
    returning id into v_cat;
  end if;

  insert into naty_productos (id, codigo, nombre, categoria_id, descripcion, precio_docena_usd_cent, nuevo, activo)
  values (v_id, p ->> 'codigo', p ->> 'nombre', v_cat, coalesce(p ->> 'descripcion', ''), (p ->> 'precio_docena_usd_cent')::int,
          coalesce((p ->> 'nuevo')::boolean, false), coalesce((p ->> 'activo')::boolean, true))
  on conflict (id) do update set codigo = excluded.codigo, nombre = excluded.nombre, categoria_id = excluded.categoria_id,
    descripcion = excluded.descripcion, precio_docena_usd_cent = excluded.precio_docena_usd_cent, nuevo = excluded.nuevo, activo = excluded.activo;

  update naty_producto_colores set eliminado = true
   where producto_id = v_id
     and id not in (select (c ->> 'id')::uuid from jsonb_array_elements(coalesce(p -> 'colores', '[]'::jsonb)) c);
  for v_color in select * from jsonb_array_elements(coalesce(p -> 'colores', '[]'::jsonb)) loop
    insert into naty_producto_colores (id, producto_id, nombre, hex, orden, eliminado)
    values ((v_color ->> 'id')::uuid, v_id, v_color ->> 'nombre', coalesce(v_color ->> 'hex', '#cccccc'), coalesce((v_color ->> 'orden')::int, 0), false)
    on conflict (id) do update set nombre = excluded.nombre, hex = excluded.hex, orden = excluded.orden, eliminado = false;
  end loop;

  delete from naty_producto_fotos where producto_id = v_id;
  for v_foto in select * from jsonb_array_elements(coalesce(p -> 'fotos', '[]'::jsonb)) loop
    insert into naty_producto_fotos (id, producto_id, orden, ruta)
    values ((v_foto ->> 'id')::uuid, v_id, coalesce((v_foto ->> 'orden')::int, 0), v_foto ->> 'ruta');
  end loop;
  return v_id;
end $$;

-- Catálogo para clientas (sin login): solo lo que puede verse. Sin stock, sin costos, sin datos internos.
-- El precio sale únicamente si la administración activó "mostrar precios" en la configuración.
create or replace view naty_catalogo_publico as
select
  p.id,
  p.codigo,
  p.nombre,
  c.nombre as categoria,
  p.descripcion,
  p.nuevo,
  case when coalesce((select valor = 'true'::jsonb from naty_config where clave = 'mostrar_precios_publico'), false)
       then p.precio_docena_usd_cent end as precio_docena_usd_cent,
  coalesce((select jsonb_agg(jsonb_build_object('nombre', pc.nombre, 'hex', pc.hex) order by pc.orden)
              from naty_producto_colores pc where pc.producto_id = p.id and not pc.eliminado), '[]'::jsonb) as colores,
  coalesce((select jsonb_agg(f.ruta order by f.orden) from naty_producto_fotos f where f.producto_id = p.id), '[]'::jsonb) as fotos
from naty_productos p
left join naty_categorias c on c.id = p.categoria_id
where p.activo;


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 3 · STORAGE (bucket con prefijo)
-- Lectura pública (las fotos del catálogo se ven sin login). Suben, reemplazan y borran solo administración y depósito.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('naty_productos', 'naty_productos', true)
on conflict (id) do nothing;

drop policy if exists "naty_fotos_ver" on storage.objects;
create policy "naty_fotos_ver" on storage.objects for select using (bucket_id = 'naty_productos');
drop policy if exists "naty_fotos_subir" on storage.objects;
create policy "naty_fotos_subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'naty_productos' and naty_es_rol('admin', 'enc_deposito'));
drop policy if exists "naty_fotos_reemplazar" on storage.objects;
create policy "naty_fotos_reemplazar" on storage.objects for update to authenticated
  using (bucket_id = 'naty_productos' and naty_es_rol('admin', 'enc_deposito'));
drop policy if exists "naty_fotos_borrar" on storage.objects;
create policy "naty_fotos_borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'naty_productos' and naty_es_rol('admin', 'enc_deposito'));


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 4 · RLS Y PERMISOS
--
-- MODO DE ACCESO: ABIERTO-AUTENTICADO (excepción documentada en SUPABASE-REGLAS.md).
-- La app es un PWA que funciona sin internet y habla directo con Supabase con la sesión de cada persona.
--   · `anon` NO tiene ninguna política sobre estas tablas: la clave pública no abre nada (solo la vista del catálogo público).
--   · Para leer hay que ser MIEMBRO (perfil activo creado por la administración): los usuarios de otros proyectos de la
--     instancia compartida no ven nada.
--   · Lo delicado (ventas, anulaciones, catálogo) NO se escribe con INSERT/UPDATE directos, sino con las funciones del bloque 2.
-- Matriz de permisos igual a app/src/lib/permisos.js.
-- ═══════════════════════════════════════════════════════════════════════

alter table naty_perfiles enable row level security;
alter table naty_categorias enable row level security;
alter table naty_productos enable row level security;
alter table naty_producto_colores enable row level security;
alter table naty_producto_fotos enable row level security;
alter table naty_ventas enable row level security;
alter table naty_venta_items enable row level security;
alter table naty_movimientos_stock enable row level security;
alter table naty_config enable row level security;

-- Lectura: el equipo (miembros) ve el catálogo, el stock, los perfiles (nombres) y los ajustes.
drop policy if exists "naty_perfiles_leer" on naty_perfiles;
create policy "naty_perfiles_leer" on naty_perfiles for select to authenticated using (naty_es_miembro());
drop policy if exists "naty_categorias_leer" on naty_categorias;
create policy "naty_categorias_leer" on naty_categorias for select to authenticated using (naty_es_miembro());
drop policy if exists "naty_productos_leer" on naty_productos;
create policy "naty_productos_leer" on naty_productos for select to authenticated using (naty_es_miembro());
drop policy if exists "naty_colores_leer" on naty_producto_colores;
create policy "naty_colores_leer" on naty_producto_colores for select to authenticated using (naty_es_miembro());
drop policy if exists "naty_fotos_leer" on naty_producto_fotos;
create policy "naty_fotos_leer" on naty_producto_fotos for select to authenticated using (naty_es_miembro());
drop policy if exists "naty_stock_leer" on naty_movimientos_stock;
create policy "naty_stock_leer" on naty_movimientos_stock for select to authenticated using (naty_es_miembro());
drop policy if exists "naty_config_leer" on naty_config;
create policy "naty_config_leer" on naty_config for select to authenticated using (naty_es_miembro());

-- Ventas: cada vendedor ve las suyas; administración y encargadas de tienda y de ventas ven todas.
drop policy if exists "naty_ventas_leer" on naty_ventas;
create policy "naty_ventas_leer" on naty_ventas for select to authenticated
  using (naty_es_rol('admin', 'enc_tienda', 'enc_ventas') or (vendedor_id = auth.uid() and naty_es_miembro()));
drop policy if exists "naty_items_leer" on naty_venta_items;
create policy "naty_items_leer" on naty_venta_items for select to authenticated
  using (exists (select 1 from naty_ventas v where v.id = venta_id));

-- Stock: administración y encargada de depósito cargan entradas, salidas y ajustes. Las ventas y anulaciones entran por funciones.
drop policy if exists "naty_stock_insertar" on naty_movimientos_stock;
create policy "naty_stock_insertar" on naty_movimientos_stock for insert to authenticated
  with check (naty_es_rol('admin', 'enc_deposito') and tipo in ('entrada', 'salida', 'ajuste') and usuario_id = auth.uid());

-- Categorías y ajustes (la encargada de depósito también crea categorías al cargar productos; los ajustes, solo administración).
drop policy if exists "naty_categorias_insertar" on naty_categorias;
create policy "naty_categorias_insertar" on naty_categorias for insert to authenticated with check (naty_es_rol('admin', 'enc_deposito'));
drop policy if exists "naty_categorias_editar" on naty_categorias;
create policy "naty_categorias_editar" on naty_categorias for update to authenticated using (naty_es_rol('admin', 'enc_deposito')) with check (naty_es_rol('admin', 'enc_deposito'));
drop policy if exists "naty_config_insertar" on naty_config;
create policy "naty_config_insertar" on naty_config for insert to authenticated with check (naty_es_rol('admin'));
drop policy if exists "naty_config_editar" on naty_config;
create policy "naty_config_editar" on naty_config for update to authenticated using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

-- Perfiles: solo administración los modifica (nombre, teléfono, activo).
drop policy if exists "naty_perfiles_editar" on naty_perfiles;
create policy "naty_perfiles_editar" on naty_perfiles for update to authenticated using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

-- Privilegios mínimos: se quita lo que Supabase da por defecto en `public` y se concede solo lo necesario.
-- Solo se tocan objetos `naty_*`; la `service_role` conserva su acceso por defecto (hace bypass de RLS).
revoke all on table naty_perfiles, naty_categorias, naty_productos, naty_producto_colores, naty_producto_fotos,
  naty_ventas, naty_venta_items, naty_movimientos_stock, naty_config from public, anon, authenticated;
revoke all on table naty_catalogo_publico from public, anon, authenticated;
revoke all on function naty_es_miembro(), naty_rol_actual(), naty_es_rol(naty_rol_usuario[]), naty_registrar_venta(jsonb),
  naty_anular_venta(jsonb), naty_guardar_producto(jsonb), naty_configurar_usuario(text, naty_rol_usuario, text, text, text)
  from public, anon, authenticated;

grant select on naty_perfiles, naty_categorias, naty_productos, naty_producto_colores, naty_producto_fotos,
  naty_ventas, naty_venta_items, naty_movimientos_stock, naty_config to authenticated;
grant insert on naty_movimientos_stock, naty_categorias, naty_config to authenticated;
grant update on naty_categorias, naty_config, naty_perfiles to authenticated;
grant select on naty_catalogo_publico to anon, authenticated;
grant execute on function naty_es_miembro(), naty_rol_actual(), naty_es_rol(naty_rol_usuario[]), naty_registrar_venta(jsonb),
  naty_anular_venta(jsonb), naty_guardar_producto(jsonb) to authenticated;
-- naty_configurar_usuario: solo quien administra el proyecto (SQL Editor / clave de servicio). Nunca la app.


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 5 · DATOS INICIALES (ajustes base)
-- El tipo de cambio es de EJEMPLO: la administración lo reemplaza en Ajustes antes de vender.
-- ═══════════════════════════════════════════════════════════════════════

insert into naty_config (clave, valor) values
  ('negocio', '{"nombre": "Modas Naty"}'),
  ('tipo_cambio', '{"bs": 6.96, "ars": 1400, "actualizado_en": null, "ejemplo": true}'),
  ('url_catalogo', '""'),
  ('whatsapp_tienda', '""'),
  ('mostrar_precios_publico', 'false'),
  ('stock_bajo_unidades', '24'),
  ('unidades_por_docena', '12')
on conflict (clave) do nothing;


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 6 · REGISTRO DEL PROYECTO EN LA TABLA MAESTRA (siempre al final)
-- ═══════════════════════════════════════════════════════════════════════

insert into proyectos (identificador, nombre, descripcion, tablas, link_github, link_web, estado)
values (
  'naty',
  'Modas Naty — Notas de venta y catálogo',
  'ERP de notas de venta en USD/ARS/Bs con catálogo por código, inventario y modo sin conexión (PWA). Provisorio acá; migra a cuenta propia de la clienta.',
  '["naty_perfiles","naty_categorias","naty_productos","naty_producto_colores","naty_producto_fotos","naty_ventas","naty_venta_items","naty_movimientos_stock","naty_config","naty_catalogo_publico (vista)","bucket:naty_productos"]'::jsonb,
  '',
  '',
  'en_desarrollo'
)
on conflict (identificador) do update set
  nombre      = excluded.nombre,
  descripcion = excluded.descripcion,
  tablas      = excluded.tablas,
  link_github = excluded.link_github,
  link_web    = excluded.link_web,
  estado      = excluded.estado;


-- ═══════════════════════════════════════════════════════════════════════
-- CAMBIOS POSTERIORES
-- Todo cambio nuevo va ACÁ ABAJO, como sección con fecha. Nunca en un archivo aparte.
-- ═══════════════════════════════════════════════════════════════════════

-- ── AAAA-MM-DD · <qué cambia y por qué> ──
