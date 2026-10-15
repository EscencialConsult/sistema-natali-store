# Etapa 3 — Carrito y checkout (14 h)
Estado: [x] cerrada el 2026-10-09 (3.6 queda para Facundo). Notas: `notas-etapa-3.md`. Envíos provisorios (B-E1): retiro en tienda + una ciudad de ejemplo desde `sitio.envios`.
Leer: `_comun.md`, `../02-roles-y-casos-de-uso.md` (CU-C1 a CU-C5, flujos críticos), `../04-arquitectura.md` (pedido, estados, reserva). Patrón heredado: `src/features/ventas/useCarrito.js` (antes de la poda, ver `notas-etapa-0.md`) y `AgregarSheet.jsx`.
Principio: **del carrito al "pedido creado" en un solo paso, sin cuenta, sin sorpresas de stock al final.**

### Tarea 3.1 · Carrito persistente · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/carrito/useCarrito.js`, `src/data/repos/local/carrito.js` (tabla Dexie `carrito`), `src/lib/carrito.js` (totales, fusión de ítems iguales), tests.
**Alcance**: ítems por producto + color con cantidad y precio copiado al momento (si el precio cambia, se avisa y se actualiza al abrir el carrito); persistencia entre sesiones; revalidación de stock y precio al abrir el carrito y antes de pagar; contador en la cabecera; límite por ítem = stock disponible.
**Pasos**
- [x] (2026-10-09) 1. `features/carrito/useCarrito.js`: combina `useCarritoItems` con el catálogo y el stock; devuelve líneas con producto, color, precio actual, subtotal, disponible y `problema` (sin stock, sin producto, cantidad mayor al disponible), más totales y `cantidad(key, n)`, `quitar(key)`, `vaciar()`.
- [x] (2026-10-09) 2. `lib/carrito.js`: `totales(lineas)` y `lineasConProblema(lineas)`; test.
- [x] (2026-10-09) 3. Al abrir el carrito se corrige sola la cantidad que supera el disponible (con aviso). Verificación: test del repositorio + manual.
**Criterios de aceptación**
- [x] (2026-10-09) Cerrar y reabrir el navegador conserva el carrito; dos pestañas no lo duplican (misma tabla).
**Bloqueos**: ninguno.

### Tarea 3.2 · Página del carrito y mini carrito · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/carrito/CarritoPage.jsx` (`/carrito`), `MiniCarrito.jsx` (Sheet), `LineaCarrito.jsx`.
**Alcance**: líneas con foto, nombre, color, precio, cantidad editable, quitar (con deshacer en toast); subtotal, costo de envío "se calcula en el siguiente paso", total; avisos por ítem sin stock o con precio cambiado; vacío con "Ver catálogo"; botón "Continuar" único acento; mínimo de compra configurable.
**Pasos**
- [x] (2026-10-09) 1. `features/carrito/CarritoPage.jsx` (`/carrito`) y `LineaCarrito.jsx`: foto, nombre, color, precio, `SelectorCantidad`, quitar (toast), aviso por línea con problema.
- [x] (2026-10-09) 2. Resumen con subtotal, "envío se calcula al finalizar", total, mínimo de compra (`sitio.compra_minima_cent`), botón primario "Finalizar compra"; vacío con "Ver catálogo".
**Criterios de aceptación**
- [x] (2026-10-09) Cambiar cantidad no pide confirmación ni recarga; con reduced-motion no hay animación de quitar.
**Bloqueos**: ninguno.

### Tarea 3.3 · Checkout · 4 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/checkout/CheckoutPage.jsx` (`/checkout`), `FormDatos.jsx`, `FormEntrega.jsx`, `ResumenPedido.jsx`, `src/lib/checkout.js` (esquema zod: nombre, teléfono boliviano o internacional, correo opcional, entrega, dirección y ciudad si envío, nota).
**Alcance**: un solo paso largo en celular con secciones; entrega: retiro en tienda (dirección y horarios) o envío (ciudad desde config con costo; dirección y referencia); método de pago se elige en la etapa 5 (acá, un marcador "Pago: se define al confirmar"); resumen fijo abajo con total y botón "Confirmar pedido"; validación en vivo con mensajes claros; botón deshabilitado mientras procesa; datos del comprador recordados en el dispositivo para la próxima compra (opt-in).
**Pasos**
- [x] (2026-10-09) 1. `features/checkout/CheckoutPage.jsx` (`/checkout`): secciones Datos (nombre, teléfono, correo opcional), Entrega (retiro con dirección y horarios de la tienda / envío con ciudad de `sitio.envios` y dirección), Forma de pago (en línea con Mercado Pago / transferencia o QR bancario), Nota; resumen fijo abajo con total y "Confirmar pedido".
- [x] (2026-10-09) 2. Validación con `esquemaPedido` (zod) por campo al salir y completa al enviar; botón deshabilitado mientras procesa; `autocomplete` en los campos; datos del comprador recordados en el dispositivo (opt-in).
- [x] (2026-10-09) 3. Carrito vacío → redirige a `/carrito`. Id del pedido generado una vez por pantalla (idempotencia ante doble clic).
**Criterios de aceptación**
- [x] (2026-10-09) Completar el checkout desde el celular en menos de 90 s con autocompletar del navegador funcionando (atributos `autocomplete`).
**Bloqueos**: B-E1 (ciudades y costos) → config provisoria "Retiro en tienda" + "Envío en la ciudad: Bs 15" marcada PROVISORIO.

### Tarea 3.4 · Creación del pedido y página del pedido · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/checkout/PedidoPage.jsx` (`/pedido/:codigo`), `src/data/repos/local/pedidos.js` (ya existe de 0.4; acá se conecta), `src/lib/pedido.js`.
**Alcance**: al confirmar, `pedidos.crear` valida stock, reserva, devuelve código; el carrito se vacía solo si el pedido se creó; página del pedido con código grande, estado con texto e icono, ítems, entrega, total, "Qué sigue" (según estado), botón "Pagar" (marcador hasta la etapa 5) y "Consultar por WhatsApp" con el código; errores: stock insuficiente al crear (muestra qué ítem y vuelve al carrito ajustado).
**Pasos**
- [x] (2026-10-09) 1. Al confirmar: `pedidos.crear` → vaciar carrito, recordar el código en el dispositivo (`lib/misPedidos.js`), ir a `/pedido/:codigo`. Stock insuficiente → aviso y vuelta al carrito con la línea marcada.
- [x] (2026-10-09) 2. `features/checkout/PedidoPage.jsx` + `DetallePedido.jsx`: código grande, estado con texto e icono, ítems, entrega, total, "Qué sigue" según estado, "Pagar" (en modo local simula la vuelta de la pasarela con `?simular=aprobado`), "Consultar por WhatsApp" con el código.
- [x] (2026-10-09) 3. Un código que no es de este dispositivo no se muestra: va a `/seguimiento` con el código precargado (privacidad mínima hasta la etapa 4).
**Criterios de aceptación**
- [x] (2026-10-09) Doble clic en "Confirmar" crea un solo pedido (idempotencia por id generado en el cliente).
**Bloqueos**: ninguno.

### Tarea 3.5 · Seguimiento · 1 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/checkout/SeguimientoPage.jsx` (`/seguimiento`).
**Alcance**: formulario código + teléfono; muestra la misma `PedidoPage`; mensaje genérico si no coincide (no revela si el código existe).
**Pasos**
- [x] (2026-10-09) 1. `features/checkout/SeguimientoPage.jsx` (`/seguimiento`): código + teléfono → `pedidos.consultarPublico`; muestra `DetallePedido`; mensaje genérico si no coincide.
**Bloqueos**: ninguno.

### Tarea 3.6 · Revisión con Natali (Hito A) · 1 h
Estado: [!] pendiente de Facundo: deploy de prueba y sesión con Natali
**Alcance**: deploy de prueba en Netlify (modo local, sin backend); guion de 10 minutos: entrar desde el celular, buscar un modelo, agregar, pagar (simulado), ver el pedido; registrar observaciones en `hallazgos-hito-a.md`; pedir los datos de los bloqueos B-C1, B-C2, B-E1, B-S1, B-S2, B-P1, B-K1 en la misma reunión.
**Pasos**
- [ ] 1. Queda para Facundo: deploy de prueba en Netlify (modo local) y sesión con Natali con el guion de 10 minutos. Las preguntas de los bloqueos están en `../07-preguntas-abiertas-y-bloqueos.md`.
**Bloqueos**: agenda de Natali.

**Cierre de etapa**: build + lint + tests; axe en carrito, checkout, pedido; `notas-etapa-3.md`. Pedir autorización Etapa 4.
