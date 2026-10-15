# Etapa 0 — Fundaciones (10 h)
Estado: [x] cerrada el 2026-10-09 (autorizada junto con la Etapa 1). Notas: `notas-etapa-0.md`. Decisiones tomadas: D2 Netlify Functions, D3 tokens actuales, D4 catálogo compartido, GitHub `EscencialConsult/tienda-natali-online` (subido).
Leer: `_comun.md`, `../04-arquitectura.md` (estructura de carpetas, rutas, decisiones D3, D4, D5, D7).
Principio: **terminar la etapa con una app que compila, no muestra nada del sistema de nota y tiene las tres zonas (sitio, kiosco, panel) navegables aunque vacías.**

Requiere antes de arrancar: respuesta de Facundo a D2, D3 y D4 (`../07-preguntas-abiertas-y-bloqueos.md`). Si no hay respuesta, se asumen las recomendadas y se anota.

### Tarea 0.1 · Poda del clon · 2 h
Estado: [x] (2026-10-09)
**Objetivo**: que no quede código de nota de venta, comisiones ni vendedores, sin romper lo que se reutiliza.
**Archivos**: borrar `src/features/nota/`, `src/features/comisiones/`, `src/features/dashboard/`, `src/features/ventas/` (mover antes `calculos.js`, `exportarVentas.js` y sus tests a `src/lib/`), `src/app/Muestra.jsx`, `src/data/seed/perfiles.js` (se reescribe con roles de tienda), `app_backup` si quedó; limpiar `AppRoutes.jsx`, `navegacion.js`, `permisos.js`, `vite.config.js` (manifest, `globIgnores`), `index.html` (título).
**Alcance**: inventario de lo que se borra y lo que se conserva (tabla en `notas-etapa-0.md`); build y tests verdes después de borrar; `permisos.js` con la matriz de `../02-roles-y-casos-de-uso.md` sobre los roles existentes de la base compartida (D4).
**Pasos**
- [x] (2026-10-09) 1. Borrar `src/features/{nota,comisiones,dashboard,ventas}/`, `src/data/demo/`, `src/features/ajustes/DatosDemo.jsx`, `src/data/repos/local/ventas.js`, `src/data/remoto/` (tests del esquema `naty_` y servidor de prueba), `src/app/Muestra.jsx`, restos de Vite (`src/App.jsx`, `App.css`, `assets/`), `supabase/{naty_schema.sql,usuarios.ejemplo.sql}`, `scripts/{aplicar-schema,verificar-schema,crear-usuarios,cargar-catalogo-demo}.mjs`. Antes, mover `features/dashboard/DescargaOffline.jsx` → `features/catalogo/` y `features/ventas/exportarVentas.js` (+ test) → `src/lib/exportarExcel.js` si no depende de ventas. Verificación: `git status` muestra solo borrados y movimientos esperados.
- [x] (2026-10-09) 2. `src/data/db.js`: renombrar la base a `modas-naty-tienda` (el sistema de nota usa `modas-naty` en el mismo `localhost`: sin esto se pisan en desarrollo) y versión nueva que elimina `ventas` y `venta_items`. Verificación: DevTools → IndexedDB.
- [x] (2026-10-09) 3. `src/data/sync/{cola,remoto}.js`: quitar todo lo de ventas (armarVenta, envío y bajada de ventas, `db.ventas` en la cola). Dejar productos, colores, fotos, categorías, movimientos, config y perfiles. Verificación: grep `venta` en `src/data` sin resultados.
- [x] (2026-10-09) 4. `src/data/repos/index.js`, `hooks.js`, `seed/{cargar,perfiles}.js`: sacar ventas; perfiles de prueba = Natali (admin), Pamela (enc_tienda), María (enc_deposito); config base sin `url_catalogo` ni `mostrar_precios_publico`. Verificación: `npm test` de `repos.test.js` (reescrito sin el bloque de ventas).
- [x] (2026-10-09) 5. `src/lib/permisos.js`: matriz de `../02-roles-y-casos-de-uso.md` sobre los roles que ya existen en la base compartida (`admin`, `enc_tienda`, `enc_ventas` → encargada; `enc_deposito` → depósito; `vendedor` → sin acceso al panel). Verificación: `lib.test.js` actualizado.
- [x] (2026-10-09) 6. `src/app/{AppRoutes,navegacion}.jsx|js`: rutas mínimas que compilan (la estructura final es la tarea 0.3); `vite.config.js` (manifest, sin `exceljs` en `globIgnores` si ya no se usa), `index.html`, `package.json` (`name`), `LoginPage.jsx` y `AjustesPage.jsx` sin textos de nota de venta. Verificación: `grep -ri "nota de venta\|comisi\|vendedor" src` vacío salvo `permisos.js`.
- [x] (2026-10-09) 7. `npm run build`, `npm test`, `npx oxlint src`. Inventario de poda en `notas-etapa-0.md`.
**Criterios de aceptación**
- [x] (2026-10-09) `npm run build`, `npm test` y `oxlint` sin errores; ninguna importación rota.
- [x] (2026-10-09) No existe ninguna ruta ni texto de "Nota de venta", "Comisiones" ni "Vendedor".
**Bloqueos**: ninguno.

### Tarea 0.2 · Kit de marca de la tienda · 2 h
Estado: [x] (2026-10-09)
**Objetivo**: un `DESIGN.md` propio con las reglas heredadas más las nuevas (sitio público, kiosco táctil, ticket impreso), y tokens listos para las tres zonas.
**Entradas**: `docs/referencias/DESIGN-sistema-de-nota.md`, `docs/referencias/diseno/README.md`, `docs/referencias/rediseno-tienda-PLAN.md` (solo si D3 = aplicar rediseño).
**Archivos**: `app/DESIGN.md`, `src/styles/tokens.css`, `src/styles/impresion-ticket.css` (vacío con `@page`), `src/index.css`.
**Alcance**: reglas nuevas nombradas: "Táctil generoso" (56 px en kiosco), "Precio siempre con moneda", "Foto protagonista también en Inicio", "Un acento para comprar" (el botón Agregar/Pagar es el único con color de acción en pantalla), "Ticket en negro puro"; tokens de tamaño para kiosco (`--text-kiosco`, `--control-kiosco`); registro de la decisión D3; nota de wiki del kit en `cerebro-facundo/proyectos/modas-naty/` (regla de `kit-de-marca`).
**Pasos**
- [x] (2026-10-09) 1. `DESIGN.md` nuevo con reglas comunes y por zona (sitio, kiosco, panel, ticket) y tabla de movimiento.
- [x] (2026-10-09) 2. `tokens.css`: comentario de origen, `--color-sobre-pie`, `--spacing-control-kiosco`, `--text-kiosco`. `impresion-ticket.css` con `@page 80mm` importado en `index.css`.
- [x] (2026-10-09) 3. Nota fuente de verdad `cerebro-facundo/proyectos/modas-naty/kit-de-marca.md`.
**Criterios de aceptación**
- [x] (2026-10-09) Ningún componente tiene hex suelto; `tokens.css` es la única fuente.
- [x] (2026-10-09) `DESIGN.md` se lee solo y explica cada regla con su porqué.
**Bloqueos**: D3 (paleta); B-S1 (logo) no frena: se usa el provisorio "MN".

### Tarea 0.3 · Tres layouts y mapa de rutas · 2 h
Estado: [x] (2026-10-09)
**Objetivo**: `LayoutSitio`, `LayoutKiosco`, `LayoutPanel` y todas las rutas de `../04-arquitectura.md` resolviendo a pantallas vacías con título.
**Archivos**: `src/app/AppRoutes.jsx`, `src/app/layouts/LayoutSitio.jsx`, `LayoutKiosco.jsx`, `LayoutPanel.jsx` (adaptación del `Layout.jsx` heredado), `src/app/navegacion.js` (dos mapas: menú del sitio y menú del panel), `RutaProtegida.jsx` (panel) y `RutaKiosco.jsx` (dispositivo).
**Alcance**: `/` es Inicio del sitio; `/administracion` es el login (si hay sesión, redirige a `/administracion/inicio`); `/kiosco` redirige a `/kiosco/activar` si el dispositivo no está activado; títulos de pestaña por pantalla; 404 por zona; carga diferida por zona (el sitio no baja el código del panel).
**Pasos**
- [x] (2026-10-09) 1. `layouts/LayoutSitio.jsx` (mínimo), `LayoutKiosco.jsx`, `LayoutPanel.jsx` (movido desde `Layout.jsx`), `RutaKiosco.jsx`, `components/PantallaPendiente.jsx`.
- [x] (2026-10-09) 2. `navegacion.js` con `BASE_PANEL`, `BASE_KIOSCO`, `MENU_SITIO`, `PANTALLAS` del panel y `rutaInicio` por rol; `AppRoutes.jsx` con las tres zonas y carga diferida por zona.
- [x] (2026-10-09) 3. Rutas internas heredadas reapuntadas a `/administracion/...`; `RutaProtegida` redirige al login del panel.
- [x] (2026-10-09) 4. Build: `LayoutPanel` y `LayoutKiosco` salen en paquetes aparte. Recorrido visual de las tres zonas (capturas en `docs/capturas/etapa-0/`).
**Criterios de aceptación**
- [x] (2026-10-09) Todas las rutas abren sin error en 390 y 1440 px.
- [x] (2026-10-09) El bundle inicial del sitio no incluye panel ni kiosco (ver `vite build --report` o tamaños de chunks).
**Bloqueos**: ninguno.

### Tarea 0.4 · Repositorios nuevos y seed · 2 h
Estado: [x] (2026-10-09)
**Objetivo**: interfaz fija de `pedidos`, `pagos`, `gastos`, `sitio` (textos y config), `kiosco`, con implementación local (Dexie) y seed, para construir las etapas 1 a 3 sin backend.
**Entradas**: `../04-arquitectura.md` (modelo de datos, estados del pedido); `src/data/repos/local/*` heredados como patrón.
**Archivos**: `src/data/db.js` (tablas nuevas, versión 2 de Dexie con nota de migración), `src/data/repos/local/{pedidos,pagos,gastos,sitio,kiosco}.js`, `src/data/repos/index.js`, `src/data/hooks.js`, `src/data/seed/{productos.json (campos nuevos), sitio.json, gastos.json}`, tests por repo.
**Alcance**: cabecera de cada repo con la interfaz (una línea por método); `pedidos.crear` valida con zod, genera código `TN-000001`, reserva stock con vencimiento y guarda historial; `pagos.iniciar` devuelve un resultado simulado; estados y transiciones en `src/lib/pedido.js` (una sola tabla de transiciones válidas, con test); `mock/README.md` con la tabla de mocks activos (pieza 2 de `kit-de-marca`).
**Pasos**
- [x] (2026-10-09) 1. `db.js`: base `modas-naty-tienda` con tablas `carrito`, `pedidos`, `pedido_items`, `pedido_historial`, `gastos`, `gasto_categorias`; índice `pedido_id` en movimientos.
- [x] (2026-10-09) 2. `lib/pedido.js` (estados, transiciones, esquemas zod web y kiosco, código `TN-`) + `pedido.test.js`.
- [x] (2026-10-09) 3. Repositorios `local/{carrito,pedidos,pagos,gastos,sitio,kiosco}.js`; `stock.js` con tipos `reserva`/`liberacion`/`devolucion` y `pedido_id`; `productos.js` con campos de tienda y `obtenerPorSlug`; `lib/slug.js`.
- [x] (2026-10-09) 4. `repos/index.js`, `hooks.js` (usePedidos, useCarritoItems, useSitio, useGastos, useKioscoDispositivo…); seed con precio minorista de ejemplo, slug, publicación y categorías de gasto.
- [x] (2026-10-09) 5. `data/pedidos.test.js` (14 pruebas: carrito, crear, idempotencia, stock insuficiente, envío, pago, cancelación, transiciones, vencimiento, consulta pública, kiosco, gastos, PIN) y `data/README.md` (mocks activos).
**Criterios de aceptación**
- [x] (2026-10-09) Ninguna pantalla importa `db.js`; las transiciones inválidas de estado lanzan error con mensaje claro.
- [x] (2026-10-09) `npm test` cubre crear pedido, reserva, vencimiento y transiciones.
**Bloqueos**: ninguno.

### Tarea 0.5 · Fechas en America/La_Paz y moneda Bs · 1 h
Estado: [x] (2026-10-09)
**Objetivo**: cumplir la decisión D5 y poner `bs` como moneda por defecto de la tienda.
**Archivos**: `src/lib/fechas.js` (reescritura con `timeZone`), `src/lib/fechas.test.js`, `src/lib/moneda.js` (`MONEDA_TIENDA = 'bs'`, `formatear` por defecto en Bs, orden de monedas solo donde se elige), `.env.example` (`TZ` documentado para functions).
**Alcance**: `inicioDelDia`/`finDelDia`/`esHoy` calculados en La Paz aunque el dispositivo esté en otra zona (test con una fecha a las 23:30 de Argentina que en Bolivia sigue siendo el mismo día); `fechaHoraTicket()`; sin `toLocaleDateString` fuera de este archivo (grep en el cierre).
**Pasos**
- [x] (2026-10-09) 1. `lib/fechas.js` reescrito con `timeZone: 'America/La_Paz'` y `hourCycle: 'h23'`; `periodos.js` sobre esa base.
- [x] (2026-10-09) 2. `fechas.test.js` corrido con `TZ=America/Argentina/Buenos_Aires` y `TZ=UTC`.
- [x] (2026-10-09) 3. `moneda.js`: `MONEDA_TIENDA = 'bs'`, `formatear` en Bs por defecto. Sin `toLocaleDateString` fuera de `fechas.js` (grep).
**Criterios de aceptación**
- [x] (2026-10-09) Tests de zona horaria pasan ejecutándose con `TZ=America/Argentina/Buenos_Aires` y con `TZ=UTC`.
**Bloqueos**: ninguno.

### Tarea 0.6 · Contexto para IA y entorno · 1 h
Estado: [x] (2026-10-09)
**Objetivo**: que cualquier IA retome el proyecto sin releer la charla.
**Archivos**: `app/CLAUDE.md` (corto: reglas de negocio no obvias, decisiones D1–D9, dónde está cada cosa, comandos vía `R:`), `app/README.md` (reemplaza el de Vite), `app/.env.example` actualizado, `netlify.toml` (functions dir), `iniciar-dev.bat` revisado para `netlify dev`.
**Pasos**
- [x] (2026-10-09) 1. `app/CLAUDE.md`, `app/README.md`, `app/.env.example`.
- [x] (2026-10-09) 2. `netlify.toml` (functions, `TZ`), `iniciar-dev.bat`.
**Criterios de aceptación**
- [x] (2026-10-09) `CLAUDE.md` cabe en una pantalla y no repite lo que ya dicen `package.json` o la estructura de carpetas.
**Bloqueos**: ninguno.

**Cierre de etapa**: build + lint + tests; recorrido de las tres zonas en 390 y 1440 px; `notas-etapa-0.md` con el inventario de poda. Pedir autorización Etapa 1 (y, si Facundo quiere ir en paralelo, Etapa 2).
