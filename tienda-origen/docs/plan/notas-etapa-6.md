# Notas de cierre — Etapa 6: Kiosco de autogestión y ticket térmico (2026-10-09)

Verificación: lint sin avisos · build OK (el kiosco sale en paquetes propios) · 91 pruebas · axe (WCAG 2.1 A/AA + 2.2 AA) en activación, bienvenida, catálogo, ficha, carrito, confirmar, pago con QR y gracias: **0 infracciones** tras dos correcciones · recorrido real a 1024×768 (resolución táctil provisoria): activar con PIN → tocar para empezar → modelo → color → cantidad 2 → agregar (contador del carrito) → carrito Bs 150 → finalizar → **pagar en caja** → gracias con código `TN-000001`, ticket "impreso" (evento `afterprint` simulado) y cuenta regresiva; y el mismo flujo con **pagar con QR** → QR en pantalla con espera de 5 min → pago aprobado (simulado) → "¡Gracias por tu compra!" `TN-000002`. Capturas en `../capturas/etapa-6/`.

**6.6 (equipo real) queda bloqueada por B-K1**: hace falta el aparato para probar impresión térmica, red cortada e inactividad de 90 s en vivo.

## Qué quedó hecho
- **6.1** Activación con PIN y teclado en pantalla (`ActivarPage`); el equipo queda registrado en el dispositivo. Local: PIN de `config.kiosco.pin` o `2468`. Con servidor: Functions `kiosco-activar` (PIN de `naty_config.kiosco`, token con hash en `tienda_kiosco_dispositivos`) y `kiosco-pedido` (crea pedidos del kiosco con `service_role` y consulta su estado con el token; revocado → 401). `repos/remoto/{kiosco,pedidos,pagos}` enrutan el origen kiosco por esas Functions.
- **6.2** `LayoutKiosco` (pantalla completa al primer toque, "Volver" fijo, carrito con contador), `BienvenidaPage` (atractor de opacidad), `CatalogoKiosco` (chips de 56 px, grilla 3 columnas, buscador), `ProductoKiosco` (color, cantidad y un solo botón grande; al agregar vuelve al catálogo con aviso), `CarritoKiosco` (barra fija con total y Finalizar), `ConfirmarKiosco` (nombre y teléfono opcionales; dos botones grandes: QR o caja).
- **6.3** `useInactividad` (aviso "¿Seguís ahí?" y reinicio a los 15 s: vacía el carrito y vuelve a Bienvenida), pantalla completa, `AccesoEncargada` (mantener presionado 3 s la esquina superior izquierda → PIN → reimprimir último, imprimir prueba, red y cola, salir al panel, desactivar equipo).
- **6.4** `PagarPage`: QR del cobro, consulta del estado cada 3 s, cuenta regresiva de 5 min, "Mejor pago en caja" (cancela y recrea en caja), botón de simulación solo sin servidor. Sin red, "Pagar con QR" se deshabilita y "Pagar en caja" sigue (el pedido entra a la cola de sincronización).
- **6.5** `lib/imprimir.js` (navegador con `afterprint` y tope de 15 s, o agente ESC/POS por HTTP si está configurado), `Ticket.jsx` con pie configurable, `GraciasPage` que imprime sola, permite reimprimir y vuelve a Bienvenida a los 15 s. Configuración → Kiosco: PIN, inactividad, texto del ticket, URL del agente. `docs/kiosco/configurar-equipo.md`.

## Decisiones
- El kiosco no tiene sesión de persona: tiene un **token de dispositivo**. Con servidor, nunca llama a Supabase directo para crear pedidos: pasa por la Function, que valida el token y crea como servicio (la base rechaza pedidos de origen kiosco que no vengan del servidor).
- Con servidor, el PIN del acceso de la encargada se valida contra la misma Function de activación (crea un registro "(verificación)" en dispositivos). Es lo más simple hoy; en la etapa 8 se puede sumar una Function de solo verificación.
- `window.print` + `--kiosk-printing` es el camino principal; el agente ESC/POS queda como respaldo configurable sin tocar código.

## Queda afuera a propósito
- Pruebas en el equipo real, impresora térmica y modo avión (6.6, B-K1).
- QR de Mercado Pago real: hoy es el `init_point` simulado; con la etapa 5 el QR apunta al cobro real.
- Rate limit en `kiosco-activar` (hoy cualquiera con la URL puede probar PINs): se agrega en la etapa 8 con reglas de Netlify.

## Aprendizajes
- Un `<Outlet />` anidado (ruta guardiana) no hereda el `context` del layout: hay que reenviarlo (`useOutletContext()` → `<Outlet context={…}>`), si no las pantallas reciben `undefined`.
- axe `label-content-name-mismatch`: un `aria-label` que no contiene el texto visible del enlace ("Carrito 1") falla; mejor dejar el texto visible y agregar `sr-only` para el resto.
- `qrcode.react` acepta `title` para que el SVG tenga nombre accesible (`svg-img-alt`).
