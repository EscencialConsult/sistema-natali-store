-- ═══════════════════════════════════════════════════════════════════════
-- MODAS NATY — Tienda online · Esquema Supabase
-- Identificador (prefijo de todo lo que crea este archivo): tienda
-- Instancia: PROVISORIA en el Supabase compartido de Área ID, la misma del sistema de notas de venta.
--            Se migra junto con `naty_` a una cuenta de Supabase de la clienta (ver SUPABASE-REGLAS.md).
--
-- REQUIERE naty_schema.sql APLICADO ANTES (catálogo compartido, decisión D4): productos, colores, fotos, categorías,
-- movimientos de stock, perfiles y config viven en `naty_*`. Este archivo solo agrega lo propio de la tienda.
--
-- ARCHIVO ÚNICO — regla fija de la skill `supabase-automatizacion-skill`:
--   · TODO cambio de base se agrega DIRECTO en este archivo, como sección nueva al final, con fecha.
--   · Es siempre seguro correrlo ENTERO las veces que haga falta (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS / ON CONFLICT).
--   · Solo agrega objetos con prefijo `tienda_`.
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.naty_productos') is null then
    raise exception 'Falta aplicar naty_schema.sql (catálogo compartido) antes que tienda_schema.sql';
  end if;
  if to_regclass('public.naty_movimientos_stock') is null or to_regclass('public.naty_producto_colores') is null then
    raise exception 'naty_schema.sql está incompleto: faltan tablas de stock o de colores';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 0 · LO QUE LA TIENDA AGREGA AL CATÁLOGO COMPARTIDO (2026-10-12)
-- ═══════════════════════════════════════════════════════════════════════
-- Antes esto vivía dentro de naty_schema.sql (sistema de nota). Ahora es de la tienda: se aplica solo, es idempotente y NO
-- depende de que el otro archivo tenga estas columnas. Son columnas ADITIVAS: el sistema de nota no las lee ni las pisa
-- (naty_guardar_producto hace INSERT ... ON CONFLICT con una lista fija de columnas, que no incluye estas).
-- Contrato completo en docs/plan/PLAN-actualizacion-concordancia.md, sección 5.

alter table naty_productos add column if not exists precio_unidad_bs_cent integer check (precio_unidad_bs_cent is null or precio_unidad_bs_cent >= 0);
alter table naty_productos add column if not exists publicado_tienda boolean not null default false;
alter table naty_productos add column if not exists destacado boolean not null default false;
alter table naty_productos add column if not exists slug text;
alter table naty_movimientos_stock add column if not exists pedido_id uuid;

alter type naty_tipo_movimiento add value if not exists 'reserva';
alter type naty_tipo_movimiento add value if not exists 'liberacion';
alter type naty_tipo_movimiento add value if not exists 'devolucion';

-- Slug: nombre + código, sin acentos, en minúsculas ("blusa-satin-mn-012").
create or replace function tienda_slug_de(p_texto text) returns text
language sql immutable as $$
  select left(trim(both '-' from regexp_replace(lower(translate(coalesce(p_texto, ''), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', '-', 'g')), 80)
$$;
update naty_productos set slug = tienda_slug_de(nombre || ' ' || codigo) where slug is null or slug = '';
create unique index if not exists idx_tienda_productos_slug on naty_productos (slug) where slug is not null;

-- Publicación en la tienda: lo único que la tienda escribe sobre un producto. No toca nombre, categoría, colores ni fotos
-- (eso es del sistema de nota y lo guarda naty_guardar_producto). Mismos roles que pueden editar el catálogo.
-- p = { id, precio_unidad_bs_cent?, publicado_tienda?, destacado?, slug? }: lo que no viene se conserva.
create or replace function tienda_guardar_publicacion(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_prod naty_productos%rowtype;
  v_slug text;
begin
  if not naty_es_rol('admin', 'enc_deposito') then
    raise exception 'Tu rol no puede modificar la publicación' using errcode = '42501';
  end if;
  select * into v_prod from naty_productos where id = v_id for update;
  if v_prod.id is null then
    raise exception 'El producto no existe' using errcode = '02000';
  end if;
  v_slug := coalesce(nullif(trim(p ->> 'slug'), ''), v_prod.slug, tienda_slug_de(v_prod.nombre || ' ' || v_prod.codigo));
  update naty_productos set
    precio_unidad_bs_cent = case when p ? 'precio_unidad_bs_cent' then (p ->> 'precio_unidad_bs_cent')::int else precio_unidad_bs_cent end,
    publicado_tienda = case when p ? 'publicado_tienda' then coalesce((p ->> 'publicado_tienda')::boolean, false) else publicado_tienda end,
    destacado = case when p ? 'destacado' then coalesce((p ->> 'destacado')::boolean, false) else destacado end,
    slug = v_slug
   where id = v_id;
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 1 · TIPOS Y TABLAS (prefijo `tienda_`)
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tienda_estado_pedido') then
    create type tienda_estado_pedido as enum ('pendiente_pago', 'pagado', 'en_preparacion', 'listo_retiro', 'enviado', 'entregado', 'cancelado', 'reembolsado');
  end if;
  if not exists (select 1 from pg_type where typname = 'tienda_origen') then
    create type tienda_origen as enum ('web', 'kiosco');
  end if;
  if not exists (select 1 from pg_type where typname = 'tienda_entrega') then
    create type tienda_entrega as enum ('retiro', 'envio');
  end if;
  if not exists (select 1 from pg_type where typname = 'tienda_proveedor_pago') then
    create type tienda_proveedor_pago as enum ('mercadopago', 'caja', 'transferencia');
  end if;
  if not exists (select 1 from pg_type where typname = 'tienda_estado_pago') then
    create type tienda_estado_pago as enum ('pendiente', 'aprobado', 'rechazado', 'reembolsado');
  end if;
end $$;

create or replace function tienda_tocar_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

-- Pedidos. El número lo da el servidor (secuencia) y el código visible se deriva: TN-000001.
create sequence if not exists tienda_pedido_numero;
create table if not exists tienda_pedidos (
  id uuid primary key,
  numero bigint not null unique default nextval('tienda_pedido_numero'),
  codigo text generated always as ('TN-' || lpad(numero::text, 6, '0')) stored unique,
  origen tienda_origen not null default 'web',
  estado tienda_estado_pedido not null default 'pendiente_pago',
  comprador_nombre text not null default '',
  comprador_telefono text not null default '',
  comprador_correo text not null default '',
  entrega tienda_entrega not null default 'retiro',
  envio_ciudad text not null default '',
  envio_direccion text not null default '',
  envio_costo_cent integer not null default 0 check (envio_costo_cent >= 0),
  nota text not null default '',
  moneda naty_moneda not null default 'bs',
  tipo_cambio numeric(14, 4) not null default 1 check (tipo_cambio > 0),
  proveedor_pago tienda_proveedor_pago not null default 'mercadopago',
  subtotal_cent bigint not null check (subtotal_cent >= 0),
  total_cent bigint not null check (total_cent >= 0),
  reserva_vence_en timestamptz,
  pagado_en timestamptz,
  dispositivo_kiosco_id uuid,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default clock_timestamp()
);

-- Copia de código, nombre, color y precio al momento: el pedido no cambia si el producto se edita después.
create table if not exists tienda_pedido_items (
  id uuid primary key,
  pedido_id uuid not null references tienda_pedidos (id) on delete cascade,
  producto_id uuid not null references naty_productos (id),
  color_id uuid references naty_producto_colores (id),
  codigo text not null,
  nombre text not null,
  color_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_cent bigint not null check (precio_cent >= 0),
  subtotal_cent bigint not null check (subtotal_cent >= 0)
);

create table if not exists tienda_pedido_historial (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references tienda_pedidos (id) on delete cascade,
  de_estado tienda_estado_pedido,
  a_estado tienda_estado_pedido not null,
  usuario_id uuid references naty_perfiles (id),
  motivo text not null default '',
  creado_en timestamptz not null default now()
);

-- Pagos: uno por intento. `datos` nunca lleva datos de tarjeta (la pasarela los maneja).
create table if not exists tienda_pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references tienda_pedidos (id) on delete cascade,
  proveedor tienda_proveedor_pago not null,
  proveedor_id text,
  estado tienda_estado_pago not null default 'pendiente',
  monto_cent bigint not null check (monto_cent >= 0),
  moneda naty_moneda not null default 'bs',
  idempotency_key text unique,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default clock_timestamp()
);

-- Eventos de webhook ya procesados (idempotencia: reenviar el mismo evento no confirma dos veces).
create table if not exists tienda_webhook_eventos (
  id text primary key,
  proveedor text not null,
  tipo text not null default '',
  recibido_en timestamptz not null default now(),
  procesado_en timestamptz,
  resultado text not null default ''
);

create table if not exists tienda_gasto_categorias (
  id uuid primary key,
  nombre text not null unique check (length(trim(nombre)) > 0),
  orden integer not null default 0,
  updated_at timestamptz not null default clock_timestamp()
);

-- Gastos: baja lógica. `fecha` es un día en Bolivia (AAAA-MM-DD).
create table if not exists tienda_gastos (
  id uuid primary key,
  categoria_id uuid not null references tienda_gasto_categorias (id),
  fecha date not null,
  monto_cent bigint not null check (monto_cent > 0),
  descripcion text not null default '',
  comprobante_ruta text not null default '',
  usuario_id uuid references naty_perfiles (id),
  eliminado boolean not null default false,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default clock_timestamp()
);

-- Dispositivos de kiosco activados con PIN (etapa 6). Se guarda el hash del token, nunca el token.
create table if not exists tienda_kiosco_dispositivos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Kiosco',
  token_hash text not null unique,
  activado_en timestamptz not null default now(),
  ultimo_uso timestamptz,
  activo boolean not null default true,
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists tienda_config (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default clock_timestamp()
);

-- Las reservas y ventas de la tienda viven en la misma tabla de movimientos que el sistema de nota (stock único).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'naty_movimientos_stock_pedido_id_fkey') then
    alter table naty_movimientos_stock add constraint naty_movimientos_stock_pedido_id_fkey foreign key (pedido_id) references tienda_pedidos (id);
  end if;
end $$;

create index if not exists idx_tienda_pedidos_estado on tienda_pedidos (estado, creado_en desc);
create index if not exists idx_tienda_pedidos_creado on tienda_pedidos (creado_en desc);
create index if not exists idx_tienda_pedidos_telefono on tienda_pedidos (comprador_telefono);
create index if not exists idx_tienda_pedidos_vence on tienda_pedidos (reserva_vence_en) where estado = 'pendiente_pago';
create index if not exists idx_tienda_items_pedido on tienda_pedido_items (pedido_id);
create index if not exists idx_tienda_historial_pedido on tienda_pedido_historial (pedido_id, creado_en);
create index if not exists idx_tienda_pagos_pedido on tienda_pagos (pedido_id);
-- Tablas ya creadas con el esquema anterior: el color del ítem pasó a ser opcional (productos sin color o con color único).
alter table tienda_pedido_items alter column color_id drop not null;

create index if not exists idx_tienda_gastos_fecha on tienda_gastos (fecha desc) where not eliminado;
create index if not exists idx_naty_mov_pedido on naty_movimientos_stock (pedido_id);

drop trigger if exists trg_tienda_pedidos_upd on tienda_pedidos;
create trigger trg_tienda_pedidos_upd before update on tienda_pedidos for each row execute function tienda_tocar_updated_at();
drop trigger if exists trg_tienda_pagos_upd on tienda_pagos;
create trigger trg_tienda_pagos_upd before update on tienda_pagos for each row execute function tienda_tocar_updated_at();
drop trigger if exists trg_tienda_gastos_upd on tienda_gastos;
create trigger trg_tienda_gastos_upd before update on tienda_gastos for each row execute function tienda_tocar_updated_at();
drop trigger if exists trg_tienda_gasto_cat_upd on tienda_gasto_categorias;
create trigger trg_tienda_gasto_cat_upd before update on tienda_gasto_categorias for each row execute function tienda_tocar_updated_at();
drop trigger if exists trg_tienda_kiosco_upd on tienda_kiosco_dispositivos;
create trigger trg_tienda_kiosco_upd before update on tienda_kiosco_dispositivos for each row execute function tienda_tocar_updated_at();
drop trigger if exists trg_tienda_config_upd on tienda_config;
create trigger trg_tienda_config_upd before update on tienda_config for each row execute function tienda_tocar_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 2 · FUNCIONES
-- Lo delicado (crear pedido, confirmar pago, cambiar estado) nunca se escribe con INSERT/UPDATE directos.
-- ═══════════════════════════════════════════════════════════════════════

-- ¿La llamada viene del servidor (Netlify Functions con service_role, SQL Editor, cron)? En Supabase el JWT de la
-- service_role trae role=service_role; sin JWT (superusuario, pruebas) también cuenta como servicio.
create or replace function tienda_es_servicio() returns boolean
language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
      or coalesce(current_setting('request.jwt.claim.role', true), '') = ''
$$;

-- Stock disponible de un color: suma de TODOS los movimientos (entradas, ventas de los dos sistemas, reservas vigentes).
create or replace function tienda_disponible(p_producto uuid, p_color uuid) returns integer
language sql stable security definer set search_path = public as $$
  -- Dos modelos conviven (ver docs/plan/PLAN-actualizacion-concordancia.md):
  --   · producto con UN color activo (o ninguno), como el rediseño del sistema de nota: el stock es del PRODUCTO,
  --     es decir la suma de todos sus movimientos (incluidos los sin color o de colores ya eliminados);
  --   · producto con varios colores activos (modelo anterior): el stock es el del color pedido.
  select coalesce(sum(m.delta), 0)::int
    from naty_movimientos_stock m
   where m.producto_id = p_producto
     and ( (select count(*) from naty_producto_colores c where c.producto_id = p_producto and not c.eliminado) <= 1
           or m.color_id = p_color )
$$;

-- Tabla de transiciones (misma que app/src/lib/pedido.js; una prueba las compara).
create or replace function tienda_transicion_valida(p_de tienda_estado_pedido, p_a tienda_estado_pedido) returns boolean
language sql immutable as $$
  select case p_de
    when 'pendiente_pago' then p_a in ('pagado', 'cancelado')
    when 'pagado' then p_a in ('en_preparacion', 'listo_retiro', 'enviado', 'entregado', 'reembolsado')
    when 'en_preparacion' then p_a in ('listo_retiro', 'enviado', 'entregado', 'reembolsado')
    when 'listo_retiro' then p_a in ('entregado', 'reembolsado')
    when 'enviado' then p_a in ('entregado', 'reembolsado')
    when 'entregado' then p_a in ('reembolsado')
    else false
  end
$$;

create or replace function tienda_pedido_json(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(p) || jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.codigo) from tienda_pedido_items i where i.pedido_id = p.id), '[]'::jsonb),
    'historial', coalesce((select jsonb_agg(to_jsonb(h) order by h.creado_en) from tienda_pedido_historial h where h.pedido_id = p.id), '[]'::jsonb)
  )
  from tienda_pedidos p where p.id = p_id
$$;

-- Crear un pedido (la llama la compradora sin sesión, o el servidor para el kiosco). Todo o nada.
-- p = { id, origen, comprador_nombre, comprador_telefono, comprador_correo, entrega, envio_ciudad, envio_direccion,
--       envio_costo_cent, nota, moneda, tipo_cambio, proveedor_pago, items: [ { producto_id, color_id, cantidad } ] }
-- Devuelve el pedido completo (con código). Idempotente por id.
-- Pesos argentinos por 1 boliviano. Sale de la conversión que carga la administración en el panel de la tienda
-- (tienda_config.cambio = "X bolivianos = Y pesos argentinos"). Si falta, de respaldo se deriva del tipo de cambio por
-- dólar de naty_config (el que usa el sistema de nota). Devuelve null si no hay ninguno válido.
create or replace function tienda_tipo_cambio() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case when coalesce((valor ->> 'bs')::numeric, 0) > 0 and coalesce((valor ->> 'ars')::numeric, 0) > 0
                 then (valor ->> 'ars')::numeric / (valor ->> 'bs')::numeric end
       from tienda_config where clave = 'cambio'),
    (select case when coalesce((valor ->> 'bs')::numeric, 0) > 0 and coalesce((valor ->> 'ars')::numeric, 0) > 0
                 then (valor ->> 'ars')::numeric / (valor ->> 'bs')::numeric end
       from naty_config where clave = 'tipo_cambio')
  )
$$;

-- Versión de la conversión vigente: sube en cada cambio. El navegador manda la que vio al confirmar el pedido; si ya no
-- coincide, el servidor frena y le muestra el total nuevo (nunca cobra de más en silencio).
create or replace function tienda_version_cambio() returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select (valor ->> 'version')::int from tienda_config where clave = 'cambio'), 0)
$$;

create or replace function tienda_crear_pedido(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce((p ->> 'id')::uuid, gen_random_uuid());
  v_origen tienda_origen := coalesce((p ->> 'origen')::tienda_origen, 'web');
  v_moneda naty_moneda;
  v_tc numeric := 1;
  v_proveedor tienda_proveedor_pago := coalesce((p ->> 'proveedor_pago')::tienda_proveedor_pago, 'mercadopago');
  v_entrega tienda_entrega := coalesce((p ->> 'entrega')::tienda_entrega, 'retiro');
  v_envio int := case when coalesce((p ->> 'entrega')::tienda_entrega, 'retiro') = 'envio' then coalesce((p ->> 'envio_costo_cent')::int, 0) else 0 end;
  v_minutos int;
  v_item jsonb;
  v_prod naty_productos%rowtype;
  v_color naty_producto_colores%rowtype;
  v_ncolores int;
  v_disp int;
  v_precio bigint;
  v_subtotal bigint := 0;
  v_cant int;
  v_tel text := regexp_replace(coalesce(p ->> 'comprador_telefono', ''), '\D', '', 'g');
begin
  -- Si no se indica moneda, la fija el medio de pago: en línea y transferencia son pesos; el efectivo, bolivianos.
  v_moneda := coalesce(nullif(p ->> 'moneda', '')::naty_moneda, case when v_proveedor in ('mercadopago', 'transferencia') then 'ars'::naty_moneda else 'bs'::naty_moneda end);
  if exists (select 1 from tienda_pedidos where id = v_id) then
    return tienda_pedido_json(v_id);
  end if;
  if v_origen = 'kiosco' and not tienda_es_servicio() then
    raise exception 'Los pedidos del kiosco se crean desde el servidor' using errcode = '42501';
  end if;
  if coalesce(jsonb_array_length(p -> 'items'), 0) = 0 then
    raise exception 'El carrito está vacío' using errcode = '22023';
  end if;
  if v_origen = 'web' then
    if length(trim(coalesce(p ->> 'comprador_nombre', ''))) < 2 then
      raise exception 'Decinos tu nombre' using errcode = '22023';
    end if;
    if length(v_tel) < 7 then
      raise exception 'El teléfono parece incompleto' using errcode = '22023';
    end if;
  end if;
  if v_entrega = 'envio' and (coalesce(p ->> 'envio_ciudad', '') = '' or coalesce(p ->> 'envio_direccion', '') = '') then
    raise exception 'Para el envío hace falta ciudad y dirección' using errcode = '22023';
  end if;
  if v_moneda not in ('bs', 'ars') then
    raise exception 'Moneda no admitida' using errcode = '22023';
  end if;
  -- La moneda la fija el medio de pago: el pago en línea y la transferencia son en pesos argentinos; el efectivo, en Bs o en pesos.
  if v_proveedor in ('mercadopago', 'transferencia') and v_moneda <> 'ars' then
    raise exception 'El pago en línea y la transferencia son en pesos argentinos' using errcode = '22023', detail = 'TIENDA_MONEDA_INVALIDA';
  end if;
  if v_moneda = 'ars' then
    -- Nunca se acepta el tipo de cambio que mande el navegador: saldría un precio a gusto de quien llame.
    v_tc := tienda_tipo_cambio();
    if v_tc is null then
      raise exception 'El tipo de cambio todavía no está cargado' using errcode = 'P0001', detail = 'TIENDA_SIN_TIPO_CAMBIO';
    end if;
    -- Si el navegador mostró una conversión que ya no es la vigente, se frena: la persona ve el total nuevo y confirma de nuevo.
    if nullif(p ->> 'cambio_visto', '') is not null and (p ->> 'cambio_visto')::int <> tienda_version_cambio() then
      raise exception 'El tipo de cambio se actualizó. Revisá el nuevo total antes de confirmar.' using errcode = 'P0001', detail = 'TIENDA_CAMBIO_ACTUALIZADO';
    end if;
    -- El costo de envío se carga en Bs: se pasa a pesos, al centavo.
    v_envio := round(v_envio * v_tc)::int;
  end if;
  v_minutos := case v_proveedor when 'mercadopago' then 30 when 'transferencia' then 24 * 60 else 12 * 60 end;

  insert into tienda_pedidos (id, origen, comprador_nombre, comprador_telefono, comprador_correo, entrega, envio_ciudad, envio_direccion,
    envio_costo_cent, nota, moneda, tipo_cambio, proveedor_pago, subtotal_cent, total_cent, reserva_vence_en, dispositivo_kiosco_id, cambio_version)
  values (v_id, v_origen, left(trim(coalesce(p ->> 'comprador_nombre', '')), 80), v_tel, left(trim(coalesce(p ->> 'comprador_correo', '')), 120),
    v_entrega, left(coalesce(p ->> 'envio_ciudad', ''), 80), left(coalesce(p ->> 'envio_direccion', ''), 200), v_envio, left(coalesce(p ->> 'nota', ''), 300),
    v_moneda, v_tc, v_proveedor, 0, 0, now() + make_interval(mins => v_minutos), (p ->> 'dispositivo_kiosco_id')::uuid, case when v_moneda = 'ars' then tienda_version_cambio() end);

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    v_cant := (v_item ->> 'cantidad')::int;
    if v_cant is null or v_cant < 1 or v_cant > 999 then
      raise exception 'Cantidad inválida' using errcode = '22023';
    end if;
    select * into v_prod from naty_productos where id = (v_item ->> 'producto_id')::uuid;
    if v_prod.id is null or not v_prod.activo or not v_prod.publicado_tienda or v_prod.precio_unidad_bs_cent is null then
      raise exception 'Uno de los productos ya no está disponible' using errcode = '22023';
    end if;
    -- Se bloquea el PRODUCTO: dos pedidos simultáneos por la última unidad se serializan y el segundo ve el stock ya reservado.
    perform 1 from naty_productos where id = v_prod.id for update;
    select count(*) into v_ncolores from naty_producto_colores where producto_id = v_prod.id and not eliminado;
    v_color := null;
    select * into v_color from naty_producto_colores
     where id = nullif(v_item ->> 'color_id', '')::uuid and producto_id = v_prod.id and not eliminado;
    if v_color.id is null then
      if v_ncolores = 1 then
        -- Color único: se usa ese aunque el carrito traiga uno viejo, eliminado o ninguno.
        select * into v_color from naty_producto_colores where producto_id = v_prod.id and not eliminado;
      elsif v_ncolores > 1 then
        raise exception 'Elegí un color de %', v_prod.nombre using errcode = '22023';
      elsif exists (select 1 from information_schema.columns where table_name = 'naty_movimientos_stock' and column_name = 'color_id' and is_nullable = 'NO') then
        raise exception 'El producto % no tiene un color cargado', v_prod.nombre using errcode = '22023';
      end if;
    end if;
    v_disp := tienda_disponible(v_prod.id, v_color.id);
    if v_disp < v_cant then
      raise exception 'No hay stock suficiente de %: quedan %', v_prod.nombre || coalesce(' (' || v_color.nombre || ')', ''), greatest(v_disp, 0)
        using errcode = 'P0001', detail = 'TIENDA_STOCK_INSUFICIENTE';
    end if;
    -- En pesos el precio de cada unidad se redondea al centavo (se muestra y se cobra igual); nunca queda en cero.
    v_precio := case when v_moneda = 'bs' then v_prod.precio_unidad_bs_cent else greatest(round(v_prod.precio_unidad_bs_cent * v_tc)::bigint, 1) end;
    insert into tienda_pedido_items (id, pedido_id, producto_id, color_id, codigo, nombre, color_nombre, cantidad, precio_cent, subtotal_cent)
    values (gen_random_uuid(), v_id, v_prod.id, v_color.id, v_prod.codigo, v_prod.nombre, coalesce(v_color.nombre, ''), v_cant, v_precio, v_precio * v_cant);
    insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, usuario_id, venta_id, pedido_id, creado_en)
    values (gen_random_uuid(), v_prod.id, v_color.id, 'reserva', -v_cant, 'Reserva pedido', null, null, v_id, now());
    v_subtotal := v_subtotal + v_precio * v_cant;
  end loop;

  update tienda_pedidos set subtotal_cent = v_subtotal, total_cent = v_subtotal + v_envio where id = v_id;
  insert into tienda_pedido_historial (pedido_id, de_estado, a_estado) values (v_id, null, 'pendiente_pago');
  return tienda_pedido_json(v_id);
end $$;

-- Aplica un cambio de estado SIN revisar permisos (uso interno de las funciones de abajo).
create or replace function tienda_aplicar_estado(p_id uuid, p_estado tienda_estado_pedido, p_motivo text, p_usuario uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_pedido tienda_pedidos%rowtype;
  v_mov naty_movimientos_stock%rowtype;
begin
  select * into v_pedido from tienda_pedidos where id = p_id for update;
  if v_pedido.id is null then
    raise exception 'El pedido no existe' using errcode = '02000';
  end if;
  if not tienda_transicion_valida(v_pedido.estado, p_estado) then
    raise exception 'Un pedido % no puede pasar a %', replace(v_pedido.estado::text, '_', ' '), replace(p_estado::text, '_', ' ')
      using errcode = 'P0001', detail = 'TIENDA_TRANSICION_INVALIDA';
  end if;
  if p_estado in ('cancelado', 'reembolsado') and coalesce(trim(p_motivo), '') = '' then
    raise exception 'Indicá el motivo' using errcode = '22023';
  end if;
  if p_estado = 'cancelado' then
    -- Libera la reserva (si todavía está pendiente de pago, la reserva sigue vigente).
    for v_mov in select * from naty_movimientos_stock where pedido_id = p_id and tipo = 'reserva' loop
      insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, pedido_id, creado_en)
      values (gen_random_uuid(), v_mov.producto_id, v_mov.color_id, 'liberacion', -v_mov.delta, 'Pedido ' || v_pedido.codigo || ' cancelado', p_id, now());
    end loop;
  elsif p_estado = 'reembolsado' then
    for v_mov in select * from naty_movimientos_stock where pedido_id = p_id and tipo = 'venta' loop
      insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, pedido_id, creado_en)
      values (gen_random_uuid(), v_mov.producto_id, v_mov.color_id, 'devolucion', -v_mov.delta, 'Reembolso ' || v_pedido.codigo, p_id, now());
    end loop;
    update tienda_pagos set estado = 'reembolsado' where pedido_id = p_id and estado = 'aprobado';
  end if;
  update tienda_pedidos set estado = p_estado where id = p_id;
  insert into tienda_pedido_historial (pedido_id, de_estado, a_estado, usuario_id, motivo) values (p_id, v_pedido.estado, p_estado, p_usuario, coalesce(p_motivo, ''));
end $$;

-- Cambio de estado desde el panel. p = { id, estado, motivo }
-- Encargadas: preparación, listo, enviado, entregado. Cancelar y reembolsar: solo administración (o el servidor).
create or replace function tienda_cambiar_estado(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_estado tienda_estado_pedido := (p ->> 'estado')::tienda_estado_pedido;
begin
  if not tienda_es_servicio() then
    if v_estado in ('cancelado', 'reembolsado') then
      if not naty_es_rol('admin') then
        raise exception 'Solo la administración puede cancelar o reembolsar' using errcode = '42501';
      end if;
    elsif v_estado = 'pagado' then
      raise exception 'El pago se confirma con tienda_confirmar_pago' using errcode = '42501';
    elsif not naty_es_rol('admin', 'enc_tienda', 'enc_ventas') then
      raise exception 'Tu rol no puede cambiar pedidos' using errcode = '42501';
    end if;
  end if;
  perform tienda_aplicar_estado(v_id, v_estado, p ->> 'motivo', auth.uid());
  return tienda_pedido_json(v_id);
end $$;

-- Confirmar el pago. La llama el webhook (servidor) para mercadopago, o la encargada para caja/transferencia.
-- p = { id, proveedor, proveedor_id, monto_cent, idempotency_key, datos }. Idempotente: un pedido pagado vuelve tal cual.
create or replace function tienda_confirmar_pago(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
  v_proveedor tienda_proveedor_pago := coalesce((p ->> 'proveedor')::tienda_proveedor_pago, 'caja');
  v_pedido tienda_pedidos%rowtype;
  v_mov naty_movimientos_stock%rowtype;
begin
  if not tienda_es_servicio() then
    if v_proveedor = 'mercadopago' then
      raise exception 'Los pagos en línea los confirma el servidor' using errcode = '42501';
    end if;
    if not naty_es_rol('admin', 'enc_tienda', 'enc_ventas') then
      raise exception 'Tu rol no puede confirmar pagos' using errcode = '42501';
    end if;
  end if;
  select * into v_pedido from tienda_pedidos where id = v_id for update;
  if v_pedido.id is null then
    raise exception 'El pedido no existe' using errcode = '02000';
  end if;
  if v_pedido.estado = 'pagado' then
    return tienda_pedido_json(v_id);
  end if;
  if not tienda_transicion_valida(v_pedido.estado, 'pagado') then
    raise exception 'Un pedido % no se puede marcar como pagado', replace(v_pedido.estado::text, '_', ' ') using errcode = 'P0001', detail = 'TIENDA_TRANSICION_INVALIDA';
  end if;
  -- La reserva se vuelve venta en la misma transacción (dos movimientos: libera la reserva y descuenta la venta).
  for v_mov in select * from naty_movimientos_stock where pedido_id = v_id and tipo = 'reserva' loop
    insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, pedido_id, creado_en)
    values (gen_random_uuid(), v_mov.producto_id, v_mov.color_id, 'liberacion', -v_mov.delta, 'Pedido ' || v_pedido.codigo, v_id, now());
    insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, pedido_id, creado_en)
    values (gen_random_uuid(), v_mov.producto_id, v_mov.color_id, 'venta', v_mov.delta, 'Pedido ' || v_pedido.codigo, v_id, now());
  end loop;
  insert into tienda_pagos (pedido_id, proveedor, proveedor_id, estado, monto_cent, moneda, idempotency_key, datos)
  values (v_id, v_proveedor, p ->> 'proveedor_id', 'aprobado', coalesce((p ->> 'monto_cent')::bigint, v_pedido.total_cent), v_pedido.moneda,
          p ->> 'idempotency_key', coalesce(p -> 'datos', '{}'::jsonb))
  on conflict (idempotency_key) do nothing;
  update tienda_pedidos set estado = 'pagado', pagado_en = now(), proveedor_pago = v_proveedor where id = v_id;
  insert into tienda_pedido_historial (pedido_id, de_estado, a_estado, usuario_id, motivo)
  values (v_id, v_pedido.estado, 'pagado', auth.uid(), 'Pago por ' || v_proveedor::text);
  return tienda_pedido_json(v_id);
end $$;

-- Pedidos pendientes con la reserva vencida: se cancelan y el stock vuelve. La llama el cron o la Function programada.
create or replace function tienda_vencer_reservas() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_n int := 0;
  v_id uuid;
begin
  if not tienda_es_servicio() then
    raise exception 'Solo el servidor vence reservas' using errcode = '42501';
  end if;
  for v_id in select id from tienda_pedidos where estado = 'pendiente_pago' and reserva_vence_en <= now() loop
    perform tienda_aplicar_estado(v_id, 'cancelado', 'Venció el plazo de pago', null);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- Consulta pública: código + teléfono. Devuelve null si no coinciden (sin decir cuál de los dos falló).
create or replace function tienda_pedido_publico(p_codigo text, p_telefono text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id from tienda_pedidos
   where codigo = upper(trim(p_codigo)) and comprador_telefono <> '' and comprador_telefono = regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  if v_id is null then
    return null;
  end if;
  return tienda_pedido_json(v_id) - 'dispositivo_kiosco_id';
end $$;

-- Consulta pública por código + llave. La llave es el id del pedido (un UUID aleatorio que solo conoce quien hizo la compra:
-- viaja en el enlace de vuelta de Mercado Pago y en el correo). Permite ver el pedido desde cualquier dispositivo sin pedir
-- el teléfono. Devuelve null si no coinciden (sin decir cuál de los dos falló).
create or replace function tienda_pedido_por_llave(p_codigo text, p_llave text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid;
begin
  begin
    v_id := trim(p_llave)::uuid;
  exception when others then
    return null;
  end;
  if not exists (select 1 from tienda_pedidos where id = v_id and codigo = upper(trim(p_codigo))) then
    return null;
  end if;
  return tienda_pedido_json(v_id) - 'dispositivo_kiosco_id';
end $$;

-- Lo que el sitio público necesita de la configuración (sin claves ni datos internos).
create or replace function tienda_sitio_publico() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'sitio', coalesce((select valor from tienda_config where clave = 'sitio'), '{}'::jsonb),
    'negocio', coalesce((select valor from naty_config where clave = 'negocio'), '{}'::jsonb),
    'whatsapp_tienda', coalesce((select valor from naty_config where clave = 'whatsapp_tienda'), '""'::jsonb),
    'stock_bajo_unidades', coalesce((select valor from naty_config where clave = 'stock_bajo_unidades'), '6'::jsonb),
    'tipo_cambio', coalesce((select valor from naty_config where clave = 'tipo_cambio'), '{}'::jsonb),
    'cambio', coalesce((select valor - 'actualizado_por' from tienda_config where clave = 'cambio'), '{}'::jsonb),
    'recargo_mp', coalesce((select valor from naty_config where clave = 'recargo_mp'), '{"pct": 0}'::jsonb)
  )
$$;

-- Catálogo público de la tienda: solo publicados con precio minorista; colores con disponible (las reservas ya descuentan).
create or replace view tienda_catalogo_publico as
select
  p.id,
  p.codigo,
  coalesce(p.slug, tienda_slug_de(p.nombre || ' ' || p.codigo)) as slug,
  p.nombre,
  p.categoria_id,
  c.nombre as categoria,
  p.descripcion,
  p.precio_unidad_bs_cent,
  p.nuevo,
  p.destacado,
  p.creado_en,
  p.updated_at,
  coalesce((select jsonb_agg(jsonb_build_object('id', pc.id, 'nombre', pc.nombre, 'hex', pc.hex, 'orden', pc.orden, 'disponible', greatest(tienda_disponible(p.id, pc.id), 0)) order by pc.orden)
              from naty_producto_colores pc where pc.producto_id = p.id and not pc.eliminado), '[]'::jsonb) as colores,
  coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'orden', f.orden, 'ruta', f.ruta) order by f.orden) from naty_producto_fotos f where f.producto_id = p.id), '[]'::jsonb) as fotos,
  c.orden as categoria_orden,
  greatest((select coalesce(sum(m.delta), 0)::int from naty_movimientos_stock m where m.producto_id = p.id), 0) as disponible_total
from naty_productos p
left join naty_categorias c on c.id = p.categoria_id
where p.activo and p.publicado_tienda and p.precio_unidad_bs_cent is not null;

-- Cron (si la instancia tiene pg_cron): vence reservas cada 5 minutos. Si no, lo hace la Function programada `vencer-reservas`.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'tienda_vencer_reservas';
    perform cron.schedule('tienda_vencer_reservas', '*/5 * * * *', 'select tienda_vencer_reservas()');
  end if;
end $$;


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 3 · STORAGE: comprobantes de pago y de gastos (bucket PRIVADO)
-- Suben: la compradora por una Function con service_role (etapa 5.5) y el panel. Leen: administración y encargadas.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('tienda_comprobantes', 'tienda_comprobantes', false)
on conflict (id) do nothing;

drop policy if exists "tienda_comprobantes_ver" on storage.objects;
create policy "tienda_comprobantes_ver" on storage.objects for select to authenticated
  using (bucket_id = 'tienda_comprobantes' and naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));
drop policy if exists "tienda_comprobantes_subir" on storage.objects;
create policy "tienda_comprobantes_subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'tienda_comprobantes' and naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));
drop policy if exists "tienda_comprobantes_borrar" on storage.objects;
create policy "tienda_comprobantes_borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'tienda_comprobantes' and naty_es_rol('admin'));


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 4 · RLS Y PERMISOS (matriz igual a app/src/lib/permisos.js)
--   · anon: solo la vista del catálogo, crear pedido, consultar su pedido y leer la configuración pública (todo por función).
--   · miembros (perfil naty_ activo): pedidos y pagos para administración y encargadas; gastos según rol; config para miembros.
--   · service_role (Netlify Functions, cron): bypass de RLS.
-- ═══════════════════════════════════════════════════════════════════════

alter table tienda_pedidos enable row level security;
alter table tienda_pedido_items enable row level security;
alter table tienda_pedido_historial enable row level security;
alter table tienda_pagos enable row level security;
alter table tienda_webhook_eventos enable row level security;
alter table tienda_gasto_categorias enable row level security;
alter table tienda_gastos enable row level security;
alter table tienda_kiosco_dispositivos enable row level security;
alter table tienda_config enable row level security;

drop policy if exists "tienda_pedidos_leer" on tienda_pedidos;
create policy "tienda_pedidos_leer" on tienda_pedidos for select to authenticated using (naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));
drop policy if exists "tienda_items_leer" on tienda_pedido_items;
create policy "tienda_items_leer" on tienda_pedido_items for select to authenticated using (naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));
drop policy if exists "tienda_historial_leer" on tienda_pedido_historial;
create policy "tienda_historial_leer" on tienda_pedido_historial for select to authenticated using (naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));
drop policy if exists "tienda_pagos_leer" on tienda_pagos;
create policy "tienda_pagos_leer" on tienda_pagos for select to authenticated using (naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));

drop policy if exists "tienda_gasto_cat_leer" on tienda_gasto_categorias;
create policy "tienda_gasto_cat_leer" on tienda_gasto_categorias for select to authenticated using (naty_es_rol('admin', 'enc_tienda', 'enc_ventas'));
drop policy if exists "tienda_gasto_cat_insertar" on tienda_gasto_categorias;
create policy "tienda_gasto_cat_insertar" on tienda_gasto_categorias for insert to authenticated with check (naty_es_rol('admin'));
drop policy if exists "tienda_gasto_cat_editar" on tienda_gasto_categorias;
create policy "tienda_gasto_cat_editar" on tienda_gasto_categorias for update to authenticated using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

-- Gastos: administración ve y edita todo; las encargadas cargan (y ven lo que cargaron). Depósito no ve gastos.
drop policy if exists "tienda_gastos_leer" on tienda_gastos;
create policy "tienda_gastos_leer" on tienda_gastos for select to authenticated using (naty_es_rol('admin') or (usuario_id = auth.uid() and naty_es_rol('enc_tienda', 'enc_ventas')));
drop policy if exists "tienda_gastos_insertar" on tienda_gastos;
create policy "tienda_gastos_insertar" on tienda_gastos for insert to authenticated with check (naty_es_rol('admin', 'enc_tienda', 'enc_ventas') and usuario_id = auth.uid());
drop policy if exists "tienda_gastos_editar" on tienda_gastos;
create policy "tienda_gastos_editar" on tienda_gastos for update to authenticated using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

drop policy if exists "tienda_kiosco_leer" on tienda_kiosco_dispositivos;
create policy "tienda_kiosco_leer" on tienda_kiosco_dispositivos for select to authenticated using (naty_es_rol('admin', 'enc_tienda'));
drop policy if exists "tienda_kiosco_editar" on tienda_kiosco_dispositivos;
create policy "tienda_kiosco_editar" on tienda_kiosco_dispositivos for update to authenticated using (naty_es_rol('admin', 'enc_tienda')) with check (naty_es_rol('admin', 'enc_tienda'));

drop policy if exists "tienda_config_leer" on tienda_config;
create policy "tienda_config_leer" on tienda_config for select to authenticated using (naty_es_miembro());
drop policy if exists "tienda_config_insertar" on tienda_config;
create policy "tienda_config_insertar" on tienda_config for insert to authenticated with check (naty_es_rol('admin'));
drop policy if exists "tienda_config_editar" on tienda_config;
create policy "tienda_config_editar" on tienda_config for update to authenticated using (naty_es_rol('admin')) with check (naty_es_rol('admin'));

revoke all on table tienda_pedidos, tienda_pedido_items, tienda_pedido_historial, tienda_pagos, tienda_webhook_eventos,
  tienda_gasto_categorias, tienda_gastos, tienda_kiosco_dispositivos, tienda_config from public, anon, authenticated;
revoke all on table tienda_catalogo_publico from public, anon, authenticated;
revoke all on function tienda_es_servicio(), tienda_disponible(uuid, uuid), tienda_transicion_valida(tienda_estado_pedido, tienda_estado_pedido),
  tienda_pedido_json(uuid), tienda_crear_pedido(jsonb), tienda_aplicar_estado(uuid, tienda_estado_pedido, text, uuid), tienda_cambiar_estado(jsonb),
  tienda_confirmar_pago(jsonb), tienda_vencer_reservas(), tienda_pedido_publico(text, text), tienda_pedido_por_llave(text, text), tienda_sitio_publico(),
  tienda_guardar_publicacion(jsonb), tienda_tipo_cambio()
  from public, anon, authenticated;
grant execute on function tienda_guardar_publicacion(jsonb) to authenticated;

grant select on tienda_catalogo_publico to anon, authenticated;
-- tienda_disponible la usa la vista pública (solo suma movimientos): la ejecutan también los anónimos.
grant execute on function tienda_crear_pedido(jsonb), tienda_pedido_publico(text, text), tienda_pedido_por_llave(text, text), tienda_sitio_publico(), tienda_disponible(uuid, uuid) to anon, authenticated;
grant select on tienda_pedidos, tienda_pedido_items, tienda_pedido_historial, tienda_pagos, tienda_gasto_categorias, tienda_gastos,
  tienda_kiosco_dispositivos, tienda_config to authenticated;
grant insert on tienda_gasto_categorias, tienda_gastos, tienda_config to authenticated;
grant update on tienda_gasto_categorias, tienda_gastos, tienda_kiosco_dispositivos, tienda_config to authenticated;
grant execute on function tienda_cambiar_estado(jsonb), tienda_confirmar_pago(jsonb) to authenticated;
-- tienda_vencer_reservas, tienda_aplicar_estado, tienda_pedido_json: solo servicio (service_role / cron).


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 5 · DATOS INICIALES
-- ═══════════════════════════════════════════════════════════════════════

insert into tienda_gasto_categorias (id, nombre, orden) values
  ('50000000-0000-4000-8000-000000000001', 'Mercadería', 1),
  ('50000000-0000-4000-8000-000000000002', 'Alquiler', 2),
  ('50000000-0000-4000-8000-000000000003', 'Sueldos', 3),
  ('50000000-0000-4000-8000-000000000004', 'Envíos', 4),
  ('50000000-0000-4000-8000-000000000005', 'Servicios', 5),
  ('50000000-0000-4000-8000-000000000006', 'Otros', 6)
on conflict (id) do nothing;

-- El sitio arranca vacío: la app completa los valores por defecto (provisorios) y el panel los edita.
insert into tienda_config (clave, valor) values ('sitio', '{}'::jsonb), ('pagos', '{"proveedor_activo": "manual", "modo": "prueba"}'::jsonb)
on conflict (clave) do nothing;


-- ═══════════════════════════════════════════════════════════════════════
-- BLOQUE 6 · REGISTRO DEL PROYECTO EN LA TABLA MAESTRA (siempre al final)
-- ═══════════════════════════════════════════════════════════════════════

insert into proyectos (identificador, nombre, descripcion, tablas, link_github, link_web, estado)
values (
  'tienda',
  'Modas Naty — Tienda online',
  'Tienda online con carrito, pasarela de pago, kiosco con ticket y panel. Comparte el catálogo naty_* con el sistema de notas de venta. Provisorio acá; migra con naty_ a cuenta propia de la clienta.',
  '["tienda_pedidos","tienda_pedido_items","tienda_pedido_historial","tienda_pagos","tienda_webhook_eventos","tienda_gasto_categorias","tienda_gastos","tienda_kiosco_dispositivos","tienda_config","tienda_catalogo_publico (vista)","bucket:tienda_comprobantes"]'::jsonb,
  'https://github.com/EscencialConsult/tienda-natali-online',
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

-- ── 2026-10-13 · Conversión de moneda configurable (bolivianos ↔ pesos argentinos) ──
-- La administración carga "X bolivianos = Y pesos argentinos" en el panel. Cada cambio sube la versión y queda en el
-- historial. Los pedidos ya creados conservan el valor con el que se crearon.

alter table tienda_pedidos add column if not exists cambio_version integer;

create table if not exists tienda_cambio_historial (
  id bigint generated always as identity primary key,
  version integer not null,
  bs numeric(14, 4) not null check (bs > 0),
  ars numeric(14, 4) not null check (ars > 0),
  usuario_id uuid,
  nota text not null default '',
  creado_en timestamptz not null default now()
);
alter table tienda_cambio_historial enable row level security;
drop policy if exists "tienda_cambio_historial_leer" on tienda_cambio_historial;
create policy "tienda_cambio_historial_leer" on tienda_cambio_historial for select to authenticated using (naty_es_rol('admin'));
revoke all on table tienda_cambio_historial from public, anon, authenticated;
grant select on tienda_cambio_historial to authenticated;

-- Valor inicial: 5 bolivianos = 1 peso argentino (pedido de la clienta del 13/10/2026). Se cambia desde el panel.
insert into tienda_config (clave, valor)
values ('cambio', '{"bs": 5, "ars": 1, "version": 1, "actualizado_en": null}'::jsonb)
on conflict (clave) do nothing;

-- p = { bs, ars, nota? }. Solo administración. Devuelve la conversión vigente.
create or replace function tienda_guardar_cambio(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_bs numeric := (p ->> 'bs')::numeric;
  v_ars numeric := (p ->> 'ars')::numeric;
  v_version integer;
  v_nuevo jsonb;
begin
  if not naty_es_rol('admin') then
    raise exception 'Solo la administración puede cambiar la conversión de moneda' using errcode = '42501';
  end if;
  if v_bs is null or v_ars is null or v_bs <= 0 or v_ars <= 0 or v_bs > 1000000 or v_ars > 1000000 then
    raise exception 'La conversión necesita dos números mayores a 0' using errcode = '22023';
  end if;
  v_version := tienda_version_cambio() + 1;
  v_nuevo := jsonb_build_object('bs', v_bs, 'ars', v_ars, 'version', v_version, 'actualizado_en', now(), 'actualizado_por', auth.uid());
  insert into tienda_config (clave, valor) values ('cambio', v_nuevo)
  on conflict (clave) do update set valor = excluded.valor;
  insert into tienda_cambio_historial (version, bs, ars, usuario_id, nota)
  values (v_version, v_bs, v_ars, auth.uid(), left(coalesce(p ->> 'nota', ''), 200));
  return v_nuevo - 'actualizado_por';
end $$;
revoke all on function tienda_guardar_cambio(jsonb), tienda_version_cambio() from public, anon, authenticated;
grant execute on function tienda_guardar_cambio(jsonb) to authenticated;

-- ── 2026-10-13 · Recargo por pago en línea (Mercado Pago y QR) ──
-- Mercado Pago descuenta una comisión (y retenciones) de cada cobro. La tienda quiere cobrar su monto completo, así que al
-- pagar por Mercado Pago o por QR se suma un recargo (en porcentaje) para que, descontado lo de Mercado Pago, llegue el total.
-- Se edita en el panel (Configuración, Pagos). El pedido guarda su total SIN recargo; el recargo se calcula al cobrar.
-- Valor inicial 4 %: es lo que descontó Mercado Pago en el primer cobro real por QR con dinero en cuenta. Ajustarlo en el panel.
insert into naty_config (clave, valor) values ('recargo_mp', '{"pct": 4}'::jsonb)
on conflict (clave) do nothing;
