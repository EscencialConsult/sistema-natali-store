# Tienda online Modas Naty: estado del proyecto

Actualizado: 9 de octubre de 2026.

**Repositorio:** https://github.com/EscencialConsult/tienda-natali-online. Es privado, de la organización Escencial Consultora, y la rama principal es `main`.

## Dónde está el plan para terminar
| Archivo | Qué tiene |
|---|---|
| `docs/plan/tareas-v1.md` | **Tablero maestro.** Las 10 etapas con cada tarea marcada: hecha, en curso o pendiente. Es el punto de partida |
| `docs/plan/etapa-0.md` … `etapa-9.md` | Detalle de cada etapa: archivos, alcance y criterios de aceptación |
| `docs/plan/PLAN-actualizacion-concordancia.md` | **Plan de actualización.** Corrige los huecos con el sistema de nota (modelo de stock y color, base de datos, usuarios) en 7 etapas, U0 a U6 |
| `docs/plan/DISENO-mejoras-y-prompts-stitch.md` | Diagnóstico de diseño con `anti-ia`, mejoras priorizadas en Tailwind y tokens, y los 3 prompts para Stitch |
| `docs/plan/PLAN-rediseno.md` | Plan del rediseño visual y del panel simplificado. Salió del debate entre Claude, Codex y Gemini |
| `docs/plan/backlog-v1.1.md` | Lo que queda para después de la primera versión |
| `docs/07-preguntas-abiertas-y-bloqueos.md` | Datos que faltan de la clienta (los códigos B-…) |
| `docs/pagos/que-pedir-a-la-empresa.md` | Qué pedirle a la empresa para conectar Mercado Pago |
| `docs/deploy.md` | Cómo publicar en Netlify |
| `docs/entrega-demo.md` | Texto y accesos para compartir la demo |

## Qué es
Es una tienda online para Modas Naty (Bermejo, Bolivia) con tres partes en una sola aplicación:
- **Tienda pública** en `/`: catálogo, carrito y compra sin crear cuenta.
- **Kiosco táctil** en `/kiosco`: el cliente elige en la pantalla del local y sale un ticket térmico de 80 mm.
- **Panel de administración** en `/administracion`: pedidos, productos, stock, gastos, reportes, usuarios y configuración.

El catálogo es el mismo que usa el sistema de nota de venta de Modas Naty, porque comparten la base de datos. Las horas se muestran en hora de Bolivia.

**Tecnologías:**
- React con Vite y Tailwind.
- Supabase para la base de datos.
- Netlify para publicar y para las funciones del servidor.
- Mercado Pago con cuenta argentina, cobrando en pesos argentinos.

## Qué se hizo
| Etapa | Estado | Resumen |
|---|---|---|
| 0 · Base | Hecha | Estructura, kit de marca, tres zonas, datos locales y hora de La Paz |
| 1 · Sitio público | Hecha | Cabecera, menú, pie, inicio, quiénes somos, contacto, legales y página 404 |
| 2 · Catálogo | Hecha | Grilla por categoría, búsqueda, ficha con color y cantidad, mini carrito |
| 3 · Compra | Hecha | Carrito, datos del comprador, pedido con reserva de stock y seguimiento |
| 4 · Servidor | Hecha y aplicada | Esquema `tienda_` aplicado el 12/10 en la instancia compartida "automatizaciones", con rollback de prueba previo. Falta cargar precios y publicar productos |
| 5 · Pagos | **Probado con Mercado Pago real** (cuenta de prueba): compra, pago aprobado y pedido confirmado. Falta el aviso con firma, que necesita el sitio publicado | Cobro con Mercado Pago, aviso de pago firmado y reembolso, probados con pagos simulados. **Faltan las credenciales** |
| 6 · Kiosco | Hecha | Activación por PIN, compra táctil y ticket de 80 mm. **Falta probarlo en el equipo real** |
| 7 · Panel | Hecha | Inicio, pedidos, productos, categorías, gastos, reportes, configuración y usuarios |
| 8 · Pulido | Hecha | Instalable como app, Google, seguridad, accesibilidad y funcionamiento sin conexión |
| 9 · Salida | Pendiente | Prueba con la clienta, dominio, publicación y migración a su cuenta |

**Rediseño en curso** (ver `docs/plan/PLAN-rediseno.md`):
- R1, hecha:
  - El panel muestra una lista de lo que hay que hacer, incluidos los pedidos de meses anteriores.
  - El menú tiene cuatro entradas principales según el rol.
  - Las encargadas ven los productos en modo consulta.
- R2, hecha:
  - El catálogo lee los datos una sola vez y recuerda dónde estabas al volver de una ficha.
  - Las fotos de la demo pasaron a miniaturas: de 17,3 MB a 4,7 MB.
- R3, hecha (12/10): crema y ciruela, cabecera de dos filas en celular, portada sin cajas, tarjetas sin bordes, "Cómo comprar" en una fila y "Nuevo" como texto. Botones tonales sin iconos decorativos, filtros como lista de texto con cantidades, chips y campos rellenos. Capturas del antes y el después en `docs/capturas/duelo/`.
- R4, pendiente: pestañas de Productos y Stock, y revisión por cada rol.
- R5, pendiente: verificación final y capturas del después.

**Calidad, medida el 9 de octubre de 2026:**
- 125 pruebas automáticas pasan.
- La herramienta de accesibilidad axe no encuentra problemas en las pantallas medidas.
- Lighthouse en celular, antes del rediseño:

| Pantalla | Rendimiento |
|---|---|
| Inicio | 85 |
| Catálogo | 61 |
| Ficha de producto | 76 |

  Accesibilidad dio 100 y SEO dio 100 en las pantallas medidas.

## Qué falta para terminar
1. **Terminar el rediseño (R3 a R5).** Es trabajo de desarrollo y no depende de nadie.
2. **Aplicar la base de datos** en Supabase, en la instancia compartida "Automatizaciones". Hace falta que Facundo corra el comando o dé el permiso.
3. **Credenciales de Mercado Pago:** primero las de prueba (cuenta propia de Facundo) y después las de la empresa. Lista en `docs/pagos/que-pedir-a-la-empresa.md`.
4. **Datos de la clienta:**
   - Logo, textos y datos del local.
   - Precios minoristas y qué productos publicar.
   - Envíos.
   - Una foto limpia por producto y una foto de portada.
   - Revisión de los textos legales.
5. **Equipo del kiosco:** modelo de la pantalla táctil y de la impresora térmica, para la prueba real.
6. **Salida (Etapa 9):** sesión de prueba con la clienta, dominio, publicación en Netlify y pase a la cuenta de Supabase de la clienta.

## Moneda y tipo de cambio
La tienda muestra todo en bolivianos y en pesos argentinos. La conversión Bs/pesos (inicial 5 Bs = 1 ARS) la carga la administración en Configuración, Moneda, y se propaga sola (ver estrategia en el doc); Mercado Pago y la transferencia cobran en pesos, y el efectivo puede ser en Bs o pesos. Reglas completas en `docs/pagos/moneda-y-tipo-de-cambio.md`.

## Cómo ver la pasarela de pago hoy
En modo demo, "Pagar ahora" lleva a una pantalla de pago de prueba (`/pago-prueba/<código>`) con resumen, medios de pago y los resultados aprobado o rechazado. Con Mercado Pago conectado, ese mismo botón redirige a la pasarela real. Captura en `docs/capturas/pasarela-prueba.png`.

## Accesos de la demo
| Zona | Dirección | Acceso |
|---|---|---|
| Tienda | `/` | libre |
| Panel | `/administracion` | usuario Natali, Pamela Aramayo o María Córdoba · PIN `0000` |
| Kiosco | `/kiosco` | PIN de activación `2468` |

Estos PIN existen solo en modo demo. En Netlify, la demo se publica con la variable `VITE_MODO_DEMO=1`.
