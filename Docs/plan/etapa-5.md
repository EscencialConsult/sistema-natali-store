# Etapa 5 — Historial de ventas, inventario y comisiones (14 h)
Leer: `_comun.md`, `../02-erp-actual.md`.

### Tarea 5.1 · Historial de ventas · 4 h
Estado: [ ]
**Pasos**
- [ ] 1. Listado con tarjetas en celular / tabla en escritorio. Vendedor ve "Mis ventas"; admin/encargadas ven todas (permisos).
- [ ] 2. Filtros: vendedor, moneda (USD primero), método de pago, estado de sincronización, rango de fechas; "Limpiar filtros".
- [ ] 3. Detalle de venta + reimprimir nota + WhatsApp.
- [ ] 4. Anular venta (solo admin, con motivo): revierte stock con un movimiento, no borra la fila.
- [ ] 5. Exportar a Excel (lo filtrado) con `xlsx`.
- [ ] 6. Totales por moneda (nunca sumar monedas distintas entre sí).
- [ ] 7. Estados carga/vacío/error y paginación por tandas.
**Criterios de aceptación**
- [ ] Los totales por moneda coinciden con la suma de las ventas listadas (test).

### Tarea 5.2 · Inventario y movimientos · 5 h
Estado: [ ]
**Pasos**
- [ ] 1. Vista por producto/color con stock actual (calculado de movimientos) y alertas stock bajo/agotado (umbral configurable).
- [ ] 2. Registrar movimiento: entrada, salida (merma/ajuste), con motivo y usuario. Permiso: enc. depósito y admin.
- [ ] 3. Historial de movimientos por producto, incluyendo los generados por ventas y anulaciones.
- [ ] 4. Carga de stock inicial desde Excel (reutiliza el importador de 3.5).
- [ ] 5. Alerta en el buscador/ficha cuando un color está agotado.
- [ ] 6. Prueba: vender 2 docenas y ver el descuento; anular y ver la devolución.

### Tarea 5.3 · Comisiones · 5 h
Estado: [!] Bloqueada por B1 (regla de comisión incompleta: "solo se vende por docena o …").
**Pasos (cuando se destrabe)**
- [ ] 1. Documentar la regla exacta de Natali en `../07-regla-comisiones.md` con 3 ejemplos numéricos que ella confirme.
- [ ] 2. Implementar el cálculo como función pura en `lib/comisiones.js` (centavos enteros, por moneda) con tests que reproduzcan los ejemplos.
- [ ] 3. Pantalla: comisión por vendedor y período; cada vendedor ve solo la suya; detalle por venta.
- [ ] 4. Exportar a Excel y total por moneda.
- [ ] 5. Qué pasa con una venta anulada (descuenta de la comisión).
- [ ] 6. Mostrar al vendedor su comisión del día en la pantalla de éxito de venta (opcional, pedir a Natali).
**Mientras tanto**: dejar la pantalla con la estructura y un cálculo marcado "provisional", sin inventar la regla.

**Cierre de etapa**: coherencia ventas↔stock↔comisión probada con un caso completo; build+lint+tests. Pedir autorización Etapa 6.
