# Biblioteca provisional de productos

Datos de **prueba** para armar el frontend con productos reales en vez de imágenes vacías. **No son productos de Natali**: salen del sitio de referencia (Divas House) y se reemplazan por los de la clienta cuando los cargue.

- `productos.json` — 138 productos: `codigo` (MN-001…, inventado), `slug`, `nombre`, `categoria` (inferida por el nombre, revisar), `precio_bs_docena` (precio de Divas House, en Bs), `descripcion`, `imagen` (ruta local), `imagen_origen` (URL original), `colores: []`.
- `imagenes/` — 138 fotos (JPG, 900px, ~18 MB en total).

## Limitaciones conocidas
- **Colores vacíos**: en la referencia los colores solo están dentro de la imagen, no como dato. En el seed del frontend se asignan colores de ejemplo (ver tarea 0.4).
- Categorías inferidas con reglas simples; 3 quedaron en `VARIOS`.
- Precios en Bs por docena; el ERP necesita USD → depende del tipo de cambio (tarea 4.1).
- Derechos de las fotos: son de otra marca. Uso solo para desarrollo/demo interna; no publicar.
- Generado 2026-10-08 con un script puntual (lee el JSON-LD de cada ficha del sitio).
