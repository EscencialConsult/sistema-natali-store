# DESIGN.md — Modas Naty · Tienda online

Reglas nombradas. Los valores viven en `src/styles/tokens.css`; acá se explica el criterio.
Heredado del sistema de notas de venta (misma clienta, mismo kit: decisión D3) y ampliado para tres zonas distintas: **sitio público**, **kiosco táctil** y **panel de administración**. Referencia visual: `docs/referencias/diseno/README.md` (Divas House: editorial, mucho blanco, foto protagonista). Fuente de verdad del kit en el cerebro: `cerebro-facundo/proyectos/modas-naty/kit-de-marca.md`.

## Reglas comunes a las tres zonas
- **Foto protagonista**: en portada, catálogo y ficha la imagen manda; el texto la acompaña. Sin marcos decorativos.
- **Un acento para comprar**: la tinta (`tinta`, que desde el 12/10/2026 es la ciruela de la marca, `#8A3A63`) es el único color de acción, y en cada pantalla hay **un solo botón primario** (Ver catálogo, Agregar al carrito, Pagar, Confirmar). Lo demás es secundario o fantasma. Verde/ámbar/rojo/azul son solo estados; verde WhatsApp solo para WhatsApp.
- **Sin sombras decorativas ni cajas con borde**: la jerarquía sale del espacio, del fondo (`superficie` blanca sobre `fondo` crema) y de líneas finas solo para separar secciones. El borde queda para campos, foco y estado. Única sombra: paneles flotantes (Sheet, Modal, menú).
- **Estado nunca solo por color**: stock, pago, conexión y estado del pedido llevan texto o icono además del color.
- **Precio siempre con moneda**: `Bs 120,00` o `$ 15.000,00`; nunca un número suelto. Cifras con `tabular-nums`. Formateo solo en `lib/moneda.js`.
- **Tres estados siempre**: carga (Skeleton), vacío (EmptyState) y error (ErrorState) en toda pantalla con datos.
- **Sin emojis ni iconos sueltos**: solo `lucide-react`, trazo 1.75, tamaño 18–20 en controles (24 en kiosco).
- **Movimiento con propósito**: solo para explicar un cambio de estado; ≤ 200 ms en acciones frecuentes; respeta `prefers-reduced-motion`. Lo que se usa cien veces por día (grilla, filtros, listados) no se anima.
- **Mayúsculas solo en etiquetas cortas** (categorías, lema); nunca en párrafos.
- **Texto base 16 px** (nunca menos en inputs: iOS hace zoom), títulos de pantalla 24–32 px.
- **Hora de Bolivia**: toda fecha u hora visible sale de `lib/fechas.js` en America/La_Paz.

## Reglas por zona

### Sitio público (celular primero, 390 px; escritorio es ampliación)
- **Cabecera en celular de dos filas**: fila 1 fija (menú, logo centrado, buscar, carrito; 44 px cada control) y fila 2 con los enlaces principales a la vista (Catálogo, Quiénes somos, Contacto), que se va con el scroll. En escritorio: una fila, menú a la izquierda, logo centrado, buscar y carrito a la derecha.
- **El lema de la tienda vive en el pie** (configurable), no en una franja superior.
- **Grilla 2 columnas en celular, 4 en escritorio**; tarjeta con foto 3:4 sin marco, "Nuevo" como texto chico en el acento sobre el nombre, "Sin stock" como etiqueta sobre la foto; nombre y precio debajo, sin botón comprar en la tarjeta (se compra desde la ficha).
- **Pie oscuro** (`pie`) con contacto, horarios, redes y legales.
- **WhatsApp flotante** abajo a la derecha, nunca tapa el botón primario de la pantalla (se oculta en checkout y carrito).
- **Toque cómodo**: 44 × 44 px mínimo.

### Kiosco (táctil, de pie, sin ayuda)
- **Táctil generoso**: controles de **56 px** mínimo (`--control-kiosco`), texto base **18 px** (`--text-kiosco`), separación entre botones de 12 px o más para no tocar dos a la vez.
- **Sin hover, sin tooltips, sin enlaces externos, sin cabecera del sitio.** Pantalla completa.
- **Una decisión por pantalla**: cada paso tiene un título grande y un solo botón primario abajo, a la derecha, siempre en el mismo lugar.
- **Atractor sutil** en Bienvenida (la única animación larga permitida, pausable y sin movimiento con `reduced-motion`).
- **Siempre se puede volver**: botón "Volver" fantasma arriba a la izquierda en todas las pantallas salvo Bienvenida.
- **Vuelve sola**: a los 90 s sin tocar, aviso; a los 105 s, Bienvenida y carrito vacío.

### Panel de administración (escritorio primero, usable en celular)
- **Barra lateral** en escritorio (patrón heredado), **barra inferior** en celular con "Más".
- **Tablas en escritorio, tarjetas en celular**; filtros en una sola fila con `Select` y chips.
- **Cifras primero**: el inicio muestra números del día antes que cualquier lista; sin gráficos salvo que una cifra sola no alcance.
- **Nada se borra de verdad**: baja lógica, cancelación con motivo, historial de estados visible.
- **Guardar por sección**: cada bloque de configuración tiene su propio botón Guardar (heredado de Ajustes).

### Ticket impreso (80 mm, también 58 mm)
- **Negro puro sobre blanco**, sin grises ni tramas: la térmica no imprime medios tonos bien.
- **Una sola familia** (DM Sans) a 11–12 pt; nombre de la tienda en Outfit 600; líneas de ítems con cantidad × precio alineados a la derecha con `tabular-nums`.
- **Separadores con guiones**, no con bordes CSS (algunos drivers los pierden).
- **QR de seguimiento** de 28 mm; nada de datos de tarjeta ni de la pasarela más allá de "aprobado".
- Estilos solo en `src/styles/impresion-ticket.css`, dentro de `@media print` y `@page { size: 80mm auto }`.

## Estructura común de las pantallas del menú (12/10/2026)
Catálogo, Quiénes somos, Contacto y los textos legales comparten el mismo esqueleto, para que cambiar de pestaña no mueva nada.

| Elemento | Regla |
|---|---|
| Encabezado | `EncabezadoPagina`: título `text-3xl md:text-4xl` y bajada en `texto-suave`, alineado a la izquierda del contenedor |
| Punto de partida | Todas arrancan en la misma posición horizontal y vertical (medido: x 124 y y 96 a 1366 px; x 16 en celular) |
| Ancho | El del contenedor del sitio (`max-w-6xl`). Nunca una columna angosta centrada |
| Texto corrido | Medida de lectura `max-w-2xl` **alineada a la izquierda**, con las fotos o tarjetas al costado |
| Excepción | El Inicio tiene portada propia (título de 60 px). Las pantallas de pedido y de pago son transaccionales y van centradas |

## Botones, filtros y campos (12/10/2026)
Una receta por tipo, en `components/ui/estilos.js`; nada de estilos sueltos en las pantallas.

| Elemento | Regla | Por qué |
|---|---|---|
| Botón primario | Relleno en el acento, sin borde, sin icono, `tracking-wide`. Uno por pantalla | El recuadro negro con flecha es lo primero que delata una plantilla |
| Botón secundario | Tonal: `acento-tinte` con texto en el acento. Nunca un recuadro con borde | Los recuadros con borde repetidos en cada acción se leen como genéricos |
| Botón fantasma | Solo texto, fondo en hover | Para acciones de bajo peso (Cancelar, Categorías) |
| Iconos en botones | Solo en botones sin texto (con `aria-label`). Los botones con texto no llevan icono decorativo | El texto ya dice la acción |
| Filtros por categoría | Lista de texto con cantidad en escritorio y pestañas subrayadas en celular. La activa va en el acento y en negrita | Una columna de píldoras con borde, todas iguales, es el patrón más reconocible de IA |
| Chips (colores, recientes) | Tonales, sin borde. Seleccionado: relleno en el acento o anillo de 2 px | Estado visible sin depender solo del color |
| Campos | Relleno tonal (`superficie-2`) y línea inferior de 2 px (`campo`, 3,4:1) | Cumple contraste de componentes sin dibujar una caja |
| Orden | Selector en el encabezado de los resultados, junto a la cantidad de modelos | Estaba al final de la columna lateral, fuera de pantalla |

El kiosco usa los mismos tonos con controles de 56 px.

## Movimiento (decisiones)
| Qué | Propósito | Cómo |
|---|---|---|
| Modal / Sheet (menú, mini carrito, ficha en kiosco) | orientación | fundido + escala 0,96 → 1, 180 ms; en celular sube desde abajo 300 ms (`--ease-cajon`) |
| Aviso (toast) | feedback | fundido + sube 0,5 rem, 200 ms |
| Botón al tocar | feedback | escala 0,97, 150 ms (no en deshabilitado) |
| Agregado al carrito | momento de éxito | el contador del carrito hace un "pop" (escala 1 → 1,2 → 1), 240 ms |
| Cambio de estado del pedido | explicar que cambió | fundido del nuevo estado, 200 ms |
| Atractor de Bienvenida (kiosco) | invitar a tocar | respiración de opacidad 0,7 ↔ 1 cada 2,4 s; se detiene al primer toque |

Reglas: solo `opacity` y `transform`; transiciones (no keyframes) salvo el atractor; nunca `ease-in`; nunca `scale(0)`; con "reducir movimiento" quedan los fundidos. Curvas en `tokens.css`.

## Tipografía
- Títulos: Outfit 600. Cuerpo y cifras: DM Sans. Autoalojadas en `public/fonts` (funcionan sin internet; no se usa el paquete npm porque el `#` de la ruta del proyecto rompe las URLs de fuentes en el build).

## Color (tokens)
| Token | Uso |
|---|---|
| `fondo` / `superficie` / `superficie-2` | fondo de app, tarjetas y paneles, zonas secundarias |
| `borde` / `borde-fuerte` | divisiones, controles |
| `texto` / `texto-suave` / `texto-tenue` | principal, secundario, ayudas |
| `tinta` / `tinta-hover` / `sobre-tinta` | botón primario y su texto |
| `exito`, `alerta`, `error`, `info` (+ `-fondo`) | estados (pedido pagado, pendiente, cancelado, info) |
| `pie` / `sobre-pie` | pie del sitio y texto sobre él |
| `whatsapp` | acción de WhatsApp |

Paleta **crema + ciruela** (12/10/2026), la misma que usa el sistema de nota. Contrastes verificados: ciruela sobre crema 6,9:1 y sobre blanco 7,3:1; texto `#2A2230` sobre crema más de 14:1. La ciruela no se usa como texto sobre el pie oscuro. Se ajusta cuando llegue el logo de la clienta (bloqueo B-S1), cambiando solo `tokens.css`.

## Radios y tamaños
`control` 8 px (botones, inputs) · `tarjeta` 12 px (tarjetas, fotos y paneles) · `pildora` (chips, badges) · `--control-kiosco` 3,5 rem · `--text-kiosco` 1,125 rem.

## Componentes (`src/components/ui/`)
Button, Input, Select, BuscadorLista, Modal, Sheet, Badge, Chip, EmptyState, ErrorState, Skeleton, Toast, Tabs. Nunca `<select>` nativo: `Select` para listas cortas, `BuscadorLista` para largas. Los componentes nuevos de la tienda (tarjeta de pedido, línea de carrito, ticket) se construyen con estos, no al lado.
