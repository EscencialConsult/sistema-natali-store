# Modas Naty — Tienda Online · Documentación

Carpeta viva del proyecto. Todo lo que se sabe del proyecto está acá; el código está en `../app/`.

## Índice

| Archivo | Contenido |
|---|---|
| [01-vision-y-alcance.md](01-vision-y-alcance.md) | Qué es la tienda, qué no es, y en qué se diferencia del sistema de notas de venta |
| [02-roles-y-casos-de-uso.md](02-roles-y-casos-de-uso.md) | Actores (compradora, kiosco, encargada, administradora, depósito) y sus casos de uso |
| [03-sistemas-y-caracteristicas.md](03-sistemas-y-caracteristicas.md) | Los 7 sistemas de la plataforma y la lista completa de características |
| [04-arquitectura.md](04-arquitectura.md) | Stack, estructura de carpetas, modelo de datos, estados del pedido, zona horaria, decisiones |
| [05-pagos.md](05-pagos.md) | Pasarela de pago: Mercado Pago con la skill pagokit, adaptador de proveedor, webhook, bloqueo Bolivia |
| [06-kiosco-e-impresion.md](06-kiosco-e-impresion.md) | Modo kiosco táctil y ticket en impresora térmica de 80 mm |
| [07-preguntas-abiertas-y-bloqueos.md](07-preguntas-abiertas-y-bloqueos.md) | Lo que falta definir con Natali y con Facundo antes de cada etapa |
| [plan/tareas-v1.md](plan/tareas-v1.md) | **Tablero**: 10 etapas con sus tareas y estado. Detalle en `plan/etapa-N.md`, reglas en `plan/_comun.md` |
| [referencias/](referencias/) | Análisis de diseño de la referencia (Divas House), `DESIGN.md` del sistema de nota y plan de rediseño "de tienda" |

## De dónde viene
Nace el 2026-10-09 como segundo producto para la misma clienta. El primero es el **sistema de notas de venta + catálogo** (`../SISTEMA DE NOTA/`, repo `EscencialConsult/sistema-natali-store`, deploy `sistema-natali-store.netlify.app`). De ahí se clonó la app completa (kit de marca, componentes UI, repositorios, catálogo, Supabase) y de ahí se toma la lógica del catálogo. Lo que **no** se hereda: nota de venta A5, comisiones, usuarios vendedores, numeración de notas.

Nota del cerebro: `cerebro-facundo/proyectos/modas-naty/proyecto.md` (sección "Tienda online").

## Estado (2026-10-09)
- **Etapas 0 a 3 cerradas** (notas en `plan/notas-etapa-N.md`): la tienda se recorre de punta a punta con datos locales (Hito A listo para mostrar a Natali). La Etapa 4 (backend) está escrita y probada en memoria; falta que Facundo aplique el esquema en la instancia compartida. La Etapa 7 (panel de administración completo) está cerrada. La Etapa 6 (kiosco) está cerrada salvo la prueba en el equipo real. La Etapa 8 (pulido) está cerrada con una salvedad: rendimiento móvil de catálogo y ficha por debajo de 90 (ver `plan/notas-etapa-8.md`). Quedan 5 (pagos, necesita credenciales de Mercado Pago) y 9 (salida).
- La app corre en modo prueba (sin servidor) con el sitio público, el kiosco (solo activación) y el panel heredado (productos, inventario, configuración).
- Pasarela: Mercado Pago con cuenta argentina (cobro en ARS), decisión de Facundo; ver `05-pagos.md`.
- Repo GitHub: https://github.com/EscencialConsult/tienda-natali-online (privado).
