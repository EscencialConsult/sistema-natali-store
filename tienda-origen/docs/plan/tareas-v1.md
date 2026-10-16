# Tablero — Versión 1 (Tienda Online Modas Naty)

Estado general: Etapas 0 y 1 autorizadas el 2026-10-09. Etapas 0 a 4 cerradas en código (notas en `notas-etapa-N.md`; pendientes de Facundo: 3.6 sesión con Natali y aplicar el esquema de la 4). Etapas 6 (salvo 6.6) y 7 cerradas. **Pendientes: 5 (pagos, necesita credenciales de Mercado Pago), 6.6 (equipo real), 8 y 9.** Reglas en [`_comun.md`](_comun.md). Detalle de cada etapa en `etapa-N.md`.

| Etapa | Nombre | Horas est. | Depende de | Estado |
|---|---|---|---|---|
| 0 | Fundaciones: poda del clon, kit de marca, rutas y repositorios nuevos | 10 | — | [x] (2026-10-09) |
| 1 | Sitio público: Inicio, Quiénes somos, Contacto, cabecera y pie | 12 | 0 | [x] (2026-10-09) |
| 2 | Catálogo de tienda: grilla, ficha, precio minorista, stock visible | 14 | 0 | [x] (2026-10-09) |
| 3 | Carrito y checkout (sin pasarela todavía) | 14 | 2 | [x] (2026-10-09) salvo 3.6 |
| 4 | Backend de la tienda: esquema `tienda_`, funciones, Netlify Functions base | 16 | 3 | [x] (2026-10-09) código; falta aplicar en la instancia (Facundo) |
| 5 | Pasarela de pago: adaptador, Mercado Pago con pagokit, pago manual | 16 | 4 · B-P1 | [ ] |
| 6 | Kiosco de autogestión y ticket térmico | 16 | 4 · B-K1 | [x] (2026-10-09) salvo 6.6 (equipo real) |
| 7 | Panel de administración | 20 | 4 | [x] (2026-10-09) |
| 8 | PWA, SEO, accesibilidad, animación y pulido | 12 | 1–7 | [ ] |
| 9 | Pruebas con la clienta, deploy, dominio, post-lanzamiento, migración, GitHub | 12 | 8 | [ ] |

Total estimado: **142 h**. Las etapas 5, 6 y 7 son independientes entre sí: si B-P1 o B-K1 siguen bloqueados, se adelanta la 7.

Hito A (tras etapa 3): la tienda se navega y se arma un pedido de punta a punta con datos locales → sesión de revisión con Natali.
Hito B (tras etapa 5): primer pago real de prueba.
Hito C (tras etapa 6): primer ticket impreso en el equipo real.
Hito D (tras etapa 9): tienda publicada en su dominio.

## Etapa 0 — Fundaciones ([etapa-0.md](etapa-0.md))
- [x] (2026-10-09) 0.1 Poda del clon: quitar nota de venta, comisiones, ventas de vendedores, dashboard viejo
- [x] (2026-10-09) 0.2 Kit de marca de la tienda: `DESIGN.md`, tokens, reglas nuevas (sitio, kiosco, ticket)
- [x] (2026-10-09) 0.3 Tres layouts y mapa de rutas (sitio, kiosco, panel) con pantallas vacías
- [x] (2026-10-09) 0.4 Repositorios nuevos con implementación local (pedidos, pagos, gastos, sitio, kiosco) y seed
- [x] (2026-10-09) 0.5 Fechas en America/La_Paz y moneda Bs por defecto
- [x] (2026-10-09) 0.6 Documentación de contexto para IA (`app/CLAUDE.md`) y entorno

## Etapa 1 — Sitio público ([etapa-1.md](etapa-1.md))
- [x] (2026-10-09) 1.1 Cabecera, menú, carrito con contador y pie del sitio
- [x] (2026-10-09) 1.2 Inicio
- [x] (2026-10-09) 1.3 Quiénes somos y Contacto
- [x] (2026-10-09) 1.4 Páginas legales y 404 del sitio
- [x] (2026-10-09) 1.5 Textos del sitio editables (config) con contenido provisorio marcado

## Etapa 2 — Catálogo de tienda ([etapa-2.md](etapa-2.md))
- [x] (2026-10-09) 2.1 Precio minorista, publicación y slug en el modelo de producto
- [x] (2026-10-09) 2.2 Grilla pública con categorías, orden y buscador
- [x] (2026-10-09) 2.3 Ficha de producto de tienda (`/p/:slug`) con selector de color y cantidad
- [x] (2026-10-09) 2.4 Stock disponible visible y "Sin stock"
- [x] (2026-10-09) 2.5 Compartir y consultar por WhatsApp

## Etapa 3 — Carrito y checkout ([etapa-3.md](etapa-3.md))
- [x] (2026-10-09) 3.1 Carrito persistente (`useCarrito` de tienda)
- [x] (2026-10-09) 3.2 Página del carrito y mini carrito
- [x] (2026-10-09) 3.3 Checkout: datos, entrega, resumen, validación
- [x] (2026-10-09) 3.4 Creación del pedido (local) y página `/pedido/:codigo`
- [x] (2026-10-09) 3.5 Seguimiento por código + teléfono
- [!] 3.6 Revisión con Natali (Hito A) — pendiente de Facundo: deploy de prueba y sesión

## Etapa 4 — Backend de la tienda ([etapa-4.md](etapa-4.md))
- [x] (2026-10-09) 4.1 Campos nuevos en `naty_productos` y vista `tienda_catalogo_publico`
- [x] (2026-10-09) 4.2 Esquema `tienda_` (pedidos, ítems, historial, pagos, webhooks, gastos, kiosco, config)
- [x] (2026-10-09) 4.3 Funciones: crear pedido con reserva, confirmar pago, cambiar estado, cancelar, vencer reservas
- [x] (2026-10-09) 4.4 RLS y privilegios por rol; pruebas del esquema con PGlite
- [x] (2026-10-09) 4.5 Repositorios remotos y reemplazo de la implementación local
- [x] (2026-10-09) 4.6 Netlify Functions base (estructura, validación de JWT, `service_role`, `netlify dev`)

## Etapa 5 — Pasarela de pago ([etapa-5.md](etapa-5.md))
- [ ] 5.1 Decisión B-P1 y adaptador `proveedorPago`
- [~] 5.2 Mercado Pago con `pagokit`: generación y adaptación a Netlify Functions · Functions checkout, webhook y reembolso escritas sin SDK; falta probar con credenciales reales
- [~] 5.3 Webhook firmado, idempotente, con confirmación del pedido · firma, dedup y monto probados con eventos sintéticos (11 pruebas); falta contra la API real
- [~] 5.4 Pantallas: botón pagar, resultado, reintento, errores en español · botón conectado a la Function
- [ ] 5.5 Pago manual (transferencia con comprobante) y "Pagos por confirmar"
- [~] 5.6 Reembolso desde el panel y checklist de producción (Hito B) · Function de reembolso lista, falta el botón del panel

## Etapa 6 — Kiosco y ticket ([etapa-6.md](etapa-6.md))
- [x] (2026-10-09) 6.1 Activación del dispositivo por PIN y sesión de dispositivo
- [x] (2026-10-09) 6.2 Flujo táctil: bienvenida, catálogo, ficha, carrito, confirmar
- [x] (2026-10-09) 6.3 Inactividad, pantalla completa, acceso de encargada
- [x] (2026-10-09) 6.4 Pago en kiosco: QR en pantalla y pago en caja
- [x] (2026-10-09) 6.5 Ticket térmico: componente, CSS 80 mm, impresión silenciosa
- [!] 6.6 Red intermitente y pruebas en el equipo real (Hito C) — bloqueada por B-K1

## Etapa 7 — Panel de administración ([etapa-7.md](etapa-7.md))
- [x] (2026-10-09) 7.1 Login en `/administracion`, roles y navegación del panel
- [x] (2026-10-09) 7.2 Inicio del panel (cifras del día y del mes)
- [x] (2026-10-09) 7.3 Productos y categorías (adaptación del admin heredado + campos de tienda)
- [x] (2026-10-09) 7.4 Stock (heredado) con reservas visibles
- [x] (2026-10-09) 7.5 Pedidos: lista, detalle, estados, pago en caja, cancelar, reimprimir, WhatsApp
- [x] (2026-10-09) 7.6 Gastos y categorías de gasto
- [x] (2026-10-09) 7.7 Reportes y exportación a Excel
- [x] (2026-10-09) 7.8 Configuración (tienda, sitio, envíos, pasarela, kiosco) y usuarios internos

## Etapa 8 — Pulido ([etapa-8.md](etapa-8.md))
- [x] 8.1 PWA (kiosco y panel instalables, caché de catálogo)
- [x] 8.2 SEO: metadatos, Open Graph, sitemap, robots, URL
- [x] 8.3 Accesibilidad AA en las tres zonas
- [x] 8.4 Animaciones con propósito
- [~] 8.5 Auditoría `reglas-de-pagina` y `anti-ia`; rendimiento (Lighthouse)

## Etapa 9 — Salida ([etapa-9.md](etapa-9.md))
- [ ] 9.1 Guion de prueba por rol y sesión con Natali
- [ ] 9.2 Correcciones
- [ ] 9.3 GitHub, Netlify (sitio + functions + variables), dominio
- [ ] 9.4 Checklist post-lanzamiento (Search Console, Analytics, Clarity)
- [ ] 9.5 Migración a la cuenta de la clienta (junto con el sistema de nota) y limpieza

## Plan de actualización y concordancia con el sistema de nota ([PLAN-actualizacion-concordancia.md](PLAN-actualizacion-concordancia.md))
Creado el 12/10/2026. Cada etapa necesita autorización explícita.
- [ ] U0 Decisiones y acuerdo con el otro equipo
- [x] U1 Esquema de la tienda independiente (12/10)
- [~] U5 parcial: esquema aplicado en la instancia compartida (12/10), falta cargar datos reales y probar compra
- [~] U2 Stock por producto o por color (12/10: hecha salvo U2.9, producto sin color en el carrito)
- [ ] U3 Identidad y configuración compartidas
- [ ] U4 Integridad y reportes entre los dos sistemas
- [ ] U5 Una sola base y migración conjunta
- [ ] U6 Verificación cruzada y cierre
