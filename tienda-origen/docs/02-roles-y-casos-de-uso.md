# Roles y casos de uso

## Actores

| Actor | Quién es | Dónde entra | Sesión |
|---|---|---|---|
| **Visitante** | Cualquier persona que llega al sitio | `/`, `/quienes-somos`, `/catalogo`, `/contacto` | Sin sesión |
| **Compradora** | Visitante que arma un carrito y paga | `/carrito`, `/checkout`, `/pedido/:codigo` | Sin cuenta; el pedido se identifica por código + teléfono/correo |
| **Kiosco** (dispositivo) | La computadora táctil con impresora en el local | `/kiosco` | Sesión de **dispositivo** (PIN de activación, guardado en el equipo) |
| **Encargada de tienda** | Atiende el local, confirma pagos en caja, prepara pedidos | `/administracion` | Usuario interno, rol `encargada` |
| **Encargada de depósito** | Carga productos, fotos, colores y stock | `/administracion` | Usuario interno, rol `deposito` |
| **Administradora** (Natali) | Dueña: ve todo, configura todo, gastos y reportes | `/administracion` | Usuario interno, rol `admin` |

Los roles internos salen del equipo real registrado para el sistema de nota (`../SISTEMA DE NOTA/Docs/05-equipo-y-roles.md`). Acá no hay rol vendedor: nadie "vende", la tienda vende sola. Si Natali quiere que una vendedora también vea pedidos, se le da rol `encargada`.

## Matriz de permisos (propuesta, a confirmar con Natali: bloqueo B6)

| Acción | admin | encargada | deposito | kiosco |
|---|---|---|---|---|
| Ver inicio del panel (cifras del día) | sí | sí | no | no |
| Productos: ver listado interno | sí | sí | sí | no |
| Productos: crear, editar, dar de baja, fotos, colores | sí | no | sí | no |
| Stock: mover, importar | sí | no | sí | no |
| Precios: editar | sí | no | no | no |
| Pedidos: ver y cambiar estado | sí | sí | no | no |
| Pedidos: confirmar "pago en caja" | sí | sí | no | no |
| Pedidos: cancelar, reembolsar | sí | no | no | no |
| Gastos: cargar, editar | sí | sí (solo cargar) | no | no |
| Reportes: ventas, gastos, margen | sí | no | no | no |
| Configuración: tienda, sitio, envíos, pasarela, kiosco | sí | no | no | no |
| Usuarios internos: alta, baja, rol | sí | no | no | no |
| Kiosco: catálogo, carrito, confirmar pedido, imprimir ticket | — | — | — | sí |
| Kiosco: activar / desactivar dispositivo | sí | sí | no | — |

## Casos de uso

### Visitante
- **CU-V1 Conocer la tienda**: entra a Inicio, ve destacados, nuevos ingresos, categorías, cómo comprar, dónde está el local y WhatsApp.
- **CU-V2 Leer quiénes somos**: historia, fotos del local, formas de contacto, redes.
- **CU-V3 Explorar el catálogo**: grilla por categoría, buscador por nombre o código, orden por precio o novedad, scroll continuo.
- **CU-V4 Ver un producto**: galería, descripción, colores disponibles con stock ("quedan 3", "sin stock"), precio, botón agregar.
- **CU-V5 Consultar por WhatsApp** desde la ficha con el código del producto ya escrito.

### Compradora
- **CU-C1 Armar el carrito**: elige color y cantidad; el carrito queda guardado en el dispositivo aunque cierre el navegador.
- **CU-C2 Ajustar el carrito**: cambiar cantidades, quitar, ver subtotal; aviso si un color se quedó sin stock desde que lo agregó.
- **CU-C3 Checkout**: nombre, teléfono (WhatsApp), correo, forma de entrega (retiro en tienda o envío con dirección y ciudad), resumen y total.
- **CU-C4 Pagar en línea**: va a la pasarela, paga, vuelve a `/pedido/:codigo` con el estado real (aprobado, pendiente, rechazado).
- **CU-C5 Seguir el pedido**: con el código del pedido y su teléfono ve el estado (pagado, en preparación, enviado, listo para retirar).
- **CU-C6 Recibir confirmación**: mensaje por WhatsApp o correo con el código del pedido y el detalle (medio a definir: bloqueo B-N1).

### Kiosco (persona en el local, sin ayuda)
- **CU-K1 Pantalla de bienvenida**: "Tocá para empezar", vuelve sola a esta pantalla tras inactividad y vacía el carrito.
- **CU-K2 Elegir productos**: catálogo táctil con botones grandes, filtros por categoría, ficha con colores y stock.
- **CU-K3 Confirmar compra**: resumen, nombre y teléfono opcionales (para el ticket), elegir **pagar con QR** (pasarela) o **pagar en caja**.
- **CU-K4 Pagar con QR**: la pantalla muestra el QR de la pasarela; al aprobarse (webhook) imprime el ticket solo.
- **CU-K5 Pagar en caja**: imprime un ticket "pendiente de pago" con el código; la encargada cobra y marca el pedido como pagado en el panel (opcional: reimprime ticket pagado).
- **CU-K6 Ticket**: código del pedido, fecha y hora de Bolivia, ítems (código, nombre, color, cantidad, precio), total en Bs, estado de pago, QR o código para seguimiento, teléfono de la tienda.
- **CU-K7 Falla de impresora**: la pantalla avisa, el pedido queda igual registrado y se puede reimprimir desde el panel.

### Encargada de tienda
- **CU-E1 Ver pedidos del día**: lista con estado, origen (web o kiosco), medio de pago, total.
- **CU-E2 Confirmar pago en caja** de un pedido de kiosco.
- **CU-E3 Preparar y entregar**: pasar un pedido a "en preparación", "listo para retirar", "enviado", "entregado".
- **CU-E4 Imprimir o reimprimir** el ticket / comprobante de un pedido.
- **CU-E5 Cargar un gasto** del día (ej. envío, bolsas) con categoría y monto.
- **CU-E6 Activar el kiosco** en una computadora nueva con el PIN.

### Encargada de depósito
- **CU-D1 Alta de producto** con código, nombre, categoría, descripción, precio, fotos (comprimidas en el navegador), colores y stock inicial.
- **CU-D2 Edición y baja lógica** (el producto sale del sitio pero queda en los pedidos históricos).
- **CU-D3 Movimientos de stock**: entrada, salida, ajuste; historial por producto y color.
- **CU-D4 Carga masiva** desde Excel + fotos nombradas por código (reutiliza la del sistema de nota).

### Administradora
- **CU-A1 Inicio del panel**: ventas de hoy y del mes, pedidos por estado, pagos pendientes, stock bajo, gastos del mes, margen.
- **CU-A2 Reportes por período**: ventas por día, por categoría, por medio de pago, por origen (web / kiosco); gastos por categoría; ingresos menos gastos; exportar a Excel.
- **CU-A3 Gastos**: categorías propias, alta, edición, baja; adjuntar comprobante (foto).
- **CU-A4 Cancelar o reembolsar** un pedido (el reembolso llama a la pasarela; el stock vuelve).
- **CU-A5 Configurar la tienda**: nombre, logo, teléfonos, dirección, horarios, redes, textos de Inicio y Quiénes somos, moneda y tipo de cambio, mostrar precios en USD, costos de envío por ciudad, mínimo de compra.
- **CU-A6 Configurar la pasarela**: credenciales (solo en el servidor, nunca en el navegador), modo prueba / producción.
- **CU-A7 Usuarios internos**: alta con correo, rol, baja.
- **CU-A8 Kiosco**: generar PIN de activación, ver dispositivos activos, texto del ticket, inactividad.

## Flujos críticos (los que no pueden fallar)
1. **Pago aprobado → pedido pagado → stock descontado**, aunque la compradora cierre la pestaña: lo decide el webhook, no el navegador.
2. **Kiosco sin internet un rato**: el catálogo sigue visible (PWA); el pedido se guarda local y se envía al volver la red; "pagar con QR" se deshabilita hasta que haya red, "pagar en caja" sigue funcionando.
3. **Stock**: nunca se vende lo que no hay. La reserva se hace al crear el pedido en el servidor (función SQL), con vencimiento si no se paga.
