# Hallazgos de la Etapa 7

Gravedad: **Bloqueante** (impide vender, imprimir o perder datos) · **Alta** (confunde o frena) · **Media** · **Baja** (detalle).
Estado: Abierto · Corregido · No se corrige (con motivo).

## A. Recorrido automatizado (hecho por Claude, 2026-10-08, celular 390 px, datos de demostración)

Resultado de las verificaciones por rol (todas **OK**):
- PIN incorrecto → mensaje "PIN incorrecto."
- **Vendedor** (Ariel): aterriza en el buscador; menú Inicio/Buscar/Venta/Ventas/Comisiones; `/stock`, `/ajustes` y `/catalogo/admin` bloqueados; ve solo sus ventas (todas `NV-AM-…`); sin "Exportar a Excel".
- **Encargada de depósito** (María): aterriza en Inventario; menú Buscar/Inventario; puede administrar el catálogo; Ventas y Nueva venta bloqueadas.
- **Encargada de ventas** (Jehovana): aterriza en Inicio; ve todas las ventas; puede exportar; no ve "Anular venta"; Inventario bloqueado.
- **Encargada de tienda** (Pamela): aterriza en Inicio; ve el stock y el historial pero **no** puede registrar movimientos ni cargar Excel.
- **Administradora** (Natali): aterriza en Inicio; menú completo (con "Más"); accede a Ajustes.
- Datos de demostración: 37 ventas en 9 días, 2 anuladas, 6 reposiciones; mayoría en dólares; stock sin negativos.
- Antes (etapas 4 a 6, también automatizado): venta completa → nota A5 en PDF de 3, 15 y 40 ítems sin cortar contenido, QR escaneado; modo avión con sincronización al volver la red; accesibilidad axe-core sin infracciones.

| # | Hallazgo | Gravedad | Estado |
|---|---|---|---|
| A1 | Fecha del Inicio: "Jueves, 8 **De** Octubre" (mayúscula en cada palabra) | Baja | Corregido |
| A2 | Inicio, "Por vendedor": cuando una persona vendió en dos monedas el texto se partía y quedaba desalineado respecto de las demás filas | Media | Corregido (ahora cada fila lleva nombre y cantidad arriba, importes debajo) |
| A3 | Selector de orden del catálogo sin nombre accesible; texto gris y botón de WhatsApp con poco contraste | Alta (accesibilidad) | Corregido en etapa 6 |
| A4 | Con la demo, el Inicio muestra "110 colores agotados · 170 con stock bajo": son cifras del catálogo de ejemplo (stock inventado). En el negocio real dependerá del stock cargado | Baja | No se corrige: se revisa cuando Natali cargue su stock real |
| A5 | El catálogo público (`/c`) lee la base del propio dispositivo: hoy un cliente real vería el catálogo de ejemplo | Alta | Abierto: se resuelve en la etapa 8 (Supabase) |

## B. Sesión de prueba con Facundo / Natali en dispositivos reales
*(completar siguiendo [guion-prueba.md](guion-prueba.md))*

| # | Dispositivo | Tarea del guion | Qué esperabas | Qué pasó | Gravedad | Estado |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## C. Pedidos nuevos de Natali / el equipo
| # | Pedido | Prioridad | Decisión |
|---|---|---|---|
|  |  |  |  |
