# Preguntas abiertas y bloqueos

Marcas: `[!]` bloquea una etapa · `[?]` pregunta que conviene cerrar pero no frena.

## Bloqueos (se destraban con Natali salvo que diga Facundo)
| # | Bloqueo | Etapa que frena | Quién |
|---|---|---|---|
| B-P1 `[x]` | Resuelto 2026-10-09: Mercado Pago con **cuenta argentina**, cobro en ARS (zona de frontera). Falta: credenciales de prueba y producción de esa cuenta, y confirmar si además acepta transferencia en Bs con comprobante | 5 | Natali |
| B-K1 `[!]` | Marca, modelo y sistema operativo del equipo kiosco con impresora (Windows o Android), ancho de papel (58 / 80 mm), USB o red | 6 | Natali / proveedor del equipo |
| B-C1 `[!]` | Precio **minorista por unidad en Bs** de cada producto (el sistema de nota solo tiene precio por docena en USD). ¿Se carga a mano o se deriva (docena USD × tipo de cambio ÷ 12 + margen)? | 2 | Natali |
| B-C2 `[!]` | Qué productos se publican en la tienda (todos o una selección) | 2 | Natali |
| B-E1 `[!]` | Envíos: ¿solo retiro en tienda? ¿Envío dentro de la ciudad (cuál) y a otras ciudades? Costos y plazos | 3 | Natali |
| B-S1 `[!]` | Textos e imágenes de Inicio y Quiénes somos; logo en buena calidad (es el mismo B2 del sistema de nota) | 1 | Natali |
| B-S2 `[!]` | Dirección del local, horarios, WhatsApp de la tienda, redes | 1 | Natali |
| B-N1 `[?]` | Cómo se avisa a la compradora que el pedido está confirmado: WhatsApp manual desde el panel (gratis, hoy), correo automático (Resend, cuenta de Escencial), o WhatsApp automático (API paga) | 5 | Facundo |
| B-L1 `[?]` | Textos legales (términos de compra, cambios y devoluciones, privacidad). ¿Natali tiene política de cambios? | 8 | Natali |
| B-G1 `[?]` | Categorías de gasto que usa Natali hoy (alquiler, mercadería, envíos, sueldos, otros) | 7 | Natali |
| B-D1 `[?]` | Dominio: ¿compra uno (`modasnaty.com.bo` / `.com`) o usa subdominio de Netlify al principio? | 9 | Natali + Facundo |

## Decisiones de Facundo (2026-10-09)
1. **D4 Catálogo compartido**: sí, la tienda usa el mismo modelo y las mismas tablas de productos que el sistema de nota (Natali carga cada modelo una sola vez).
2. **D2 Serverless**: Netlify Functions.
3. **D3 Paleta**: tokens actuales del sistema de nota.
4. **GitHub**: sí, `EscencialConsult/tienda-natali-online`, se sube la carpeta completa.

## Preguntas para Facundo (pendientes)
5. **Un repo o dos**: hoy `SISTEMA DE NOTA` y `TIENDA ONLINE` son carpetas hermanas con apps separadas que comparten base. Alternativa: monorepo con `packages/ui` compartido. Propuesta: **dos repos** por ahora (menos fricción), y si el kit de marca cambia se replica a mano en `tokens.css` + `components/ui`.
6. **Notificaciones (B-N1)**: ¿Resend con la cuenta de Escencial para correos de confirmación?
7. **Cuenta de Mercado Pago de prueba**: ¿se usa una cuenta de Escencial para desarrollar en sandbox mientras Natali define la suya?

## Supuestos tomados mientras no haya respuesta (se corrigen sin costo)
- Moneda de la tienda: precios en **Bs** y **ARS** (tipo de cambio configurable); el pago en línea con Mercado Pago es en ARS; USD solo como referencia.
- Retiro en tienda siempre disponible; envío configurable por ciudad.
- Compra mínima: sin mínimo.
- Reserva de stock: 30 min para pago en línea, 24 h para transferencia con comprobante, hasta cierre del día para pago en caja.
- Ticket de 80 mm; se adapta a 58 mm con una variable CSS.
- Idioma: español (Bolivia). Fechas y horas: America/La_Paz.
