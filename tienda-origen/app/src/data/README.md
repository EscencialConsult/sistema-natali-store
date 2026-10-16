# Capa de datos — qué es real y qué es de prueba

Pieza 2 de la skill `kit-de-marca` (Mock Service Layer), adaptada: acá no hay carpeta `mock/` aparte porque la base local (Dexie) **es** parte del producto (carrito, caché del catálogo, cola del kiosco). Lo descartable es el **seed** y las implementaciones `local/` de lo que en producción vive en el servidor.

Las pantallas importan solo de `repos/index.js` y `hooks.js`. Nunca de `db.js`, nunca de Supabase.

## Mocks activos (actualizar al tocar esta capa)

| Repositorio | Hoy | Pantallas que lo usan | Qué lo reemplaza y cuándo |
|---|---|---|---|
| `productos`, `categorias`, `stock`, `perfiles`, `config` | `local/` + seed de 138 productos de otra marca (solo desarrollo) | catálogo, panel | `remoto/` leyendo las tablas `naty_*` compartidas (etapa 4.5). Los campos `precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug` del seed son **inventados** (bloqueo B-C1) |
| `carrito` | `local/` (siempre) | catálogo, carrito, checkout, kiosco | no se reemplaza: el carrito vive en el dispositivo |
| `pedidos` | `local/` (reserva, estados, vencimiento, historial) | checkout, pedido, kiosco, panel | `remoto/` que llama a `tienda_crear_pedido`, `tienda_confirmar_pago`, `tienda_cambiar_estado` (etapa 4.3 y 4.5). La tabla de transiciones de `lib/pedido.js` debe coincidir con la de la base (prueba en 4.4) |
| `pagos` | `local/` simulado (`?simular=aprobado`) | checkout, kiosco, panel | Netlify Functions + adaptador `proveedorPago` con Mercado Pago (cuenta argentina) y pago manual (etapa 5) |
| `gastos` | `local/` con categorías genéricas | panel | `remoto/` sobre `tienda_gastos` (etapa 4.5); categorías reales de Natali (B-G1) |
| `sitio` | `local/` en `config.sitio` con textos por defecto marcados `provisorio: true` | sitio, panel | `remoto/` sobre `tienda_config` (etapa 4.5); textos reales (B-S1, B-S2) |
| `kiosco` | `local/` con PIN fijo `2468` | kiosco, panel | Netlify Function `kiosco-activar` + `tienda_kiosco_dispositivos` (etapa 6.1) |

## Convenciones
- Campos en `snake_case` para que el mapeo a columnas SQL sea directo.
- Dinero en centavos enteros. Fechas de instante en ISO UTC; "días" como `AAAA-MM-DD` en America/La_Paz (`lib/fechas.js`).
- Toda escritura local que deba llegar al servidor pasa por `sync/cola.js` (`encolar`) dentro de la misma transacción.
- `sync/remoto.js` hoy solo sabe enviar y bajar el catálogo compartido; los pedidos, gastos y sitio se agregan en la etapa 4.
