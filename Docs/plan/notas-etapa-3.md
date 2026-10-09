# Notas de cierre — Etapa 3: Catálogo (2026-10-08)

Verificación: `oxlint` sin avisos · build OK · 30 tests pasando · recorrido manual (buscador, ficha, alta con foto y color, validaciones, vista pública).

## Rutas nuevas
| Ruta | Quién | Qué |
|---|---|---|
| `/catalogo` | quien tenga `catalogo.ver` | Buscador por código + grilla con categorías |
| `/catalogo/admin` | `catalogo.editar` (admin, enc. depósito) | Listado de productos (activos / dados de baja) |
| `/catalogo/admin/nuevo`, `/catalogo/admin/:id` | `catalogo.editar` | Alta y edición |
| `/catalogo/admin/importar` | `catalogo.editar` | Carga masiva (Excel + fotos en lote) |
| `/c` | público, sin login | Catálogo para clientas |

## Decisiones de diseño
- **Mejor coincidencia inline**: al escribir "mn5" la ficha de MN-005 aparece directo en la pantalla (foto, colores con stock, precio, "Agregar a venta"), sin tocar nada más; los parecidos quedan abajo. Del foco a ver el modelo: 1 acción (escribir).
- **Precio**: por docena en US$, con equivalente en Bs y ARS (tipo de cambio de Ajustes). En la vista pública solo si `mostrar_precios_publico` está activo (hoy apagado).
- **Fotos**: se comprimen en el navegador al subirlas (probado: 2000×1500 PNG de 84 KB → 900×675 JPEG de 11 KB) y se guardan como blob local. En la etapa 8 pasan a Supabase Storage.
- **Baja lógica**: "dar de baja" no borra; el producto deja de verse y vender, pero las notas anteriores se conservan.
- **Colores** con orden estable (campo `orden`); stock inicial solo al crear un color nuevo, después se mueve desde Inventario.
- **Carga masiva**: Excel `.xlsx` con columnas `codigo, nombre, categoria, precio_docena_usd, colores`; vista previa con errores por fila antes de confirmar; si el código existe se actualiza (colores existentes se conservan), si no se crea. Fotos en lote por nombre de archivo (`MN-005_1.jpg`). Importar los 138 del seed dos veces no duplica (test).
- `xlsx` reemplazado por `exceljs` (0 vulnerabilidades); se carga solo al usar la carga masiva (bloque aparte de ~930 KB).

## Pendiente / a tener en cuenta
- **La vista pública `/c` hoy lee la base del propio dispositivo** (no hay servidor todavía): sirve para probar el diseño, pero una clienta que abra el QR vería el catálogo de ejemplo, no el real. Se resuelve en la etapa 8 con la vista `catalogo_publico` de Supabase.
- **Falta la pantalla de Ajustes** (hoy un aviso): ahí se configuran `whatsapp_tienda`, `mostrar_precios_publico`, tipos de cambio, URL del catálogo, teléfonos del pie y logo. La nota A5 (etapa 4.4) los necesita → la hago al inicio de la etapa 4.
- Las fotos de la biblioteca provisional traen texto "Precio Doc.: … Bs" dentro de la imagen (vienen así del sitio de referencia): solo sirven como prueba.
- El producto `MN-139 Prueba Vestido de Lino` quedó solo en la base del navegador de prueba (no está en el seed).
- Bloqueos abiertos: B1 comisión, B2 logo, B3 teléfonos, B4 URL del QR, B5 tipo de cambio, B6 permisos, B7 formato de carga masiva de Natali (hoy supongo Excel + fotos por código).
