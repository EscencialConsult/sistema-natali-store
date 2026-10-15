# Base de datos de la tienda (Supabase)

Dos archivos idempotentes, en este orden (regla de la skill `supabase-automatizacion-skill`; leer [`../SUPABASE-REGLAS.md`](../SUPABASE-REGLAS.md) primero):

1. **`naty_schema.sql`** — vive en el sistema de notas de venta (`../../SISTEMA DE NOTA/app/supabase/`). Es el **catálogo compartido** (decisión D4): productos, colores, fotos, categorías, movimientos de stock, perfiles y configuración. La sección "2026-10-09 · Campos de la tienda online" le agrega precio minorista, publicación, destacado, slug, `pedido_id` en movimientos y los tipos `reserva` / `liberacion` / `devolucion`.
2. **[`tienda_schema.sql`](tienda_schema.sql)** — todo lo propio de la tienda, con prefijo `tienda_`. Falla a propósito si el `naty_` no está actualizado.

| Bloque de `tienda_schema.sql` | Qué hace |
|---|---|
| 0 | Verifica que `naty_` esté aplicado y actualizado |
| 1 | Tipos y tablas: pedidos (código `TN-000001` por secuencia), ítems, historial, pagos, eventos de webhook, gastos y categorías, dispositivos de kiosco, config |
| 2 | Funciones: `tienda_crear_pedido` (anon; bloquea el color y reserva stock), `tienda_confirmar_pago` (webhook o encargada), `tienda_cambiar_estado` (transiciones), `tienda_vencer_reservas` (cron / Function), `tienda_pedido_publico`, `tienda_sitio_publico`, vista `tienda_catalogo_publico` |
| 3 | Bucket privado `tienda_comprobantes` |
| 4 | RLS y privilegios por rol (matriz de `src/lib/permisos.js`) |
| 5 | Categorías de gasto y config base |
| 6 | Registro `tienda` en la tabla maestra `proyectos` |

## Cómo funciona la seguridad
- **`anon`** (la compradora, sin sesión) solo puede: leer la vista del catálogo, crear un pedido, consultar un pedido con código + teléfono y leer la configuración pública. Todo por funciones que validan y bloquean el stock del lado del servidor.
- **Miembros** (perfil `naty_perfiles` activo): administración y encargadas ven pedidos y pagos, confirman pagos en caja/transferencia y mueven estados; cancelar y reembolsar es solo administración; depósito no ve pedidos ni gastos.
- **`service_role`** (Netlify Functions, cron): confirma pagos en línea (webhook), crea pedidos del kiosco, vence reservas. Nunca va en la app.
- El stock es **uno solo** para los dos sistemas: las reservas de la tienda son movimientos en `naty_movimientos_stock` (negativos) que se liberan al pagar (y se vuelven venta), cancelar o vencer.

## Probar sin tocar la nube
`npx vitest run --root R:\app src/data/remoto` aplica los dos esquemas (dos veces) sobre un Postgres real en memoria (PGlite) y comprueba permisos, pedidos, pagos, estados, vencimiento y la vista pública (16 pruebas).

## Aplicar en la instancia compartida (solo con OK de Facundo)
1. Aplicar primero el `naty_schema.sql` actualizado desde el sistema de nota (su runner o SQL Editor).
2. `DATABASE_URL=... node scripts/aplicar-schema.mjs --dry` (prueba y deshace), después sin `--dry`. O SQL Editor → pegar `tienda_schema.sql` completo → Run.
3. `node scripts/verificar-schema.mjs` (solo lectura).
4. Cargar en Netlify las variables de `netlify/.env.example`.

## Migrar a la cuenta de la clienta
Igual que el sistema de nota, pero **los dos sistemas juntos** (comparten catálogo): aplicar `naty_schema.sql` y `tienda_schema.sql`, copiar datos (`pg_dump --data-only` de `naty_*` y `tienda_*`, respetando claves foráneas), copiar los buckets `naty_productos` y `tienda_comprobantes`, recrear usuarios, cambiar variables en Netlify de los dos sitios, comparar conteos, borrar del proyecto compartido y marcar `naty` y `tienda` como `archivado` en `proyectos`.
