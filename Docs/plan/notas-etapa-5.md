# Notas de cierre — Etapa 5: Historial, inventario y comisiones (2026-10-08)

Verificación: lint sin avisos · build OK · 42 tests · recorrido manual en celular (historial, anulación, inventario con validación, comisiones).
**Tarea 5.3 (cálculo de comisión) queda bloqueada por B1**: no se implementó la regla porque llegó incompleta ("solo se vende por docena o …").

## 5.1 Historial de ventas (`/ventas`)
- Vendedor ve "Mis ventas"; admin y encargadas con `ventas.ver_todas` ven todas. El filtro por vendedor se fuerza en el servidor de datos, no solo en pantalla.
- Períodos (Hoy / 7 días / Este mes / Todo) + filtros: vendedor, moneda (USD primero), forma de pago, envío (por enviar / enviada / con problema), estado (activas / anuladas), fechas desde-hasta. "Limpiar filtros".
- Totales por moneda (cada moneda por separado, sin mezclar; las anuladas no suman). Cuenta de ventas activas.
- Lista por tandas de 30 con "Ver más". Estados de carga, vacío y error.
- **Exportar a Excel** (permiso `ventas.exportar`): hoja "Ventas" y hoja "Detalle", importes numéricos. Test: los totales del Excel coinciden con los de la pantalla.
- **Anular** (solo admin, desde la nota): pide motivo, deja la nota marcada (no se borra), devuelve las prendas al inventario (probado: 24 → 48) y la anulación entra a la cola de sincronización. La nota impresa lleva marca de agua "ANULADA".

## 5.2 Inventario (`/stock`)
- Resumen (prendas, colores con stock bajo, colores agotados) y lista por producto con filtros "Con stock bajo" / "Con colores agotados" y búsqueda.
- Al tocar un producto: stock por color, **registrar movimiento** (entrada, salida con motivo obligatorio y sin pasarse del stock, ajuste por conteo real) y **historial** con fecha, usuario y motivo. Solo con permiso `stock.mover` (admin y encargada de depósito); el resto ve el stock sin poder modificarlo.
- **Cargar stock desde Excel** (`/stock/importar`): se descarga la planilla con el stock actual, se corrige la columna "unidades" con el conteo real y se sube; vista previa por fila (ajusta / sin cambio / error) y se registran ajustes con historial. Una fila con error no frena las demás ni bloquea a una fila válida repetida.
- Alerta de color agotado: ya estaba en la ficha y el buscador (etapa 3); el stock negativo se muestra tal cual (se puede vender sin stock con confirmación).

## 5.3 Comisiones (`/comisiones`) — pantalla sin cálculo
- Muestra por persona: cantidad de ventas y total vendido por moneda en el período. La columna **Comisión dice "Pendiente de definir la regla"**.
- Un vendedor solo ve lo suyo; admin y enc. de ventas ven todos.
- **Para destrabar**: Natali debe completar la regla (¿se paga por docena vendida?, ¿porcentaje del total?, ¿escalones?, ¿por moneda?) y confirmar 3 ejemplos con números. Con eso: `Docs/07-regla-comisiones.md` + `lib/comisiones.js` (función pura con tests) + completar esta pantalla (~3 h).

## Hallazgos corregidos en el camino
- Una fila de stock con error "reservaba" el color y hacía fallar como repetida a la siguiente fila válida.
- El importe de la tarjeta de venta se partía en dos líneas en 390px.

## A tener en cuenta
- Las ventas de prueba que se hicieron en el navegador (incluida una de 40 ítems) dejaron stock negativo en algunos colores: es de la base de pruebas del navegador, no del seed.
- Pruebas con impresora, Android y iPhone reales: etapa 7.
- Bloqueos abiertos: B1 comisión · B2 logo · B3 teléfonos reales · B4 URL real del catálogo · B5 tipo de cambio · B6 permisos · B7 formato de carga masiva.
