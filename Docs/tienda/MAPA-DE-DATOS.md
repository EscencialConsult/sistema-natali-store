# Mapa de datos de la tienda

Qué dato existe, dónde vive, quién lo puede escribir y quién lo puede ver. Sirve para responder "¿esto se filtra?" sin leer el código.

## Quién ve qué

| Dato | Dónde vive | Lo ve el público (sin sesión) | Lo escribe |
|---|---|---|---|
| Modelos, categorías, fotos, descripción | `naty_productos`, `naty_categorias`, bucket de fotos (de Renzo) | Sí, por la vista `tienda_catalogo_publico` (solo activos, con foto y no ocultos) | Renzo / equipo, desde el sistema |
| Precio por docena (USD) | `naty_productos` | Solo si "Mostrar precios" está activo en Ajustes | Equipo |
| Cotización (pesos, bolivianos, fecha) | `naty_config.tipo_cambio` | Sí, por `tienda_ajustes_publicos` (con su fecha) | Administración, en Ajustes |
| Nombre del negocio, WhatsApp de la tienda | `naty_config` | Sí | Administración |
| Cuenta de transferencia (titular, CUIT, CBU, alias, banco, moneda, fecha de cambio) | `tienda_config.transferencia` | **Sí**, a propósito: la clienta la ve al pagar | Solo administración, desde el Gestor web |
| Vendedores y teléfonos | `tienda_config.contactos` | **Sí**, a propósito | Administración |
| Locales, horarios, textos | `tienda_config.locales / horarios / como_comprar / quienes_somos` | Sí | Administración |
| Modelos ocultos | `tienda_oculto` | No (solo el efecto: el modelo no aparece) | Administración |
| Pedido armado | `localStorage` del navegador de la clienta y mensaje de WhatsApp | Es suyo | La clienta |
| Copia de configuración y ajustes | `localStorage`, claves `tienda-v1:*` | Es de cada navegador | La tienda (vence: config 1 h, ajustes 6 h) |

## Lo que la tienda nunca toca

- Ninguna tabla `naty_*` en escritura. Solo lee `naty_productos`, `naty_categorias`, `naty_config` (algunas claves) y las fotos.
- La base local (Dexie) y el service worker del sistema de Renzo.
- Ventas, clientes, stock, usuarios y comisiones. No hay ninguna consulta de la tienda sobre esas tablas.

## Dónde se escribe

| Quién | Qué | Por dónde |
|---|---|---|
| Admin o superadmin | `tienda_config` y `tienda_oculto` | Gestor web (Ajustes), con la sesión de la persona |
| Facundo | Carga inicial de `tienda_config` | `app/scripts/cargar-config-tienda.mjs` (simulacro por defecto, archivo fuera del repo) |
| Facundo | Esquema `tienda_*` | `app/scripts/aplicar-tienda.mjs` (simulacro y vuelta atrás automáticos) |

## Lo que sale de la máquina de Facundo y queda en otro lado

- Respaldos con datos personales: `C:\respaldos\` (sin cifrar, fuera del repo).
- Credenciales: `~\.claude\secretos\` (fuera del repo).
- Notas: `cerebro-facundo` (repositorio propio, ver la auditoría).
