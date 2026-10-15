# Cambios en archivos del sistema de Renzo

Regla 4 del plan: el código de Renzo se toca lo mínimo y cada edición se anota acá, con motivo y cómo deshacerla.
Los archivos **nuevos** que no pisan nada de él se anotan en la segunda tabla.

## Archivos existentes de Renzo que se editan

| # | Archivo | Qué cambia | Por qué | Cómo se deshace | Estado |
|---|---|---|---|---|---|
| 1 | `app/src/app/App.jsx` | Montar `/tienda/*` antes de `Arranque`, `AuthProvider`, `PrimeraCarga` y `SyncRunner` | Que la tienda pública no toque su base local ni su cola de sincronización (decisión D2) | Revertir las líneas del selector de ruta | **Hecho 15/10** (E2.1): `lazy` + `Selector` por ruta; el árbol interno quedó igual dentro de `AppInterna` |
| 2 | `app/src/features/ajustes/*` | Un acordeón nuevo "Tienda online", sin tocar los existentes | Que Natali edite datos de transferencia, locales y horarios (E4.3) | Quitar el acordeón | **Hecho 15/10** (E4.4): un import y un bloque que renderiza `TiendaAjustes`; no toca sus secciones |
| 3 | `app/public/icons/*.png` y `favicon` | Reemplazar los íconos "MN" por el logo real de Modas Naty | Coherencia de marca: el logo real nunca llegó al sistema de Renzo (E4b) | Restaurar los 4 PNG desde git | Pendiente (E4b) |
| 4 | `app/vite.config.js` | Solo si el nombre o color del manifiesto cambian con el logo | Idem | Revertir las líneas | Pendiente (E4b) |

## Archivos nuevos (no pisan nada)

| Archivo | Para qué |
|---|---|
| `app/public/brand/imagotipo.png`, `isotipo.png` | Logos reales de Modas Naty, usados solo por `/tienda/*` y, en E4b, por Ajustes |
| `app/src/features/tienda/**` | Toda la tienda pública (E2 en adelante) |
| `app/supabase/tienda_schema.sql` | Esquema aditivo `tienda_*` (E1) |
| `app/scripts/aplicar-tienda.mjs` | Ejecutor propio: guardia estática y rollback automático si `naty_*` cambia (E1.4) |
| `app/src/data/remoto/tienda-esquema.test.js` | 19 pruebas del esquema, permisos y ejecutor contra su `naty_schema.sql` real |
| `tienda-origen/**` | Copia de referencia de la tienda original. No compila |
| `Docs/tienda/**` | Plan, contrato, línea base y herramientas |

## Lo que NO se toca nunca

`naty_schema.sql`, `app/src/data/**` (salvo lectura), `app/src/features/ventas|nota|inventario|usuarios|dashboard|comisiones`, el service worker compartido y la IndexedDB `modas-naty`.
