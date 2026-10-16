# Tienda online Modas Naty — contexto para IA

Leer primero `../docs/README.md` (índice) y `../docs/plan/_comun.md` (reglas). Método de trabajo: skill `metodo-etapas-tareas`; tablero en `../docs/plan/tareas-v1.md`. No arrancar una etapa sin autorización de Facundo.

## Lo que no se infiere del código
- **Tres zonas en una app**: sitio público en `/`, kiosco táctil en `/kiosco` (dispositivo activado con PIN, sin sesión de persona), panel en `/administracion` (su raíz ES el login). Cada zona tiene su layout en `src/app/layouts/` y se carga por separado.
- **Catálogo compartido** con el sistema de notas de venta de la misma clienta (`../../SISTEMA DE NOTA/`): mismas tablas `naty_*` en Supabase, mismos roles (`admin`, `enc_tienda`, `enc_ventas`, `enc_deposito`; `vendedor` sin acceso acá). Los campos de tienda del producto (`precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug`) conviven con los del sistema de nota. Nunca editar el esquema `naty_` desde este repo salvo agregando al final, idempotente (tarea 4.1).
- **Pantallas → repositorios → base.** Nada importa `db.js` ni Supabase; todo pasa por `src/data/repos/index.js` y `src/data/hooks.js`. Qué es real y qué es seed: `src/data/README.md`.
- **Dinero en centavos enteros**; la tienda vende en **Bs**; el pago en línea con **Mercado Pago (cuenta argentina) es en ARS** con el tipo de cambio copiado en el pedido. Formateo solo en `src/lib/moneda.js`.
- **Fechas solo con `src/lib/fechas.js`**, siempre en **America/La_Paz** (Facundo trabaja desde Argentina: "hoy" es el de Bolivia).
- **Estados del pedido** y transiciones válidas en una sola tabla: `src/lib/pedido.js`. Reserva de stock al crear el pedido (movimiento `reserva`), venta al confirmar el pago, liberación al cancelar o vencer.
- **El pedido se marca pagado solo por el webhook verificado** (etapa 5) o por la encargada (caja / transferencia). La vuelta del navegador no decide nada.
- **Diseño**: solo tokens (`src/styles/tokens.css`) y reglas de `DESIGN.md`; kiosco con controles de 56 px; ticket en negro puro.
- **Secretos**: nunca en `VITE_*`. Claves de Mercado Pago y `service_role` solo en variables de Netlify (functions).

## Cómo correr
La ruta del proyecto tiene `#` y rompe Vite: trabajar desde la unidad `R:` (`../iniciar-dev.bat` la monta). Tests: `npx vitest run --root R:\app`. Build: `npx vite build`. Lint: `npx oxlint src`.
