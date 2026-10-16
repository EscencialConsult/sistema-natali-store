# Línea base de producción (2026-10-15)

Proyecto `bulcbrgafrfklaejfyjd` · PostgreSQL 17 · São Paulo · 13 MB. Foto completa en `linea-base-ANTES.json`. Sin datos de personas.

| Tabla | Filas |
|---|---|
| naty_productos | 45 |
| naty_producto_fotos | 45 |
| naty_producto_colores | 0 |
| naty_categorias | 1 |
| naty_ventas | 48 |
| naty_venta_items | 154 |
| naty_movimientos_stock | 212 |
| naty_perfiles | 7 |
| naty_config | 8 |
| naty_limpiezas | 13 |
| proyectos | 1 |

- Funciones: 24 · políticas: 16 · triggers: 11 · bucket público `naty_productos` con 47 objetos.
- Claves de `naty_config`: logo, mostrar_precios_publico, negocio, stock_bajo_unidades, tipo_cambio, unidades_por_docena, url_catalogo, whatsapp_tienda.
- Tipo de cambio real cargado: 12 Bs y 1590 ARS por USD (no es de ejemplo).

## Lo que mostró el dry-run con datos reales
- La tienda vería **45 productos**, los mismos que `naty_catalogo_publico`.
- **Los precios salen ocultos**: `mostrar_precios_publico` está en falso. Natali debe decidir si los muestra.
- **`whatsapp_tienda` está vacío**: hay que cargarlo desde Ajustes.
- Ya hay un `logo` cargado en Ajustes: ver etapa E4b.
- Un anónimo no puede leer `naty_productos`, `naty_perfiles` ni `naty_movimientos_stock`, ni escribir en `tienda_config`.
