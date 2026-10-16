# Etapa 7 — Panel de administración (20 h)
Estado: [x] cerrada el 2026-10-09. Notas: `notas-etapa-7.md`.
Leer: `_comun.md`, `../02-roles-y-casos-de-uso.md` (matriz, CU-E, CU-D, CU-A), `../03-sistemas-y-caracteristicas.md` (S6). Código heredado a reutilizar: `src/features/catalogo/admin/*` (listado, formulario, fotos, colores, importar), `src/features/inventario/*`, `src/features/auth/*`, `src/lib/exportarVentas.js` (movido en 0.1), `src/app/Layout.jsx` → `LayoutPanel.jsx`.
Principio: **Natali ve en 10 segundos cómo le fue hoy y encuentra cualquier pedido en 2 clics. Nada se borra de verdad.**

### Tarea 7.1 · Login, roles y navegación del panel · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/auth/LoginPage.jsx` (adaptado, en `/administracion`), `AuthProvider` remoto (heredado), `RutaProtegida.jsx`, `src/app/layouts/LayoutPanel.jsx`, `src/app/navegacion.js` (menú del panel por permiso), `src/lib/permisos.js`.
**Alcance**: correo + contraseña, "olvidé mi contraseña" (Supabase Auth), mensajes de error claros, sin registro libre; barra lateral en escritorio y barra inferior en celular (patrón heredado); pantalla de inicio según rol (depósito → productos; encargada → pedidos; admin → inicio).
**Pasos**
- [x] (2026-10-09) 1. `LoginPage`/`LoginRemoto` con texto del panel; `rutaInicio` por rol ya existe (admin → inicio, encargada → pedidos, depósito → productos).
- [x] (2026-10-09) 2. `LayoutPanel`: barra inferior con "Más" ya heredada; verificar que `PANTALLAS` filtra por permiso para cada rol (admin, enc_tienda, enc_deposito) a 390 y 1440 px.
- [x] (2026-10-09) 3. Un usuario sin perfil (intruso) ve mensaje y cierra sesión (ya lo hace `AuthProviderRemoto`; se documenta).
**Criterios de aceptación**
- [x] (2026-10-09) Un usuario de otro proyecto de la instancia compartida no entra (sin perfil → mensaje y cierre de sesión).
**Bloqueos**: ninguno.

### Tarea 7.2 · Inicio del panel · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/panel/inicio/InicioPanelPage.jsx`, tarjetas `VentasHoy`, `PedidosPorEstado`, `PagosPorConfirmar`, `StockBajo`, `GastosDelMes`, `MargenDelMes`; `src/data/repos/*/reportes.js` (consultas agregadas en SQL con `at time zone 'America/La_Paz'`).
**Alcance**: cifras del día y del mes en Bs; listas cortas accionables (clic lleva al pedido); sin gráficos salvo una barra simple de ventas por día del mes (si se agrega, seguir la skill `dataviz`); estados de carga, vacío y error; se recalcula al volver a la pestaña.
**Pasos**
- [x] (2026-10-09) 1. `src/data/repos/{local,remoto}/reportes.js`: `resumenHoy()`, `resumenMes()`, `ventasPorDia(desde, hasta)`, `pedidosPorEstado()`, `pagosPorConfirmar()`, `stockBajo(umbral)`, `gastosDelMes()`; días cortados en La Paz (`lib/fechas.js`); test del local.
- [x] (2026-10-09) 2. `features/panel/inicio/InicioPanelPage.jsx` con tarjetas de cifras y listas cortas accionables; estados de carga/vacío/error.
**Criterios de aceptación**
- [x] (2026-10-09) "Hoy" coincide con el día en Bolivia aunque Facundo mire desde Argentina a las 23:30.
**Bloqueos**: ninguno.

### Tarea 7.3 · Productos y categorías · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/catalogo/admin/*` (heredados) + campos de tienda en `ProductoFormPage.jsx` (precio minorista Bs, precio USD opcional, publicado, destacado, slug editable con vista previa de URL), `CategoriasPage.jsx` (alta, orden por arrastre o botones, renombrar), `ImportarPage.jsx` (columnas nuevas en la plantilla Excel).
**Alcance**: filtros "publicado / no publicado / sin precio minorista / sin stock"; aviso en el listado de productos publicados sin precio; vista previa "cómo se ve en la tienda"; baja lógica.
**Pasos**
- [x] (2026-10-09) 1. `ProductoFormPage.jsx`: campos precio minorista (Bs), publicado en la tienda, destacado, slug con vista previa de URL; aviso si publicado sin precio.
- [x] (2026-10-09) 2. `AdminListado.jsx`: filtros publicado / sin precio / sin stock, precio minorista en la fila, enlace "Ver en la tienda".
- [x] (2026-10-09) 3. `CategoriasPage.jsx` (`/administracion/categorias`): alta, renombrar, orden con botones.
- [x] (2026-10-09) 4. `ImportarPage.jsx`: columnas `precio_unidad_bs`, `publicado` en la plantilla y el importador (+ test).
**Criterios de aceptación**
- [x] (2026-10-09) Natali publica un producto con precio, 3 fotos y 4 colores en menos de 2 minutos.
**Bloqueos**: ninguno.

### Tarea 7.4 · Stock con reservas · 1 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/inventario/*` (heredado), `InventarioPage.jsx` con columna "Reservado" y "Disponible", historial con tipo `reserva` / `venta` / `liberación`.
**Pasos**
- [x] (2026-10-09) 1. `InventarioPage.jsx`: columnas Reservado y Disponible (`stock.resumenDetallado()`), tipos nuevos en el historial.
**Bloqueos**: ninguno.

### Tarea 7.5 · Pedidos · 4 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/panel/pedidos/{PedidosPage, PedidoDetalle, CambiarEstado, PagosPorConfirmar, BotonReimprimir, BotonWhatsApp}.jsx`, `src/lib/whatsapp.js` (mensajes por estado), reutiliza `Ticket.jsx`.
**Alcance**: lista con filtros (estado, origen, medio de pago, rango de fechas en La Paz, texto), orden por fecha, paginación; detalle con ítems, comprador, entrega, pagos, historial; cambio de estado solo a transiciones válidas (botones contextuales: "Marcar en preparación", "Listo para retirar", "Enviado", "Entregado"); confirmar pago en caja / transferencia; cancelar con motivo (libera stock); reembolsar (admin, etapa 5.6); imprimir comprobante A4 y reimprimir ticket 80 mm; WhatsApp con mensaje prearmado según estado ("Tu pedido TN-000123 está listo para retirar…"); exportar a Excel.
**Pasos**
- [x] (2026-10-09) 1. `features/panel/pedidos/PedidosPage.jsx`: filtros (estado, origen, período, texto), lista (tabla en escritorio, tarjetas en celular), paginación simple.
- [x] (2026-10-09) 2. `PedidoDetalle.jsx` (`/administracion/pedidos/:id`): ítems, comprador, entrega, pagos, historial; `CambiarEstado.jsx` con botones contextuales por transición válida y permiso; confirmar pago en caja/transferencia; cancelar con motivo (admin); reembolsar (admin, hace lo local hasta la etapa 5).
- [x] (2026-10-09) 3. `PagosPorConfirmar.jsx` (sección en Pedidos e Inicio); WhatsApp con mensaje por estado (`lib/whatsapp.js`); exportar a Excel (`lib/exportarExcel.js`).
- [x] (2026-10-09) 4. Reimprimir ticket: botón que abre `Ticket.jsx` (versión mínima acá; la térmica real es 6.5).
**Criterios de aceptación**
- [x] (2026-10-09) Encontrar un pedido por código, teléfono o nombre en menos de 2 clics.
**Bloqueos**: ninguno.

### Tarea 7.6 · Gastos · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/panel/gastos/{GastosPage, GastoForm, CategoriasGasto}.jsx`, `src/data/repos/*/gastos.js`, bucket `tienda_comprobantes` (misma Function de subida de 5.5).
**Alcance**: alta rápida (fecha por defecto hoy en La Paz, monto, categoría, descripción, foto opcional); lista por mes con total por categoría; edición y baja lógica; encargada solo carga, admin edita; categorías iniciales genéricas (alquiler, mercadería, envíos, sueldos, servicios, otros) hasta que B-G1 se responda.
**Pasos**
- [x] (2026-10-09) 1. `features/panel/gastos/GastosPage.jsx`: alta rápida (fecha hoy en La Paz, monto, categoría, descripción, foto opcional comprimida), lista por mes con totales por categoría, editar y baja (admin).
- [x] (2026-10-09) 2. `CategoriasGasto.jsx` para admin.
**Criterios de aceptación**
- [x] (2026-10-09) Cargar un gasto desde el celular en 20 s.
**Bloqueos**: B-G1 (no frena).

### Tarea 7.7 · Reportes · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/panel/reportes/ReportesPage.jsx`, `src/data/repos/*/reportes.js`, `src/lib/exportarReportes.js` (sobre `exportarVentas.js` heredado).
**Alcance**: selector de período (hoy, semana, mes, personalizado; `lib/periodos.js` heredado adaptado a La Paz); ventas por día, por categoría, por medio de pago, por origen; productos más vendidos; gastos por categoría; ingresos − gastos = margen; exportar cada tabla a Excel; solo admin.
**Pasos**
- [x] (2026-10-09) 1. `features/panel/reportes/ReportesPage.jsx`: período (hoy, 7 días, mes, personalizado), ventas por día, por categoría, por medio de pago, por origen, más vendidos, gastos por categoría, margen; exportar cada tabla a Excel.
- [x] (2026-10-09) 2. Test: los totales coinciden con la suma de pedidos pagados del período.
**Criterios de aceptación**
- [x] (2026-10-09) Los totales del reporte coinciden con la suma de pedidos pagados del período (test SQL).
**Bloqueos**: ninguno.

### Tarea 7.8 · Configuración y usuarios · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/panel/configuracion/{ConfiguracionPage, SeccionTienda, SeccionSitio (textos de Inicio, Quiénes somos, legales, con vista previa), SeccionEnvios (ciudades y costos), SeccionPagos (proveedor activo, datos bancarios y QR estático; nunca claves), SeccionKiosco (PIN, inactividad, texto del ticket, dispositivos y revocación)}.jsx`, `UsuariosPage.jsx` (alta con correo y rol vía `naty_configurar_usuario`, activar/desactivar).
**Alcance**: cada sección guarda por separado (sin un formulario gigante); validación zod compartida con `lib/sitio.js`; cambios visibles en el sitio al instante (caché invalidada).
**Pasos**
- [x] (2026-10-09) 1. `features/panel/configuracion/ConfiguracionPage.jsx` con secciones que guardan por separado: Tienda (nombre, logo, WhatsApp, umbral de stock, tipo de cambio), Sitio (lema, portada, quiénes somos, cómo comprar, local y horarios, redes, legales), Envíos (ciudades y costos, mínimo de compra, mostrar USD), Pagos (proveedor activo, datos bancarios, QR estático), Kiosco (PIN, inactividad, texto del ticket, dispositivos).
- [x] (2026-10-09) 2. `UsuariosPage.jsx`: lista de perfiles con rol, activar/desactivar, cambio de rol (local: directo; remoto: `naty_perfiles` update por admin); alta explica que el correo se crea en Supabase (hasta tener Function `usuarios-alta`).
**Criterios de aceptación**
- [x] (2026-10-09) Natali cambia el horario del local y el sitio lo muestra sin redeploy.
**Bloqueos**: ninguno.

**Cierre de etapa**: build + lint + tests; axe en todas las pantallas del panel; recorrido por rol (admin, encargada, depósito) con el guion de `../02-roles-y-casos-de-uso.md`; `notas-etapa-7.md`. Pedir autorización Etapa 8.
