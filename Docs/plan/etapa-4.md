# Etapa 4 — Nueva venta + nota de venta A5 (16 h)
Leer: `_comun.md`, `../01-pedido-cliente.md` (puntos 1 y contexto), `../02-erp-actual.md`, `HTML-DEMO.html` (flujo de venta y nota como referencia funcional).

### Tarea 4.1 · Monedas y tipo de cambio · 2 h
Estado: [ ]
**Bloqueos**: B5.
**Pasos**
- [ ] 1. Orden fijo en toda la app: **USD (primero, moneda por defecto), ARS, Bs (último)**. Pedido explícito de la clienta.
- [ ] 2. Config de tipos de cambio (USD→Bs, USD→ARS) editable por admin, con fecha de última actualización.
- [ ] 3. Cada venta se registra en UNA sola moneda y guarda el tipo de cambio usado (para que cambiar la tasa luego no altere ventas pasadas).
- [ ] 4. Precio de lista en USD; conversión redondeada en `lib/moneda.js` (centavos enteros). Tests.
**Criterios de aceptación**
- [ ] El selector muestra USD primero y Bs al final en venta, historial, filtros y reportes.

### Tarea 4.2 · Pantalla Nueva venta · 6 h
Estado: [ ]
**Archivos**: `features/ventas/NuevaVentaPage.jsx`, `ItemsVenta.jsx`, `useCarrito.js`.
**Pasos**
- [ ] 1. Paso 1: moneda (botones grandes, USD primero).
- [ ] 2. Paso 2: agregar producto con el **buscador por código** de 3.1 (mismo componente); al elegir, escoger color y cantidad.
- [ ] 3. Unidad de venta: **docena** (regla del negocio; confirmar si hay venta por unidad — depende de B1). Cantidad con botones +/- y teclado numérico.
- [ ] 4. Precio por línea editable solo con permiso (descuentos) y registrando quién lo cambió.
- [ ] 5. Aviso si la cantidad supera el stock del color (permitir con confirmación según rol).
- [ ] 6. Cliente: nombre opcional (+ teléfono opcional).
- [ ] 7. Método de pago: Efectivo / Transferencia.
- [ ] 8. Resumen fijo abajo con total en la moneda elegida; quitar ítems; vaciar con confirmación.
- [ ] 9. Guardar borrador local (si se cierra la app a mitad, se recupera).
**Criterios de aceptación**
- [ ] Una venta de 3 productos se arma en menos de 1 minuto, con una mano, sin internet.

### Tarea 4.3 · Confirmar y guardar (offline) · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Botón Confirmar deshabilitado mientras guarda o si falta algo; mensajes claros.
- [ ] 2. `ventas.crear` en transacción: venta + ítems + descuento de stock + cola de sync.
- [ ] 3. Pantalla de éxito con número de nota, total, y acciones: ver nota, WhatsApp, nueva venta.
- [ ] 4. Estado de sincronización visible (pendiente/sincronizada).
- [ ] 5. Pruebas: doble toque no duplica; cerrar justo al confirmar no pierde ni duplica la venta.

### Tarea 4.4 · Nota de venta A5 · 4 h
Estado: [ ]
**Entradas**: `../01-pedido-cliente.md` punto 1. **Bloqueos**: B2 (logo), B3 (teléfonos), B4 (URL del QR).
**Archivos**: `features/nota/NotaVenta.jsx`, `nota-print.css`, `lib/qr.js`.
**Pasos**
- [ ] 1. Diseñar la nota en HTML con medidas físicas (mm) para **A5 (148×210 mm)**.
- [ ] 2. Encabezado: **logo** a la izquierda y **código QR** (aparte del logo) al catálogo; número de nota y fecha.
- [ ] 3. Cuerpo: vendedor, cliente, tabla de ítems (código, descripción, color, cantidad, precio, subtotal), total, moneda y tipo de cambio, método de pago.
- [ ] 4. Pie: teléfonos de los vendedores y de la encargada de tienda (de Ajustes, no hardcodeados).
- [ ] 5. QR generado en el cliente con la URL de config (`qrcode.react`), tamaño mínimo escaneable (≥ 22 mm), margen blanco.
- [ ] 6. `@page { size: 148mm 210mm; margin: 8mm }` + `@media print` que oculta la app y deja solo la nota.
- [ ] 7. Muchos ítems: la tabla pasa a segunda hoja sin cortar filas, repitiendo encabezado; el pie y el QR no se cortan.
- [ ] 8. Probar impresión real y "Guardar como PDF" en Chrome con A5. Verificación (criterio del cliente): no se corta contenido; logo, teléfonos y QR completos. Con 3, 15 y 40 ítems.
- [ ] 9. Escanear el QR del PDF con un celular. Verificación: abre el catálogo.
**Criterios de aceptación**
- [ ] Los del punto 1 del pedido, con evidencia (PDFs de prueba guardados en `Docs/cliente/pruebas-nota/`).

### Tarea 4.5 · WhatsApp y PDF · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Botón "Imprimir / Guardar PDF" (usa 4.4).
- [ ] 2. Botón "Compartir por WhatsApp": en celular, compartir el PDF/imagen con la nota (Web Share API con archivo); si no está disponible, abrir `wa.me` con el resumen en texto.
- [ ] 3. Generar la imagen/PDF en el cliente (sin servidor) para que funcione offline.
- [ ] 4. Probar en un Android y un iPhone si se puede.

**Cierre de etapa**: venta completa offline → nota A5 → PDF → WhatsApp; build+lint+tests. Pedir autorización Etapa 5.
