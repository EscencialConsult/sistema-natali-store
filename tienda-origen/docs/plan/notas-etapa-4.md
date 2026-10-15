# Notas de cierre — Etapa 4: Backend de la tienda (2026-10-09)

Verificación: lint sin avisos (`src` y `netlify`) · build OK · **88 pruebas en 13 archivos**, entre ellas 16 del esquema sobre un Postgres real en memoria (PGlite) que aplica `naty_schema.sql` + `tienda_schema.sql` dos veces, y 3 de las Netlify Functions · pruebas del sistema hermano corridas con el `naty_schema.sql` modificado (ver abajo).

**El esquema NO está aplicado en la instancia compartida**: se aplica solo con OK explícito de Facundo (paso de cierre). Scripts listos: `app/scripts/aplicar-schema.mjs --dry` y `verificar-schema.mjs`.

## Qué quedó hecho
- **4.1** Sección "2026-10-09 · Campos de la tienda online" al final de `../SISTEMA DE NOTA/app/supabase/naty_schema.sql`: `precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug` (único, con backfill por `naty_slug_de`), `pedido_id` en movimientos, valores `reserva` / `liberacion` / `devolucion` en el enum, y `naty_guardar_producto` que conserva los campos de tienda si no vienen. Vista `tienda_catalogo_publico` con disponible por color.
- **4.2** `app/supabase/tienda_schema.sql`: verificación previa, tipos, 9 tablas (`tienda_pedidos` con código `TN-000001` generado desde una secuencia), FK de `naty_movimientos_stock.pedido_id`, índices, `updated_at`, bucket privado `tienda_comprobantes`, registro `tienda` en `proyectos`. `README.md` y `SUPABASE-REGLAS.md` adaptados.
- **4.3** Funciones: `tienda_crear_pedido` (anon; valida, bloquea el color con `for update`, copia precio y nombres, reserva por 30 min / 24 h / 12 h según medio de pago; idempotente por id), `tienda_confirmar_pago` (servicio para Mercado Pago; encargada para caja/transferencia; reserva → venta; `tienda_pagos` con `idempotency_key`), `tienda_cambiar_estado` (tabla de transiciones; cancelar libera, reembolsar devuelve), `tienda_vencer_reservas` (solo servicio; `pg_cron` si existe + Function programada), `tienda_pedido_publico`, `tienda_sitio_publico`. Errores con `detail` `TIENDA_STOCK_INSUFICIENTE` / `TIENDA_TRANSICION_INVALIDA`.
- **4.4** RLS y privilegios: `anon` no lee tablas (solo vista y 3 funciones); administración y encargadas ven pedidos y pagos; gastos por rol; depósito ni pedidos ni gastos; `authenticated` no borra nada. Pruebas: idempotencia, transiciones iguales a `lib/pedido.js`, catálogo público sin ocultos, última unidad, todo-o-nada, ARS con tipo de cambio, kiosco solo desde servidor, consulta pública, pago en línea solo servidor, encargada confirma caja y mueve estados, reembolso devuelve stock, vencimiento, permisos.
- **4.5** Repositorios remotos `pedidos`, `pagos`, `gastos`, `sitio` (con caché local para abrir sin red), `kiosco` (stub hasta la 6); `repos/index.js` los elige con `hayBackend`; catálogo, stock, perfiles y config siguen locales alimentados por `sync/remoto.js`, que ahora baja los campos de tienda y envía pedidos/pagos/estados creados en el dispositivo (kiosco). `lib/errores.js`.
- **4.6** Netlify Functions base: `_lib/respuesta.js` (CORS, métodos, tamaño, errores sin filtrar detalle), `validar.js` (zod), `supabase.js` (service_role), `auth.js` (JWT + perfil + rol), `salud.js`, `vencer-reservas.js` programada cada 5 min en `netlify.toml`; `netlify/.env.example`.

## Decisiones
- `tienda_es_servicio()` = JWT con `role=service_role` o sin JWT (superusuario / pruebas). Así el webhook y el cron confirman pagos sin sesión de persona, y una encargada no puede marcar como pagado un pedido de Mercado Pago a mano.
- El bloqueo del color con `select … for update` dentro de `tienda_crear_pedido` serializa dos compras simultáneas de la última unidad: la segunda ve la reserva de la primera y falla con código. No se confía en el stock que vio el navegador.
- `tienda_disponible` se concede a `anon` porque la vista pública la usa; solo suma movimientos.
- Las reservas y ventas de la tienda viven en `naty_movimientos_stock` (stock único con el sistema de nota), con `pedido_id` y los tres tipos nuevos; la política de inserción directa del sistema de nota sigue limitada a entrada/salida/ajuste.

## Queda afuera a propósito
- Aplicar el esquema en la instancia compartida y cargar variables en Netlify: esperan OK de Facundo.
- `pagos.iniciar` remoto para Mercado Pago, webhook, reembolso y subida de comprobantes: etapa 5.
- Activación del kiosco contra la base: etapa 6. Pantallas del panel que usen `gastos`/`pedidos` remotos: etapa 7.
- Rate limit de `tienda_crear_pedido` para anónimos: se resuelve en la Function de checkout (etapa 5) o con reglas de Netlify, no en SQL.

## Aprendizajes
- `alter type … add value if not exists` corre dentro de la transacción del runner (Postgres ≥ 12) mientras el valor nuevo no se use en esa misma transacción; los cuerpos plpgsql no lo validan al crearse.
- Un `order by` sobre un enum ordena por posición de declaración, no alfabéticamente: en las pruebas se ordena en JS.
- Una vista no hereda el permiso de ejecutar las funciones que llama: hay que concederlas al rol que lee la vista.
- Desde la unidad `R:` (que monta solo `TIENDA ONLINE`) la ruta relativa al repo hermano no existe: `servidorPrueba.js` prueba la relativa, la real y `NATY_SCHEMA`.
