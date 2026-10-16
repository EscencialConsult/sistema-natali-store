# Notas de cierre — Etapa 0: Fundaciones (2026-10-09)

Verificación: lint sin avisos · build OK (paquete del sitio 384 KB, panel y kiosco en paquetes aparte) · 60 pruebas en 8 archivos · pruebas de fechas corridas con `TZ=America/Argentina/Buenos_Aires` y con `TZ=UTC`.

## Decisiones aplicadas
- D2 Netlify Functions (carpeta y `netlify.toml` listos; las functions se escriben en la etapa 4).
- D3 tokens actuales del sistema de nota, con tokens nuevos para el kiosco (`--spacing-control-kiosco`, `--text-kiosco`) y `sobre-pie`.
- D4 catálogo compartido: los roles del panel son los de la base compartida; `vendedor` queda sin acceso. Los campos de tienda del producto (`precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug`) se sumaron al esquema zod y al seed (valores de ejemplo, bloqueo B-C1).
- Pasarela: Mercado Pago con cuenta argentina, cobro en ARS; el pedido guarda moneda y tipo de cambio.
- GitHub: `EscencialConsult/tienda-natali-online` (privado), rama `main`.

## 0.1 Inventario de la poda
| Se fue | Por qué |
|---|---|
| `features/nota`, `features/comisiones`, `features/ventas`, `features/dashboard` | lógica de notas de venta y vendedores; no existe en la tienda. `DescargaOffline.jsx` se rescató a `features/catalogo/` (sirve al kiosco) |
| `data/demo`, `ajustes/DatosDemo.jsx`, `app/Muestra.jsx` | demo de ventas |
| `data/repos/local/ventas.js`, `useVentas`, bloque de ventas en `sync/remoto.js` y `sync/cola.js` | idem |
| `data/remoto/*.test.js`, `supabase/naty_schema.sql`, `usuarios.ejemplo.sql`, scripts de esquema | el esquema `naty_` vive en el sistema de nota (D4); acá vuelve en la etapa 4 como `tienda_schema.sql` con sus pruebas |
| `src/App.jsx`, `App.css`, `assets/` | restos de la plantilla de Vite |
| Textos "nota de venta", "vendedor", secciones de teléfonos y QR en Ajustes, botón "Agregar a venta" en la ficha | no aplican |

Se conservó: componentes `ui/`, catálogo (buscador, grilla, ficha, galería, admin de productos, carga masiva), inventario, auth (local y remota), sincronización del catálogo, PWA, utilidades (`codigo`, `imagen`, `moneda`, `offline`, `permisos`, `stock`).

## 0.2 Kit de marca
`DESIGN.md` nuevo con reglas por zona (sitio, kiosco, panel, ticket) y tabla de movimiento. Nota fuente de verdad en `cerebro-facundo/proyectos/modas-naty/kit-de-marca.md`. `styles/impresion-ticket.css` con `@page 80mm`.

## 0.3 Tres zonas y rutas
`layouts/LayoutSitio` (cáscara mínima: la cabecera y el pie reales son la 1.1), `LayoutKiosco`, `LayoutPanel` (el layout heredado). Todas las rutas de `../04-arquitectura.md` resuelven: las que no existen todavía muestran `PantallaPendiente` con la etapa que las construye. `/catalogo` usa por ahora el catálogo público heredado. Rutas internas del panel reapuntadas a `/administracion/...`. `RutaKiosco` exige dispositivo activado.

## 0.4 Repositorios nuevos (locales) y seed
`carrito`, `pedidos` (código `TN-000001`, reserva de stock con vencimiento, historial, confirmación de pago, cancelación, vencimiento automático, consulta pública), `pagos` (simulado), `gastos` (+ categorías genéricas), `sitio` (textos con valores por defecto marcados `provisorio`), `kiosco` (PIN local `2468`). Transiciones en `lib/pedido.js`. Tabla de mocks activos en `app/src/data/README.md`. Movimientos de stock nuevos: `reserva`, `liberacion`, `devolucion` (conviven con los del sistema de nota en la misma tabla).

## 0.5 Fechas y moneda
`lib/fechas.js` reescrito con `timeZone: 'America/La_Paz'` y `hourCycle: 'h23'` (es-BO mostraba "10:30 p. m."); `diaLaPaz`, `inicioDelDia`, `inicioDelMes`, `fechaHoraTicket`. `periodos.js` sobre esa base. `MONEDA_TIENDA = 'bs'` y `formatear` en Bs por defecto.

## 0.6 Contexto y entorno
`app/CLAUDE.md` (corto), `app/README.md`, `.env.example`, `netlify.toml` (functions, `TZ`), `iniciar-dev.bat` (avisa que comparte la letra `R:` con el sistema de nota).

## Queda afuera a propósito
- Base de datos del sistema `modas-naty-tienda` en IndexedDB: nombre distinto al del sistema de nota para que no se pisen en `localhost`.
- `sync/remoto.js` no sabe enviar pedidos, gastos ni sitio: con servidor configurado la cola daría "operación desconocida"; se completa en la etapa 4 (hoy no hay `.env.local`, así que no afecta).
- `BuscadorPage` y `CatalogoPublico` heredados siguen mostrando precio por docena en USD; el precio minorista en Bs entra en la etapa 2.
- Íconos PWA y logo siguen siendo los provisorios "MN".

## Aprendizajes
- zod 4: `.default({})` en un objeto anidado devuelve `{}` tal cual, sin aplicar los defaults internos; para eso es `.prefault({})`. Y `.refine()` no deja hacer `.extend()` después: se separa el objeto base.
- vitest en la unidad `subst` necesita `--root R:\app` cuando se lanza desde PowerShell (resolvía los archivos desde `/`).
