# Contrato entre la tienda pública y el sistema de nota

Versión 1, 2026-10-15. Si algo de la lista "La tienda lee" cambia, hay que avisar antes de publicarlo.
La verificación es automática: `app/src/data/remoto/tienda-esquema.test.js` aplica `naty_schema.sql` y después `tienda_schema.sql` y falla si la tienda deja de funcionar o si algún objeto `naty_*` cambia.

## La tienda lee (solo lectura, siempre a través de vistas `tienda_*`)

| Objeto de Renzo | Columnas o claves que usa | Para qué |
|---|---|---|
| `naty_productos` | `id`, `codigo`, `nombre`, `categoria_id`, `descripcion`, `precio_docena_usd_cent`, `nuevo`, `activo` | Catálogo |
| `naty_categorias` | `id`, `nombre` | Filtro por categoría |
| `naty_producto_fotos` | `producto_id`, `id`, `orden`, `ruta` | Fotos. `ruta` puede ser URL absoluta o relativa al bucket |
| `naty_config` | `negocio.nombre`, `tipo_cambio.bs`, `tipo_cambio.ars`, `tipo_cambio.ejemplo`, `tipo_cambio.actualizado_en`, `mostrar_precios_publico`, `whatsapp_tienda` | Conversión de moneda y contacto |
| `naty_es_rol(variadic naty_rol_usuario[])` | Se llama con `'admin'` (incluye `superadmin`) | Quién edita la tienda |
| Bucket `naty_productos` | Lectura pública de las URLs ya guardadas | Imágenes |

Convenciones que se asumen: precio en **USD por docena en centavos**, `tipo_cambio` expresado como unidades de Bs y de ARS por 1 USD, una docena = 12 unidades.

## La tienda NO lee

`naty_perfiles` (personas y teléfonos), `naty_movimientos_stock` (stock), `naty_ventas`, `naty_venta_items`, `naty_producto_colores`, `naty_limpiezas`.
Por eso la tienda V1 no muestra disponibilidad: el vendedor la confirma.

## La tienda escribe

Solo objetos `tienda_*`, y nunca borra.

| Objeto nuevo | Qué es | Quién escribe |
|---|---|---|
| `tienda_config` | Datos de transferencia, locales, horarios, contactos, textos | admin y superadmin. Sin DELETE |
| `tienda_oculto` | Marca para ocultar un producto de la tienda | admin y superadmin. Sin DELETE: mostrar de nuevo es `oculto = false` |
| `tienda_catalogo_publico` (vista) | Catálogo con lista blanca de columnas | Nadie. Solo lectura |
| `tienda_ajustes_publicos` (vista) | Tipo de cambio, WhatsApp y nombre, validados | Nadie. Solo lectura |
| `tienda_tocar_updated_at()` | Trigger de `updated_at` de las dos tablas | Interno |

## Qué le pedimos a Renzo

1. Avisar antes de renombrar o quitar cualquiera de las columnas o claves de la primera tabla.
2. Avisar si cambia la firma o el significado de `naty_es_rol`.
3. Avisar si las fotos pasan a otra tabla, o si el precio deja de estar en USD por docena.
4. Que `naty_schema.sql` no cree objetos con prefijo `tienda_`.

## Cómo se aplica a producción

Nunca a mano. `app/scripts/aplicar-tienda.mjs` hace, en una sola transacción:

1. Guardia estática: rechaza DELETE, TRUNCATE, DROP de tablas, ALTER sobre `naty_*`, extensiones y SQL dinámico.
2. Foto de la estructura de `naty_*` antes y después.
3. Si algún objeto de Renzo cambió, **revierte solo**.
4. Sin `--aplicar` es una prueba y revierte siempre.

## Cómo se retira la tienda

Solo con OK explícito, porque borra objetos de la tienda (nunca de Renzo): volver `App.jsx` a como estaba y, si hace falta, retirar las dos vistas y las dos tablas `tienda_*`. Los datos de `tienda_config` son lo único que se pierde.
