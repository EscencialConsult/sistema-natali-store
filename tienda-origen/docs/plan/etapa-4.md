# Etapa 4 — Backend de la tienda (16 h)
Estado: [x] cerrada en código el 2026-10-09 (`notas-etapa-4.md`). **Pendiente de Facundo: aplicar el esquema en la instancia compartida** (`scripts/aplicar-schema.mjs`) y cargar las variables en Netlify.
Leer: `_comun.md`, `../04-arquitectura.md` (modelo de datos, funciones, estados, D4, D5, D9), `../SISTEMA DE NOTA/app/SUPABASE-REGLAS.md` (las 5 reglas, modo de acceso), `../SISTEMA DE NOTA/app/supabase/naty_schema.sql` (patrón de funciones `SECURITY DEFINER`, RLS, vista pública), `../SISTEMA DE NOTA/app/src/data/remoto/*.test.js` (pruebas con PGlite).
Principio: **lo delicado (crear pedido, confirmar pago, descontar stock) lo decide la base, nunca el navegador.**

Requiere: decisión D4 confirmada (catálogo compartido) y D2 (Netlify Functions).

### Tarea 4.1 · Campos nuevos en el catálogo y vista pública · 2 h
Estado: [x] (2026-10-09)
**Archivos**: sección nueva al final de `../SISTEMA DE NOTA/app/supabase/naty_schema.sql` (se edita en el proyecto hermano, con fecha, idempotente: `alter table ... add column if not exists`), `app/supabase/tienda_schema.sql` bloque 1 (vista `tienda_catalogo_publico`).
**Alcance**: `precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug` (único, con backfill desde código); `naty_guardar_producto` acepta los campos nuevos; vista pública con stock disponible por color (stock − reservas vigentes) sin costos ni movimientos; permiso `select` a `anon` solo sobre la vista.
**Pasos**
- [x] (2026-10-09) 1. Sección fechada al final de `../SISTEMA DE NOTA/app/supabase/naty_schema.sql`: columnas `precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug` (índice único parcial) y `pedido_id` en `naty_movimientos_stock`; valores `reserva`, `liberacion`, `devolucion` en `naty_tipo_movimiento`; backfill de `slug`; `naty_guardar_producto` acepta los campos nuevos.
- [x] (2026-10-09) 2. Vista `tienda_catalogo_publico` en `tienda_schema.sql` (publicados, con precio y disponible por color = suma de movimientos). `anon` solo lee la vista.
- [x] (2026-10-09) 3. Correr las pruebas del sistema hermano con el esquema modificado.
**Criterios de aceptación**
- [x] (2026-10-09) El sistema de nota sigue pasando todas sus pruebas tras el cambio (correr su `npm test`).
- [x] (2026-10-09) `anon` no lee `naty_productos` directo; sí la vista.
**Bloqueos**: D4.

### Tarea 4.2 · Esquema `tienda_` · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `app/supabase/tienda_schema.sql` (tipos, tablas, índices, `updated_at`), `app/supabase/README.md`, `app/SUPABASE-REGLAS.md` (copia adaptada: prefijo `tienda`, bucket `tienda_comprobantes` privado).
**Alcance**: `tienda_pedidos`, `tienda_pedido_items`, `tienda_pedido_historial`, `tienda_pagos`, `tienda_webhook_eventos`, `tienda_gasto_categorias`, `tienda_gastos`, `tienda_kiosco_dispositivos`, `tienda_config`; secuencia para el código `TN-000001`; checks de dinero ≥ 0; un pedido en una sola moneda; registro en la tabla maestra `proyectos` (clave `tienda-naty`).
**Pasos**
- [x] (2026-10-09) 1. `app/supabase/tienda_schema.sql` bloques 0 a 1: verificación de que `naty_` existe, tipos, tablas (`tienda_pedidos` con `numero` por secuencia y `codigo` generado `TN-000001`, ítems, historial, pagos, webhooks, gastos, categorías de gasto, kiosco, config), índices, `updated_at`, FK `naty_movimientos_stock.pedido_id`.
- [x] (2026-10-09) 2. `app/supabase/README.md` y `app/SUPABASE-REGLAS.md` adaptados (prefijo `tienda`, bucket privado `tienda_comprobantes`).
**Criterios de aceptación**
- [x] (2026-10-09) El archivo corre dos veces seguidas sin error (prueba automática).
**Bloqueos**: ninguno.

### Tarea 4.3 · Funciones del pedido · 4 h
Estado: [x] (2026-10-09)
**Archivos**: `tienda_schema.sql` bloque 2: `tienda_crear_pedido`, `tienda_confirmar_pago`, `tienda_cambiar_estado`, `tienda_cancelar_pedido`, `tienda_reembolsar_pedido`, `tienda_vencer_reservas`, `tienda_pedido_publico(codigo, telefono)`, `tienda_activar_kiosco(pin)`; `pg_cron` cada 5 min para vencer reservas (o Netlify Scheduled Function si `pg_cron` no está habilitado en la instancia compartida: decidir en el paso).
**Alcance**: reserva = movimiento de stock tipo `reserva` con `vence_en`; confirmar pago convierte reserva en `venta` en la misma transacción; transiciones válidas en una tabla SQL (misma que `src/lib/pedido.js`, con test que compara ambas); historial con usuario y motivo; todo recibe `jsonb` validado dentro de la función; errores con códigos propios (`TIENDA_STOCK_INSUFICIENTE`, `TIENDA_TRANSICION_INVALIDA`) que la app traduce.
**Pasos**
- [x] (2026-10-09) 1. Funciones: `tienda_disponible`, `tienda_crear_pedido` (anon; valida, bloquea el color con `for update`, copia precio y nombres, reserva), `tienda_confirmar_pago` (servicio o encargada para caja/transferencia; reserva → venta; registra en `tienda_pagos`), `tienda_cambiar_estado` (tabla de transiciones; cancelar libera, reembolsar devuelve), `tienda_vencer_reservas`, `tienda_pedido_publico(codigo, telefono)`, `tienda_sitio_publico()`.
- [x] (2026-10-09) 2. Errores con códigos propios (`TIENDA_STOCK_INSUFICIENTE`, `TIENDA_TRANSICION_INVALIDA`) en el `detail`.
- [x] (2026-10-09) 3. `pg_cron` cada 5 min para vencer reservas, guardado con `if exists` (si la instancia no lo tiene, la Netlify Scheduled Function `vencer-reservas` lo hace).
**Criterios de aceptación**
- [x] (2026-10-09) Dos pedidos simultáneos por la última unidad: uno gana, el otro recibe `TIENDA_STOCK_INSUFICIENTE` (test con dos transacciones).
**Bloqueos**: ninguno.

### Tarea 4.4 · RLS, privilegios y pruebas · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `tienda_schema.sql` bloque 4; `src/data/remoto/tienda-esquema.test.js` (PGlite, aplica `naty_schema.sql` + `tienda_schema.sql` dos veces).
**Alcance**: `anon`: solo vista pública y las funciones `tienda_pedido_publico` y `tienda_crear_pedido` (con límites: rate por IP se resuelve en la Function, no en SQL); `authenticated` con perfil: por rol según la matriz de `../02-roles-y-casos-de-uso.md`; `service_role` para webhook y kiosco; bucket `tienda_comprobantes` privado (lectura solo panel).
**Pasos**
- [x] (2026-10-09) 1. Bloque 4: RLS y privilegios por rol según `../02-roles-y-casos-de-uso.md`; `anon` solo vista, `tienda_crear_pedido`, `tienda_pedido_publico`, `tienda_sitio_publico`.
- [x] (2026-10-09) 2. `src/data/remoto/servidorPrueba.js` (stub de auth/storage + los dos esquemas, aplicados dos veces) y `tienda-esquema.test.js`: idempotencia, anon no lee pedidos, crear pedido reserva stock, última unidad (segundo pedido falla con código), confirmar pago, transiciones, cancelar libera, vencer reservas, consulta pública, permisos por rol (encargada no edita precios, depósito no ve gastos), vista pública sin costos.
- [x] (2026-10-09) 3. Prueba que compara `TRANSICIONES` de `lib/pedido.js` con la función SQL.
**Criterios de aceptación**
- [x] (2026-10-09) Pruebas: anon no lee pedidos ajenos; encargada no edita precios; depósito no ve gastos; admin todo.
**Bloqueos**: B6 (permisos exactos) → se aplica la matriz propuesta y se marca.

### Tarea 4.5 · Repositorios remotos · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/data/repos/remoto/{productos,pedidos,pagos,gastos,sitio,kiosco,stock}.js`, `src/data/repos/index.js` (elige remoto si `hayBackend`), `src/data/supabase.js` heredado.
**Alcance**: misma interfaz que los locales; catálogo público leído desde la vista; carrito sigue local; errores de la base traducidos en `src/lib/errores.js`; caché del catálogo en Dexie para el kiosco (bajada incremental por `updated_at`, patrón heredado de `sync/remoto.js`).
**Pasos**
- [x] (2026-10-09) 1. `src/data/repos/remoto/{pedidos,pagos,gastos,sitio,kiosco}.js` con la misma interfaz (pedidos por RPC y tablas con RLS; carrito y catálogo siguen locales alimentados por `sync/remoto.js`).
- [x] (2026-10-09) 2. `repos/index.js` elige remoto cuando `hayBackend`; `sync/remoto.js` baja `tienda_config` y envía pedidos locales (`pedido/crear`, para el kiosco).
- [x] (2026-10-09) 3. `lib/errores.js` traduce los códigos de la base.
**Criterios de aceptación**
- [x] (2026-10-09) Cambiar `index.js` entre local y remoto no toca ninguna pantalla.
**Bloqueos**: ninguno.

### Tarea 4.6 · Netlify Functions base · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `app/netlify/functions/_lib/{supabase.js (service_role), auth.js (valida JWT de Supabase y rol), respuesta.js, validar.js (zod)}`, `netlify/functions/salud.js`, `netlify.toml` (`[functions] directory`, `node_bundler = "esbuild"`), `netlify/.env.example`, `iniciar-dev.bat` con `netlify dev`.
**Alcance**: estructura, manejo de errores uniforme (nunca filtrar stack al cliente), CORS solo al dominio propio, límite de tamaño de body, `TZ=America/La_Paz`; prueba unitaria de `auth.js` con un JWT de prueba.
**Pasos**
- [x] (2026-10-09) 1. `app/netlify/functions/_lib/{supabase.js, auth.js, respuesta.js, validar.js}`, `salud.js`, `vencer-reservas.js` (programada), `netlify/.env.example`, `netlify.toml` ya apunta a la carpeta.
- [x] (2026-10-09) 2. Prueba unitaria de `respuesta.js`/`validar.js`; `netlify dev` documentado en `app/README.md`.
**Criterios de aceptación**
- [x] (2026-10-09) `netlify dev` levanta sitio + functions en local; `salud` responde con la hora en La Paz.
**Bloqueos**: cuenta de Netlify ya existe (sistema de nota).

**Cierre de etapa**: esquema aplicado en la instancia compartida con el runner (autorización de Facundo, como en el sistema de nota); pruebas de los dos esquemas verdes; la tienda navega contra datos reales; `notas-etapa-4.md`. Pedir autorización Etapa 5, 6 o 7 (son independientes).
