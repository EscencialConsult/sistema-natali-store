# Visión y alcance

## En una frase
Una tienda online de ropa femenina para Modas Naty (Bolivia) donde cualquier persona entra, mira el catálogo, arma su carrito y paga sin hablar con nadie; con un kiosco táctil en el local para que la clienta se autogestione la compra y se lleve un ticket impreso; y con un panel de administración donde Natali y su equipo cargan productos, siguen los pedidos y controlan ingresos y gastos.

## Pedido original (Facundo, 2026-10-09)
- Sitio público: **Inicio**, **Quiénes somos**, **Catálogo**.
- **Carrito** de compras y **pasarela de pago** (Mercado Pago, con la skill `pagokit`).
- **Kiosco de autogestión**: una computadora con pantalla táctil e impresora térmica integrada; la persona arma la compra sola y recibe su **ticket impreso**.
- **Sistema de gestión interna** separado del sitio, en una URL propia (`/administracion`): agregar, editar y quitar productos, seguir pedidos, cuantificar gastos y "todo lo que debería tener un panel de administrador de una tienda online".
- Misma lógica de catálogo, mismos colores y mismo diseño que el sistema de notas de venta; mismo stack (React, Vite, Tailwind, lucide).
- **Sin** nota de venta, **sin** usuarios vendedores. Es una tienda directa al público.
- Hora y fechas en **Bolivia** (America/La_Paz).

## Qué es
| Es | No es |
|---|---|
| Tienda al público con precios visibles y compra directa | Herramienta interna de vendedores (eso es el sistema de nota) |
| Compra como invitada: nombre, teléfono, correo, entrega | Registro obligatorio de usuarias con contraseña |
| Catálogo con fotos, colores y stock real | Catálogo "de consulta" sin stock |
| Pago en línea con pasarela + pago en kiosco | Caja de mostrador con comisiones de vendedores |
| Panel de administración con pedidos, stock, gastos, reportes | ERP contable completo (facturación fiscal, planillas) |

## Alcance de la versión 1
1. Sitio público responsive (celular primero) con Inicio, Quiénes somos, Contacto y Catálogo.
2. Catálogo: grilla por categoría, buscador, ficha con galería, colores con stock, precio en Bs (y USD si Natali lo pide).
3. Carrito persistente en el dispositivo; checkout como invitada; elección de **retiro en tienda** o **envío** (a definir ciudades y costos).
4. Pago en línea por pasarela, con estados del pedido actualizados por webhook.
5. Kiosco táctil en el local: catálogo + carrito + confirmación + ticket térmico de 80 mm; pago en kiosco por QR de la pasarela o "pago en caja" confirmado por la encargada.
6. Panel `/administracion`: login, inicio con cifras del día, productos (alta, edición, baja, fotos, colores, stock, carga masiva), pedidos (estados, impresión de comprobante, cancelación, reembolso), gastos (alta y categorías), reportes (ventas, gastos, margen por período), configuración (datos de la tienda, textos del sitio, envíos, pasarela, kiosco), usuarios internos.
7. PWA instalable (kiosco y panel), accesibilidad AA, SEO básico, páginas legales.

## Fuera de la versión 1 (se anotan para no perderlas)
- Cuentas de usuarias con historial de compras y direcciones guardadas.
- Cupones y descuentos por código.
- Facturación fiscal (SIAT Bolivia) y notas de crédito.
- Integración con transportistas (cotización automática de envío).
- Reseñas de productos, listas de deseos, newsletter.
- Multi-tienda o multi-moneda real en la pasarela.

## Cómo se mide el éxito
- Una persona compra desde el celular en menos de 3 minutos sin instrucciones.
- En el kiosco, de tocar la pantalla al ticket impreso: menos de 2 minutos, sin ayuda.
- Natali carga un producto nuevo con fotos y colores en menos de 2 minutos.
- Ningún pedido pagado queda sin registrar, aunque la red del local falle a mitad del pago (el webhook lo confirma después).

## Relación con el sistema de notas de venta
Los dos sistemas son de la misma clienta y hablan del **mismo catálogo**. La decisión recomendada (ver `04-arquitectura.md`, decisión D4) es que la tienda lea las mismas tablas de productos que el sistema de nota para que Natali cargue cada modelo **una sola vez**. Lo que es propio de la tienda (pedidos, pagos, gastos, kiosco, textos del sitio) vive en tablas nuevas con prefijo `tienda_`.
