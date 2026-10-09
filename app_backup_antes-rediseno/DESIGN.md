# DESIGN.md — Modas Naty

Reglas nombradas. Los valores viven en `src/styles/tokens.css`; acá se explica el criterio.
Referencia visual: `Docs/referencias/diseno/README.md` (Divas House: editorial, mucho blanco, foto protagonista).

## Reglas

- **Foto protagonista**: en catálogo y ficha la imagen manda; el texto la acompaña. Sin marcos decorativos.
- **Un solo acento**: la tinta (`tinta`, casi negro) es el único color de acción. Verde/ámbar/rojo/azul son solo estados (éxito, alerta, error, info), nunca decoración. Excepción: verde WhatsApp para la acción de WhatsApp.
- **Sin sombras decorativas**: la jerarquía sale de bordes finos (`borde`) y espacio. Única sombra permitida: paneles flotantes (Sheet, Modal, menú desplegable) para separarlos del fondo.
- **Celular primero**: se diseña a 390px; escritorio es una ampliación. Sin scroll horizontal.
- **Toque cómodo**: todo control tocable mide al menos 44×44px.
- **Estado nunca solo por color**: stock, conexión y sincronización llevan texto o icono además del color.
- **Dinero legible**: cifras con `tabular-nums`; la moneda siempre visible; USD primero, Bs último.
- **Tres estados siempre**: toda pantalla con datos tiene carga (Skeleton), vacío (EmptyState) y error (ErrorState).
- **Sin emojis ni iconos sueltos**: iconos solo de `lucide-react`, trazo 1.75, tamaño 18–20 en controles.
- **Movimiento con propósito**: animación solo para explicar un cambio de estado; ≤200 ms en acciones frecuentes; respeta `prefers-reduced-motion`.
- **Mayúsculas solo en etiquetas cortas** (categorías, lema); nunca en párrafos.

## Movimiento (decisiones)
Criterio: solo se anima lo que aparece de vez en cuando; lo que se usa decenas de veces por día (búsqueda, resultados, carrito, navegación) **no se anima**.

| Qué | Propósito | Cómo |
|---|---|---|
| Modal | orientación (aparece, no "salta") | fundido + escala 0,96 → 1, 180 ms, `--ease-salida` |
| Hoja inferior (celular) | de dónde viene y a dónde vuelve | sube desde abajo y sale por el mismo camino, 300 ms, `--ease-cajon` |
| Aviso (toast) | feedback | fundido + sube 0,5 rem, 200 ms |
| Botón al tocar | feedback | escala 0,97, 150 ms (no en deshabilitado) |
| Check de "venta guardada" | momento de éxito | fundido + escala 0,8 → 1, 240 ms |

Reglas: solo `opacity` y `transform`; transiciones (no keyframes) para que se puedan interrumpir; nunca `ease-in`; nunca `scale(0)`; con "reducir movimiento" quedan los fundidos y se quita el desplazamiento y la escala. Curvas en `tokens.css` (`--ease-salida`, `--ease-cajon`). Implementación en `index.css` (capa `components`).

## Tipografía
- Títulos: Outfit 600. Cuerpo y cifras: DM Sans. Autoalojadas en `public/fonts` (funcionan sin internet; no se usa el paquete npm porque el `#` de la ruta del proyecto rompe las URLs de fuentes en el build).
- Texto base 16px (nunca menos en inputs, para que iOS no haga zoom), títulos de pantalla 24–32px, de ficha 28–40px.

## Color (tokens)
| Token | Uso |
|---|---|
| `fondo` / `superficie` / `superficie-2` | fondo de app, tarjetas y paneles, zonas secundarias |
| `borde` / `borde-fuerte` | divisiones, controles |
| `texto` / `texto-suave` / `texto-tenue` | principal, secundario, ayudas |
| `tinta` / `tinta-hover` / `sobre-tinta` | botón primario y su texto |
| `exito`, `alerta`, `error`, `info` (+ `-fondo`) | estados |
| `pie` | superficie oscura si hace falta contraste |
| `whatsapp` | acción de WhatsApp |

Paleta **provisoria**: se ajusta cuando llegue el logo de la clienta (bloqueo B2).

## Radios
`control` 8px (botones, inputs) · `tarjeta` 4px (tarjetas de producto, fiel a la referencia) · `pildora` (chips, badges).

## Componentes (`src/components/ui/`)
Button, Input, Select, BuscadorLista, Modal, Sheet, Badge, Chip, EmptyState, ErrorState, Skeleton, Toast, Tabs.
Nunca `<select>` nativo: `Select` para listas cortas, `BuscadorLista` para largas.
