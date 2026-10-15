# Arquitectura

## Stack (mismo que el sistema de nota, más pagos y serverless)
| Capa | Elección | Por qué |
|---|---|---|
| UI | React 19 + Vite (JSX) | stack habitual; clonado del sistema de nota |
| Estilos | Tailwind v4 con tokens en `src/styles/tokens.css` + `DESIGN.md` (skill `kit-de-marca`) | un solo lugar para colores, tipografía y radios |
| Iconos | lucide-react (skill `lucide-icons`) | |
| Animación | skills `animate` / `animation-vocabulary` | solo con propósito, respeta reduced-motion |
| Routing | react-router v7 | |
| Datos locales | Dexie (IndexedDB) | carrito persistente, catálogo cacheado, cola del kiosco |
| Backend | Supabase (Postgres + Auth + Storage + RLS) | ya probado en el sistema de nota |
| Serverless | **Netlify Functions** (Node) | el deploy ya es Netlify; los webhooks necesitan un servidor con `service_role`; las plantillas de `pagokit` (Express) se adaptan directo (decisión D2) |
| Pagos | Mercado Pago vía skill `pagokit` (Checkout Pro) detrás de un adaptador | ver `05-pagos.md` |
| Impresión | CSS `@page` 80 mm + `window.print` en Chrome kiosco; plan B agente ESC/POS local | ver `06-kiosco-e-impresion.md` |
| PWA | vite-plugin-pwa | kiosco y panel instalables; catálogo con caché |
| Validación | zod (cliente y Netlify Functions) | |
| Excel | exceljs (carga masiva, exportar reportes) | ya existe |
| Pruebas | Vitest + fake-indexeddb + PGlite (esquema) | ya existe |

## Principio rector: pantallas → repositorios → base
Igual que en el sistema de nota: ninguna pantalla importa Supabase ni Dexie directo. Habla con `src/data/repos/*`. Se suman repositorios nuevos (`pedidos`, `pagos`, `gastos`, `sitio`, `kiosco`) con la misma interfaz fija. Mientras no exista el backend de la tienda (etapas 1 a 3) los repositorios nuevos usan Dexie + seed (Mock Service Layer de la skill `kit-de-marca`); en la etapa 4 se cambia la implementación, no las pantallas.

```
UI (features/*)
   ↓ hooks (useProductos, useCarrito, usePedido…)
Repositorios (src/data/repos)  ← interfaz fija
   ├─ local (Dexie)        ← carrito, caché de catálogo, cola kiosco, seed en desarrollo
   └─ remoto (Supabase)    ← catálogo, pedidos, pagos, gastos, config
Netlify Functions (netlify/functions/*)  ← checkout, webhook, reembolso (service_role)
```

## Estructura de carpetas (objetivo tras la Etapa 0)
```
app/
  src/
    app/            router (AppRoutes), layouts: LayoutSitio, LayoutPanel, LayoutKiosco; providers
    features/
      sitio/        Inicio, QuienesSomos, Contacto, Legales, cabecera y pie del sitio
      catalogo/     (heredado) grilla, ficha, buscador, admin de productos, carga masiva
      carrito/      useCarrito, CarritoPage, MiniCarrito
      checkout/     CheckoutPage, PedidoPage (resultado y seguimiento)
      kiosco/       Bienvenida, flujo táctil, Ticket, activación por PIN
      panel/        inicio, pedidos, gastos, reportes, configuracion, usuarios
      inventario/   (heredado) movimientos e importación de stock
      auth/         (heredado, solo panel) login, RutaProtegida
    data/           db.js (Dexie), repos/, seed/, sync/ (cola del kiosco), supabase.js
    components/     ui/ (Button, Input, Select, BuscadorLista, Modal, Sheet, Badge, Chip, EmptyState, ErrorState, Skeleton, Tabs, Toast)
    lib/            moneda.js · fechas.js (America/La_Paz) · codigo.js · permisos.js · imagen.js · stock.js · pedido.js
    styles/         tokens.css · fuentes.css · impresion-ticket.css
  netlify/functions/   checkout.js · webhook-mercadopago.js · reembolso.js · (opcional) notificar.js
  supabase/            tienda_schema.sql · README.md
  DESIGN.md
```

Lo que se **elimina** en la Etapa 0 (viene del clon): `features/nota/`, `features/comisiones/`, `features/ventas/` (salvo `exportarVentas.js` y `calculos.js` que se mueven a `lib/`), `features/dashboard/` (se reescribe como `panel/inicio`), `AuthProviderRemoto` queda solo para el panel, seed de perfiles de vendedores, `Muestra.jsx`.

## Rutas
| Ruta | Sistema | Acceso |
|---|---|---|
| `/` | Sitio: Inicio | público |
| `/quienes-somos`, `/contacto`, `/legales/:slug` | Sitio | público |
| `/catalogo`, `/catalogo/:categoria`, `/p/:slug` | Catálogo | público |
| `/carrito`, `/checkout`, `/pedido/:codigo`, `/seguimiento` | Carrito y checkout | público |
| `/kiosco` (+ `/kiosco/activar`) | Kiosco | dispositivo activado con PIN |
| `/administracion` | Panel: login (la raíz del panel **es** el login, pieza 3 de `kit-de-marca`) | público (formulario) |
| `/administracion/inicio`, `/productos`, `/pedidos`, `/stock`, `/gastos`, `/reportes`, `/configuracion`, `/usuarios` | Panel | rol interno |

Diferencia con el sistema de nota: allá la raíz era el login porque no había home pública. Acá la raíz es la tienda; el login vive en `/administracion`, que es lo que pidió Facundo ("página web / ingreso administración").

## Modelo de datos

### Compartido con el sistema de nota (prefijo `naty_`, decisión D4)
`naty_categorias`, `naty_productos`, `naty_producto_colores`, `naty_producto_fotos`, `naty_movimientos_stock`, `naty_perfiles` (solo roles admin / enc_tienda / enc_deposito), `naty_config`.

Cambios mínimos a `naty_productos` (se agregan al final de `naty_schema.sql`, idempotentes): `precio_unidad_bs_cent integer`, `destacado boolean`, `slug text unique`, `publicado_tienda boolean default false`. Natali decide qué productos se ven en la tienda y a qué precio minorista.

### Propio de la tienda (prefijo `tienda_`)
- `tienda_pedidos` (id uuid, codigo `TN-000001`, origen: web | kiosco, estado, comprador_nombre, comprador_telefono, comprador_correo, entrega: retiro | envio, envio_ciudad, envio_direccion, envio_costo_cent, nota, moneda `bs`, subtotal_cent, total_cent, reserva_vence_en, pagado_en, creado_en, updated_at, dispositivo_kiosco_id?)
- `tienda_pedido_items` (id, pedido_id, producto_id, color_id, codigo, nombre, color_nombre, cantidad, precio_cent, subtotal_cent) — copia de datos al momento, como `naty_venta_items`
- `tienda_pedido_historial` (id, pedido_id, de_estado, a_estado, usuario_id?, motivo, creado_en)
- `tienda_pagos` (id, pedido_id, proveedor: mercadopago | caja | transferencia, proveedor_id externo, estado: pendiente | aprobado | rechazado | reembolsado, monto_cent, moneda, idempotency_key, datos jsonb sin datos sensibles, creado_en, updated_en)
- `tienda_webhook_eventos` (id externo, proveedor, tipo, recibido_en, procesado_en, resultado) — idempotencia (candado 4 de pagokit)
- `tienda_gasto_categorias` (id, nombre, orden)
- `tienda_gastos` (id, categoria_id, fecha, monto_cent, descripcion, comprobante_ruta, usuario_id, creado_en)
- `tienda_kiosco_dispositivos` (id, nombre, pin_hash, activado_en, ultimo_uso, activo)
- `tienda_config` (clave, valor jsonb): textos del sitio, envíos por ciudad, mínimo de compra, mostrar USD, tipo de cambio, pasarela (solo flags públicos), kiosco
- Vistas para `anon`: `tienda_catalogo_publico` (productos publicados con stock disponible por color, sin costos), `tienda_pedido_publico(codigo, telefono)` como función que devuelve estado e ítems

### Funciones (`SECURITY DEFINER`)
- `tienda_crear_pedido(p jsonb)` → valida stock, crea pedido + ítems, **reserva** stock (movimiento tipo `reserva` con vencimiento), devuelve código.
- `tienda_confirmar_pago(p jsonb)` → la llama el webhook (service_role) o la encargada (pago en caja): pasa a `pagado`, convierte reserva en venta.
- `tienda_cambiar_estado(p jsonb)` → con historial.
- `tienda_cancelar_pedido`, `tienda_reembolsar_pedido` → liberan stock.
- `tienda_vencer_reservas()` → cron de Supabase (pg_cron) o llamada desde una Function programada: libera reservas vencidas.
- `tienda_activar_kiosco(pin)`.

### Estados del pedido
```
borrador (solo en el dispositivo)
  → pendiente_pago ──(webhook aprobado / pago en caja)──→ pagado → en_preparacion → listo_retiro | enviado → entregado
        │                                                   │
        └──(vence reserva / rechazado / cancela)──→ cancelado   └──(admin)──→ reembolsado
```
Dinero siempre en **centavos enteros**; cada pedido en una sola moneda: `ars` si paga con Mercado Pago, `bs` si paga en caja o por transferencia. El precio de lista se guarda en Bs y se convierte a ARS con el tipo de cambio de `tienda_config` al crear el pedido (el pedido copia el tipo de cambio usado).

## Zona horaria: America/La_Paz (decisión D5)
- Bolivia: UTC−4 todo el año, sin horario de verano.
- Base: columnas `timestamptz`. Reportes "por día" agrupan con `(creado_en at time zone 'America/La_Paz')::date`.
- App: `lib/fechas.js` se reescribe con `timeZone: 'America/La_Paz'` en todos los `Intl.DateTimeFormat`; `inicioDelDia`/`finDelDia` se calculan en esa zona, no en la del dispositivo (Facundo trabaja desde Argentina, UTC−3: sin esto "hoy" se corre una hora).
- Netlify Functions: `TZ=America/La_Paz` en variables de entorno + formateo explícito.
- Ticket del kiosco: fecha y hora en La Paz.

## Decisiones registradas
| # | Decisión | Estado |
|---|---|---|
| D1 | Pasarela: Mercado Pago generada con `pagokit`, detrás de un adaptador `proveedorPago` para poder sumar otro medio sin tocar pantallas | tomada; B-P1 resuelto: cuenta argentina, cobro en ARS |
| D2 | Serverless: Netlify Functions (Node) y no Supabase Edge Functions (Deno) | tomada (2026-10-09) |
| D3 | Kit de marca: tokens actuales del sistema de nota (editorial, tinta casi negra). Si el rediseño "de tienda" (crema + ciruela, `referencias/rediseno-tienda-PLAN.md`) se aplica allá, se replica acá cambiando solo `tokens.css` | tomada: tokens actuales (2026-10-09) |
| D4 | Catálogo **compartido** con el sistema de nota (mismas tablas `naty_*`, campos nuevos para precio minorista y publicación) en vez de copia independiente | tomada (2026-10-09) |
| D5 | Zona horaria explícita America/La_Paz en base, app y functions | tomada |
| D6 | Compra como invitada; sin cuentas de usuarias en v1 | tomada (pedido de Facundo) |
| D7 | Login del panel en `/administracion`; la raíz es la tienda | tomada |
| D8 | Impresión por `window.print` + Chrome kiosco con `--kiosk-printing`; agente ESC/POS solo si el equipo no lo permite | propuesta |
| D9 | Instancia Supabase compartida provisoria, igual que el sistema de nota; migración al cierre | tomada (misma regla) |

## Estrategia de migración a la cuenta de la clienta
Idéntica a la del sistema de nota (`../SISTEMA DE NOTA/app/supabase/README.md`): un archivo SQL idempotente por sistema, datos por `pg_dump --data-only`, Storage copiado, `.env` nuevo, variables de Netlify nuevas (incluidas las de la pasarela), limpieza del proyecto compartido. Como los dos sistemas comparten catálogo, **se migran juntos**.
