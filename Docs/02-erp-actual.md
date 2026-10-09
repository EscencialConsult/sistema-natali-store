# ERP actual (demo)

- Archivo: `../HTML-DEMO.html` (~144 KB, un solo HTML con JS embebido)
- Online: https://plataformventas.netlify.app/
- Título: "Modas Naty · Notas de venta"
- Persistencia actual: **localStorage / sin backend** (no se detectó Supabase/Firebase). Hay estados de conexión ("Conectado / Conexión lenta / Sin conexión") y estado de venta "Sincronizada / Pendiente" → ya hay una idea de cola offline.

## Pantallas / funciones detectadas
- Dashboard: ventas por vendedor (hoy), stock bajo/agotado, últimas ventas.
- Nueva venta: moneda de la venta, producto, agregar, método de pago (Efectivo / Transferencia), confirmar.
- Nota de venta: imprimir/guardar PDF, compartir por WhatsApp.
- Ventas: filtros (vendedor, moneda, pago, sincronizada/pendiente), exportar a Excel; el vendedor ve "Mis ventas", el admin ve todas.
- Inventario: movimientos de stock (entrada / salida-merma), historial.
- Comisiones: cantidad de ventas y total vendido por moneda.
- Roles: admin vs vendedor (`can('venta')`).

## Pendiente de revisar a fondo
- Orden actual de monedas (hay que poner USD primero).
- Cómo calcula hoy la comisión.
- Cómo y dónde sincroniza las ventas "pendientes".
