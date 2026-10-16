# Tienda online de Modas Naty: índice

La tienda pública vive en la raíz del sitio y el sistema de notas de Renzo en `/admin`. Todo lo nuevo está en objetos `tienda_*` y en `app/src/features/tienda/`. Nada de Renzo se modifica salvo lo anotado en el registro de cambios.

## Para empezar

| Quiero... | Leer |
|---|---|
| Entender qué se decidió y en qué etapa estamos | [PLAN.md](PLAN.md) |
| Saber qué dato se ve, dónde vive y quién lo escribe | [MAPA-DE-DATOS.md](MAPA-DE-DATOS.md) |
| Ver los hallazgos de seguridad y consistencia | [AUDITORIA-2026-10-15.md](AUDITORIA-2026-10-15.md) |
| Ver qué archivos de Renzo se tocaron | [CAMBIOS-EN-ARCHIVOS-DE-RENZO.md](CAMBIOS-EN-ARCHIVOS-DE-RENZO.md) |
| Saber qué lee la tienda de las tablas de Renzo | [CONTRATO.md](CONTRATO.md) |

## Para publicar

| Quiero... | Leer |
|---|---|
| Aplicar la tienda a producción, con vuelta atrás | [PUBLICACION.md](PUBLICACION.md) |
| Avisarle a Renzo | [MENSAJE-A-RENZO.md](MENSAJE-A-RENZO.md) |
| Comparar el estado de la base antes y después | [linea-base.md](linea-base.md) y `herramientas/` |

## Para el negocio

| Quiero... | Leer |
|---|---|
| Qué datos cargar y dónde (Natali) | [GUIA-PARA-NATALI.md](GUIA-PARA-NATALI.md) |
| Datos que ya llegaron de la clienta | [DATOS-RECIBIDOS.md](DATOS-RECIBIDOS.md) |
| Probar todo en mi computadora | [DEMO-LOCAL.md](DEMO-LOCAL.md) |

## Dónde está el código

| Carpeta | Qué hay |
|---|---|
| `app/src/features/tienda/publico/` | Páginas que ve la clienta |
| `app/src/features/tienda/admin/` | Gestor web (solo superadmin) |
| `app/src/features/tienda/lib/` | Reglas puras: precios, pedido, cuenta, mensaje |
| `app/src/features/tienda/data/` | Acceso a la base, caché y carrito |
| `app/src/features/tienda/pruebas/` | Pruebas de la tienda |
| `app/supabase/tienda_schema.sql` | Tablas, vistas y permisos nuevos |
| `app/scripts/` | Aplicar esquema, cargar configuración, servidor demo |
| `tienda-origen/` | Copia de la tienda anterior, solo de referencia, no se compila |
