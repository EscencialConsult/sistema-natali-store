# Cambios en archivos del sistema de Renzo

Regla 4 del plan: el código de Renzo se toca lo mínimo y cada edición se anota acá, con motivo y cómo deshacerla.
Los archivos **nuevos** que no pisan nada de él se anotan en la segunda tabla.

## Archivos existentes de Renzo que se editan

| # | Archivo | Qué cambia | Por qué | Cómo se deshace | Estado |
|---|---|---|---|---|---|
| 1 | `app/src/app/App.jsx` | Montar la tienda pública (raíz `/`) y el sistema bajo `/admin`, antes de `Arranque`, `AuthProvider`, `PrimeraCarga` y `SyncRunner` | Que la tienda pública no toque su base local ni su cola de sincronización (decisión D2) | Revertir las líneas del selector de ruta | **Hecho 15/10** (E2.1, ajustado por D20): `BrowserRouter` con `basename="/admin"` si la ruta empieza con `/admin`; el árbol interno quedó igual dentro de `AppInterna` y la tienda se monta en la raíz |
| 2 | `app/src/features/ajustes/*` | Un acordeón nuevo "Tienda online", sin tocar los existentes | Que Natali edite datos de transferencia, locales y horarios (E4.3) | Quitar el acordeón | **Hecho 15/10** (E4.4): un import y un bloque que renderiza `TiendaAjustes`; no toca sus secciones |
| 3 | `app/public/icons/*.png` y `favicon` | Reemplazar los íconos "MN" por el logo real de Modas Naty | Coherencia de marca: el logo real nunca llegó al sistema de Renzo (E4b) | Restaurar los 4 PNG desde git | **Hecho 15/10** (E4b.5): 4 PNG reemplazados por los de la tienda y `favicon.svg` con el logo real embebido |
| 4 | `app/vite.config.js` | Manifiesto de la app instalada: `id`, `start_url` y `scope` pasan de `/` a `/admin/` | D20 y D21: la raíz es la tienda pública | Volver a `'/'` los tres valores | **Hecho 15/10** |
| 5 | `app/public/_redirects` | Línea `/c  /  301` antes del comodín | Los QR ya impresos apuntaban a `/c` | Quitar la línea | **Hecho 15/10** |
| 6 | `app/src/components/Logo.jsx`, `useMarca.js` | Sin logo propio cargado, se muestra el logo real de Modas Naty (imagotipo e isotipo de `app/public/brand`) en vez del monograma | Coherencia de marca en login, menú y barra superior; pedido del dueño 15/10 | Restaurar los dos archivos desde git | **Hecho 15/10** |
| 7 | `app/src/components/ui/Avatar.jsx` y los 5 lugares donde se usa (`Layout`, `ComisionesPage`, `DashboardPage`, `UsuariosPage`) | El avatar muestra un ícono según el rol en vez de las iniciales | Pedido del dueño 15/10 | Restaurar los archivos | **Hecho 15/10** |
| 8 | `app/src/app/Layout.jsx` | Menú lateral minimizable (se recuerda en el navegador) | Pedido del dueño 15/10 | Restaurar el archivo | **Hecho 15/10** |
| 9 | `app/src/app/ConexionPildora.jsx` | Indicador de conexión discreto (punto y palabra) en lugar de la insignia de color | Pedido del dueño 15/10 | Restaurar el archivo | **Hecho 15/10** |
| 10 | `app/src/features/auth/LoginPage.jsx` | Pantalla de ingreso con el logo real | Pedido del dueño 15/10 | Restaurar el archivo | **Hecho 15/10** |
| 11 | `app/src/features/ajustes/AjustesPage.jsx` (ampliación) | Dos pestañas para el superadmin: «Ajustes generales» y «Gestor web». Muestra el logo de fábrica en la tarjeta del logo | Pedido del dueño 15/10 | Restaurar el archivo y la línea del import | **Hecho 15/10** |
| 12 | `app/src/components/ui/Tabs.jsx` | Navegación con flechas, Inicio y Fin; alto mínimo de 44 px (antes 40). Se nota en todas las pantallas que usan pestañas | Accesibilidad, hallazgo del duelo de IA 15/10 | Restaurar el archivo | **Hecho 15/10** |
| 13 | `app/vite.config.js` (ampliación) | `globIgnores` excluye del precaché el mapa de la tienda (`MapaLibre*`, `maplibre-gl*`) | Que la app instalada del equipo no descargue 1,5 MB que no usa | Quitar esos dos patrones | **Hecho 15/10** |

## Archivos nuevos (no pisan nada)

| Archivo | Para qué |
|---|---|
| `app/public/brand/imagotipo.png`, `isotipo.png` | Logos reales de Modas Naty, usados solo por la tienda pública y, en E4b, por Ajustes |
| `app/src/features/tienda/**` | Toda la tienda pública (E2 en adelante) |
| `app/supabase/tienda_schema.sql` | Esquema aditivo `tienda_*` (E1) |
| `app/scripts/aplicar-tienda.mjs` | Ejecutor propio: guardia estática y rollback automático si `naty_*` cambia (E1.4) |
| `app/src/data/remoto/tienda-esquema.test.js` | 19 pruebas del esquema, permisos y ejecutor contra su `naty_schema.sql` real |
| `tienda-origen/**` | Copia de referencia de la tienda original. No compila |
| `Docs/tienda/**` | Plan, contrato, línea base y herramientas |

## Lo que NO se toca nunca

`naty_schema.sql`, `app/src/data/**` (salvo lectura), `app/src/features/ventas|nota|inventario|usuarios|dashboard|comisiones`, el service worker compartido y la IndexedDB `modas-naty`.
