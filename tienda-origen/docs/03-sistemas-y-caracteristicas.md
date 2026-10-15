# Sistemas y características

La plataforma son **7 sistemas** que comparten un mismo código (una sola app React) y una misma base. Cada uno tiene su etapa en el plan.

```
                    ┌──────────────────────────────┐
                    │   SITIO PÚBLICO (S1)          │  /  /quienes-somos  /contacto
                    │   CATÁLOGO (S2)               │  /catalogo  /p/:codigo
                    │   CARRITO + CHECKOUT (S3)     │  /carrito  /checkout  /pedido/:codigo
                    └──────────────┬───────────────┘
                                   │ repositorios (src/data/repos)
   KIOSCO (S5) /kiosco ────────────┤
   PANEL (S6) /administracion ─────┤
                                   ▼
            ┌───────────────────────────────────────────┐
            │  BACKEND (S7): Supabase (Postgres, Auth,   │
            │  Storage, RLS, funciones) + Netlify        │
            │  Functions (checkout, webhook, reembolso)  │
            └───────────────┬───────────────────────────┘
                            │
                   PASARELA DE PAGO (S4): Mercado Pago (pagokit)
```

## S1 · Sitio público
| Característica | Detalle |
|---|---|
| Inicio | Portada con foto grande, categorías, "Nuevos ingresos" (productos marcados `nuevo`), destacados elegidos en el panel, cómo comprar en 3 pasos, bloque de local (dirección, horarios, mapa), WhatsApp flotante |
| Quiénes somos | Texto e imágenes editables desde el panel; redes; contacto |
| Contacto | Teléfono, WhatsApp con mensaje prearmado, dirección, horarios; sin formulario (evita spam y backend de correo) salvo que Natali lo pida |
| Cabecera y pie | Logo centrado en celular (referencia Divas House), menú, carrito con contador; pie oscuro con contacto, redes y legales |
| Legales | Términos de compra, política de envíos y cambios, privacidad. Textos base a redactar con Natali |
| SEO | Títulos y descripciones por página, Open Graph con foto del producto, `sitemap.xml`, `robots.txt`, URL legibles (`/p/blusa-satin-mn-012`) |
| Idioma y formato | Español (Bolivia), `Bs 120,00`, fechas `dd/mm/aaaa` en America/La_Paz |

## S2 · Catálogo (hereda del sistema de nota)
| Característica | Detalle |
|---|---|
| Grilla | 2 columnas en celular, 4 en escritorio; tarjeta con foto 3:4, etiqueta "Nuevo", "Sin stock", nombre, precio |
| Categorías | Chips horizontales en celular, lateral en escritorio; orden editable en el panel |
| Buscador | Por nombre o código, en vivo, sin importar mayúsculas ni guiones (reutiliza `lib/codigo.js`) |
| Orden | Novedad, precio menor a mayor, mayor a menor, nombre |
| Ficha | Galería deslizable con zoom, descripción, colores como chips con muestra y stock, selector de cantidad, precio, botón "Agregar al carrito", "Consultar por WhatsApp" |
| Precio | Precio **minorista por unidad en Bs** (nuevo campo; el sistema de nota usa precio por docena en USD). Opción de mostrar equivalente en USD |
| Stock | Suma de movimientos (misma regla que el sistema de nota) menos reservas de pedidos vigentes |
| Fotos | Supabase Storage, comprimidas en el navegador al cargar; miniaturas con carga diferida; caché PWA |
| Compartir | Botón compartir (Web Share API) con la URL del producto |

## S3 · Carrito y checkout
| Característica | Detalle |
|---|---|
| Carrito | Guardado en el dispositivo (IndexedDB vía Dexie); ítems por producto + color; cantidades; subtotal; vacío con llamado a ver catálogo |
| Validación de stock | Antes de pagar se consulta stock real; si falta, se avisa y se ajusta |
| Checkout | Un solo paso largo en celular (datos, entrega, resumen) con validación zod; sin crear cuenta |
| Entrega | Retiro en tienda (gratis) o envío (ciudad y costo configurados en el panel); nota para el pedido |
| Pedido | Se crea en el servidor con código legible (`TN-000123`), reserva de stock con vencimiento (ej. 30 min si no se paga) |
| Pago | Botón "Pagar" lleva a la pasarela (S4). Alternativa configurable: "Coordinar pago por WhatsApp" (pedido pendiente) |
| Resultado | `/pedido/:codigo` muestra estado real; reintentar pago si fue rechazado |
| Seguimiento | Consulta por código + teléfono |

## S4 · Pasarela de pago
Ver `05-pagos.md`. Resumen: adaptador `proveedorPago` con implementación Mercado Pago generada con la skill `pagokit` (Checkout Pro, pago único), Netlify Functions para crear la preferencia y recibir el webhook firmado, reembolso desde el panel, tabla de eventos procesados (idempotencia), modo prueba y producción. **Bloqueo B-P1**: Mercado Pago no opera en Bolivia; hay que decidir cuenta y país.

## S5 · Kiosco de autogestión
Ver `06-kiosco-e-impresion.md`. Resumen: ruta `/kiosco` a pantalla completa activada con PIN, flujo táctil (bienvenida, catálogo, carrito, confirmar, pagar con QR o en caja, ticket), reinicio por inactividad, ticket térmico 80 mm por `window.print` con CSS de impresión y Chrome en modo kiosco (plan B: agente local ESC/POS), reimpresión desde el panel, funcionamiento con red intermitente.

## S6 · Panel de administración (`/administracion`)
| Módulo | Características |
|---|---|
| Acceso | Login con correo y contraseña (Supabase Auth); solo perfiles internos activos; cierre de sesión; recuperación de contraseña |
| Inicio | Ventas de hoy y del mes (Bs), pedidos por estado, pagos en caja pendientes, stock bajo, gastos del mes, margen del mes; accesos rápidos |
| Productos | Listado con buscador y filtros (categoría, activo, sin stock), alta/edición (código, nombre, categoría, descripción, precio minorista, precio USD opcional, nuevo, destacado, activo), fotos (orden, borrar, comprimir), colores (nombre, muestra, stock), baja lógica, carga masiva Excel + fotos |
| Categorías | Alta, orden, renombrar |
| Stock | Movimientos por producto y color (entrada, salida, ajuste, venta, reserva), historial, importar desde Excel, alerta de stock bajo configurable |
| Pedidos | Lista con filtros (estado, origen, medio de pago, fecha), detalle, cambio de estado con historial, confirmar pago en caja, cancelar (libera stock), reembolsar (llama a la pasarela), imprimir ticket/comprobante, contactar por WhatsApp con mensaje prearmado |
| Gastos | Categorías de gasto, alta con fecha, monto, descripción, comprobante (foto), edición y baja; listado por mes |
| Reportes | Por período: ventas por día, por categoría, por medio de pago, por origen; gastos por categoría; ingresos − gastos; productos más vendidos; exportar a Excel (reutiliza `exportarVentas.js`) |
| Configuración | Datos de la tienda, logo, textos del sitio (Inicio, Quiénes somos, legales), envíos por ciudad, mínimo de compra, moneda y tipo de cambio, mostrar USD, pasarela (estado, modo), kiosco (PIN, inactividad, texto del ticket, dispositivos) |
| Usuarios internos | Alta con correo y rol, activar/desactivar, cambio de rol |
| Auditoría mínima | Quién cambió el estado de un pedido y cuándo; quién cargó un gasto |

## S7 · Backend
| Pieza | Detalle |
|---|---|
| Base | Supabase (instancia compartida "Automatizaciones", provisoria; migra a la cuenta de la clienta al cierre), prefijo `tienda_` para lo nuevo; catálogo compartido con `naty_*` (decisión D4) |
| Seguridad | Mismo modo que el sistema de nota: `anon` solo lee vistas públicas (catálogo, estado de pedido por código+teléfono); escrituras delicadas por funciones `SECURITY DEFINER`; RLS por rol para el panel |
| Serverless | Netlify Functions (Node) para: crear preferencia de pago, webhook de la pasarela, reembolso, (opcional) notificación por correo/WhatsApp. Usan `service_role` solo ahí, nunca en el navegador |
| Esquema | Un solo archivo idempotente `tienda_schema.sql` (regla de `SUPABASE-REGLAS.md`), pruebas con PGlite en memoria |
| Zona horaria | Todo `timestamptz`; agrupaciones por día en SQL con `at time zone 'America/La_Paz'`; en la app `Intl` con `timeZone: 'America/La_Paz'` |
| Observabilidad | Tabla `tienda_webhook_eventos` con lo recibido (id, tipo, estado), errores en logs de Netlify; sin datos de tarjeta nunca (la pasarela los maneja) |
