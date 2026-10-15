# Etapa 5 — Pasarela de pago (16 h)
Leer: `_comun.md`, `../05-pagos.md` completo, skill `pagokit` (`C:\Users\PERSONAL\.claude\skills\agente-pagokit\SKILL.md`, `skills/webhook-verifier/`, `skills/integration-builder/` y la plantilla `templates/compiled/mercadopago-express-one-time.md`), `cerebro-facundo/wiki/pagokit-agente-pagos.md`.
Principio: **el pedido se marca pagado solo cuando el webhook verificado lo dice. La vuelta del navegador es decorativa.**

Requiere: **B-P1 resuelto** (qué proveedor y en qué país) y una cuenta de prueba de Mercado Pago (o la del proveedor elegido).

### Tarea 5.1 · Decisión B-P1 y adaptador `proveedorPago` · 2 h
Estado: [ ]
**Archivos**: `netlify/functions/_lib/proveedores/{index.js, mercadopago.js (vacío con la interfaz), manual.js}`, `src/data/repos/{local,remoto}/pagos.js`, `src/lib/pago.js` (estados y mensajes), `docs/pagos/decision-proveedor.md`.
**Alcance**: registrar la decisión (A, B, C o D de `05-pagos.md`) con fecha y quién la tomó; interfaz fija (`crearCobro`, `verificarWebhook`, `interpretarEvento`, `reembolsar`); selección del proveedor por configuración (`tienda_config.pagos.proveedor_activo`); test de contrato que cada implementación debe pasar.
**Criterios de aceptación**
- [ ] Cambiar el proveedor activo no toca pantallas ni funciones SQL.
**Bloqueos**: B-P1.

### Tarea 5.2 · Mercado Pago con pagokit · 4 h
Estado: [ ]
**Objetivo**: primera vez que se usa la skill; generar con ella y adaptar a Netlify Functions.
**Archivos**: lo que genere `/pagokit:start` (ejecutado desde `R:\app` con `claude --plugin-dir`), movido a `netlify/functions/{checkout.js, webhook-mercadopago.js, reembolso.js}`, `_lib/mercadopago.js`, `_lib/errores-pago.js`; `docs/pagos/PAGOKIT_INTEGRATION.md`, `docs/pagos/PAGOKIT_PRODUCTION_CHECKLIST.md`; `netlify/.env.example` (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`); `package.json` (SDK `mercadopago`).
**Alcance**: respuestas al asistente de pagokit: país según B-P1, cobro único, con efectivo si aplica, frontend "hosted" (Checkout Pro), moneda según cuenta; adaptar Express → handler de Netlify (`event.body` como raw body, `event.headers`); registrar en `PAGOKIT_INTEGRATION.md` qué se cambió respecto de lo generado y por qué; dejar anotado en el cerebro (`wiki/pagokit-agente-pagos.md`) cómo fue la primera experiencia real con la skill.
**Criterios de aceptación**
- [ ] `/pagokit:test` o prueba equivalente con eventos sintéticos pasa contra `netlify dev`.
- [ ] Los 5 candados se verifican (grep de claves, `.gitignore`, firma, idempotencia, raw body).
**Bloqueos**: B-P1; credenciales de prueba.

### Tarea 5.3 · Webhook firmado e idempotente · 3 h
Estado: [ ]
**Archivos**: `netlify/functions/webhook-mercadopago.js`, `_lib/webhook.js` (contrato de `webhook-verifier`: tamaño, raw body, firma, ventana, dedup, dispatch, 200), test con firmas válidas e inválidas.
**Alcance**: verificación `x-signature` (HMAC-SHA256 con `MP_WEBHOOK_SECRET`, `ts` y `request-id`); dedup por `tienda_webhook_eventos`; consulta del pago a la API de Mercado Pago (no confiar solo en el cuerpo de la notificación); `tienda_confirmar_pago` con `external_reference`; estados `approved` → pagado, `rejected`/`cancelled` → sigue pendiente (se informa), `refunded` → reembolsado; logs solo con id y tipo; URL pública del webhook (en local, túnel con `netlify dev --live` o ngrok).
**Criterios de aceptación**
- [ ] Reenviar el mismo evento 3 veces confirma el pedido una sola vez.
- [ ] Un evento con firma inválida devuelve 400 sin tocar la base.
**Bloqueos**: ninguno.

### Tarea 5.4 · Pantallas de pago · 3 h
Estado: [ ]
**Archivos**: `src/features/checkout/{ElegirPago.jsx, BotonPagar.jsx, EstadoPago.jsx}`, `PedidoPage.jsx` (estado en vivo con reintento cada 3 s hasta 1 min), `src/lib/pago.js` (mensajes en español por código de error de la pasarela).
**Alcance**: en el checkout, elección del medio según proveedores activos (pasarela, transferencia con comprobante, "coordinar por WhatsApp"); "Pagar" crea la preferencia y redirige; vuelta con `?resultado=` ignorado para decidir el estado (solo para el texto inicial); rechazado → "Reintentar con otro medio"; pendiente (efectivo) → instrucciones; el pedido muestra `pagado_en` en hora de La Paz.
**Criterios de aceptación**
- [ ] Cerrar la pestaña de la pasarela y volver al sitio muestra el estado correcto gracias al webhook.
**Bloqueos**: ninguno.

### Tarea 5.5 · Pago manual y "Pagos por confirmar" · 2 h
Estado: [ ]
**Archivos**: `netlify/functions/_lib/proveedores/manual.js`, `src/features/checkout/SubirComprobante.jsx`, `src/features/panel/pedidos/PagosPorConfirmar.jsx` (se integra con la etapa 7), bucket `tienda_comprobantes` (privado; subida con URL firmada desde una Function), config con datos bancarios y QR estático.
**Alcance**: compradora ve datos y QR, sube captura (comprimida en el navegador, máx. 1 MB), reserva 24 h; panel lista pendientes con la imagen y botón "Confirmar pago" → `tienda_confirmar_pago(proveedor='transferencia')`; "Rechazar" con motivo (avisa por WhatsApp manual).
**Criterios de aceptación**
- [ ] El comprobante no es accesible por URL pública.
**Bloqueos**: datos bancarios de Natali (B-P1).

### Tarea 5.6 · Reembolso y checklist de producción (Hito B) · 2 h
Estado: [ ]
**Archivos**: `netlify/functions/reembolso.js` (solo admin, idempotente por `pago_id`), `src/features/panel/pedidos/BotonReembolsar.jsx`, `docs/pagos/PAGOKIT_PRODUCTION_CHECKLIST.md` completado.
**Alcance**: reembolso total en v1 (parcial fuera de alcance); `tienda_reembolsar_pedido` libera stock; variables de producción cargadas en Netlify (contexto `production`) por Facundo; **un pago real de monto mínimo y su reembolso** registrados en `notas-etapa-5.md` con ids.
**Criterios de aceptación**
- [ ] Checklist completo con fecha; sin claves de prueba en producción (prefijos verificados).
**Bloqueos**: cuenta real del proveedor.

**Cierre de etapa**: pruebas de functions + esquema; pago sandbox de punta a punta (web) grabado en GIF para Natali; `notas-etapa-5.md`. Pedir autorización de la siguiente etapa.
