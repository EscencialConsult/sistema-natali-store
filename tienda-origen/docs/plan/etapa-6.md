# Etapa 6 — Kiosco de autogestión y ticket térmico (16 h)
Estado: [x] 6.1 a 6.5 cerradas el 2026-10-09 (`notas-etapa-6.md`); 6.6 bloqueada por B-K1 (equipo real).
Leer: `_comun.md`, `../06-kiosco-e-impresion.md` completo, `../02-roles-y-casos-de-uso.md` (CU-K1 a CU-K7), `../04-arquitectura.md` (D8). Patrón heredado de cola offline: `src/data/sync/{cola.js, SyncRunner.jsx}`.
Principio: **una persona que nunca usó la tienda compra sola, con el dedo, y se va con un papel en la mano.**

Requiere: **B-K1** (equipo real) para 6.5 y 6.6; 6.1 a 6.4 se construyen con una PC táctil o el emulador táctil de DevTools.

### Tarea 6.1 · Activación por PIN y sesión de dispositivo · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/kiosco/ActivarPage.jsx` (`/kiosco/activar`), `src/data/repos/{local,remoto}/kiosco.js`, `netlify/functions/kiosco-activar.js`, `kiosco-pedido.js` (crea pedido con token de dispositivo), `src/app/RutaKiosco.jsx`.
**Alcance**: PIN generado en el panel (etapa 7.8; mientras tanto, seed); al activar, token de dispositivo firmado guardado en IndexedDB; `tienda_kiosco_dispositivos` con nombre, último uso; el dispositivo solo puede crear pedidos de origen `kiosco` y consultar su estado; revocable desde el panel.
**Pasos**
- [x] (2026-10-09) 1. `features/kiosco/ActivarPage.jsx`: PIN con teclado numérico en pantalla, nombre del equipo; `kiosco.activar`. Local: PIN `2468`; remoto: Function `kiosco-activar` (PIN de `tienda_config.kiosco.pin`, devuelve token; se guarda `token_hash` en `tienda_kiosco_dispositivos`).
- [x] (2026-10-09) 2. `netlify/functions/kiosco-activar.js` y `kiosco-pedido.js` (crea el pedido con `service_role` tras validar el token del dispositivo; revocado → 401). `repos/remoto/kiosco.js` y `remoto/pedidos.js` (origen kiosco → Function).
- [x] (2026-10-09) 3. `RutaKiosco` ya exige dispositivo; `AccesoEncargada` permite desactivar.
**Criterios de aceptación**
- [x] (2026-10-09) Un token revocado no puede crear pedidos (401) y la pantalla vuelve a "Activar".
**Bloqueos**: ninguno.

### Tarea 6.2 · Flujo táctil · 5 h
Estado: [x] (2026-10-09)
**Archivos**: `src/app/layouts/LayoutKiosco.jsx`, `src/features/kiosco/{BienvenidaPage, CatalogoKiosco, FichaKiosco, CarritoKiosco, ConfirmarKiosco}.jsx`, `TecladoPantalla.jsx` (solo si el equipo no trae teclado en pantalla: decidir con B-K1), `src/styles/kiosco.css` (tamaños).
**Alcance**: bienvenida a pantalla completa con foto y "Tocá para empezar"; catálogo con chips de categoría grandes y grilla 3 columnas; ficha con colores y cantidad por botones; barra inferior fija con total y "Finalizar"; confirmar con nombre y teléfono opcionales; nada de hover, nada de enlaces externos, objetivos de 56 px, texto 18 px; reutiliza repos y componentes del sitio con prop `modo="kiosco"` (no duplicar lógica).
**Pasos**
- [x] (2026-10-09) 1. `LayoutKiosco`: pantalla completa, cabecera mínima con "Volver" y carrito, sin enlaces externos; `KioscoContext` con el dispositivo.
- [x] (2026-10-09) 2. `BienvenidaPage` (atractor sutil, "Tocá para empezar"), `CatalogoKiosco` (chips grandes, grilla 3 columnas, buscador con teclado del sistema), `ProductoKiosco` (galería, colores, cantidad y agregar en tamaño kiosco; al agregar vuelve al catálogo con aviso), `CarritoKiosco` (líneas con +/−, barra inferior con total y "Finalizar"), `ConfirmarKiosco` (nombre y teléfono opcionales, elegir pago).
**Criterios de aceptación**
- [x] (2026-10-09) Prueba con una persona ajena al proyecto: compra sin ayuda en menos de 2 min.
**Bloqueos**: B-K1 (resolución real).

### Tarea 6.3 · Inactividad, pantalla completa y acceso de encargada · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/kiosco/useInactividad.js`, `AvisoInactividad.jsx`, `AccesoEncargada.jsx` (mantener presionado 3 s + PIN), `src/lib/pantallaCompleta.js`.
**Alcance**: 90 s sin tocar → aviso 15 s → vaciar carrito y volver a Bienvenida; Fullscreen API al primer toque (con respaldo si el navegador ya está en modo kiosco); acceso de encargada: salir del kiosco, reimprimir último ticket, imprimir prueba, ver estado de red y de la cola.
**Pasos**
- [x] (2026-10-09) 1. `useInactividad(segundos)` con aviso a los N s y reinicio (vaciar carrito, volver a Bienvenida) 15 s después; `AvisoInactividad.jsx` (diálogo "¿Seguís ahí?").
- [x] (2026-10-09) 2. `lib/pantallaCompleta.js`: pedir pantalla completa al primer toque (si el navegador no está ya en modo kiosco).
- [x] (2026-10-09) 3. `AccesoEncargada.jsx`: mantener presionado 3 s en la esquina → PIN → salir del kiosco, reimprimir último ticket, imprimir prueba, ver red y cola, desactivar equipo.
**Criterios de aceptación**
- [x] (2026-10-09) Tras el reinicio no queda ningún dato de la persona anterior (carrito, nombre, teléfono).
**Bloqueos**: ninguno.

### Tarea 6.4 · Pago en kiosco · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/kiosco/{ElegirPagoKiosco, PagoQR, PagoCaja}.jsx`, reutiliza `repos.pagos` y el adaptador de la etapa 5.
**Alcance**: "Pagar con QR": crea el cobro, muestra QR grande (SVG con `qrcode.react` heredado) con instrucciones, consulta estado cada 3 s, 5 min de espera con cuenta regresiva, éxito → imprime; "Pagar en caja": pedido `pendiente_pago` con `proveedor='caja'`, imprime ticket pendiente; sin red: QR deshabilitado con explicación, caja funciona y encola.
**Pasos**
- [x] (2026-10-09) 1. `PagoKiosco.jsx`: "Pagar con QR" muestra el QR del cobro (`pagos.iniciar`; local: simulado con botón de prueba), consulta el estado cada 3 s, cuenta regresiva de 5 min, éxito → ticket; "Pagar en caja" crea el pedido con `proveedor_pago: 'caja'` e imprime el ticket pendiente.
- [x] (2026-10-09) 2. Sin red: QR deshabilitado con explicación; caja funciona (el pedido queda en la cola y se envía al volver la red).
**Criterios de aceptación**
- [x] (2026-10-09) Pago aprobado desde otro celular (sandbox) imprime el ticket sin tocar la pantalla.
**Bloqueos**: etapa 5 (adaptador); B-P1.

### Tarea 6.5 · Ticket térmico · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/kiosco/Ticket.jsx` (también lo usa el panel), `src/styles/impresion-ticket.css` (`@page 80mm`, variable para 58 mm), `src/lib/imprimir.js` (camino 1: `window.print` en iframe oculto; camino 2: `fetch` al agente local si está configurado), `docs/kiosco/configurar-equipo.md` (driver, papel, Chrome `--kiosk --kiosk-printing`, impresora predeterminada, arranque automático).
**Alcance**: contenido según `06-kiosco-e-impresion.md`; fecha y hora en La Paz; QR de seguimiento; estado PAGADO / PENDIENTE DE PAGO EN CAJA; logo en blanco y negro; falla de impresión detectada (sin `afterprint` en 10 s o error del agente) → aviso y pedido intacto; reimpresión desde el panel.
**Pasos**
- [x] (2026-10-09) 1. `lib/imprimir.js`: `imprimirTicket(nodo)` por `window.print` con detección de `afterprint` y tiempo máximo; si hay `config.kiosco.agente_url`, manda el pedido al agente ESC/POS local en vez de imprimir desde el navegador.
- [x] (2026-10-09) 2. `Ticket.jsx` (ya existe) con el texto de pie configurable; `GraciasPage` que imprime, muestra el código y vuelve sola a Bienvenida a los 15 s; "Reimprimir" por si falló.
- [x] (2026-10-09) 3. `docs/kiosco/configurar-equipo.md`: driver, papel, Chrome `--kiosk --kiosk-printing`, impresora predeterminada, arranque automático.
**Criterios de aceptación**
- [x] (2026-10-09) Ticket impreso en el equipo real, legible, sin cortes, QR escaneable.
**Bloqueos**: B-K1.

### Tarea 6.6 · Red intermitente y pruebas en el equipo real (Hito C) · 1 h
Estado: [!] bloqueada por B-K1 (equipo real)
**Alcance**: las 5 pruebas obligatorias de `06-kiosco-e-impresion.md`; cola de pedidos de kiosco con reintento; documentación de puesta en marcha para la encargada (una página, con fotos) en `docs/kiosco/manual-encargada.md`.
**Pasos**
- [ ] 1. Pendiente del equipo real (B-K1): las 5 pruebas de `../06-kiosco-e-impresion.md` y el manual de la encargada.
**Bloqueos**: B-K1; visita al local o envío del equipo.

**Cierre de etapa**: build + lint + tests; grabación en video del flujo completo en el equipo real; `notas-etapa-6.md`. Pedir autorización de la siguiente etapa.
