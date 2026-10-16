# Diseño: qué mejorar y prompts para Stitch

Creado el 12 de octubre de 2026. Es el paso previo a R3 del `PLAN-rediseno.md`: primero se diagnostica con la skill `anti-ia`, después se redactan los prompts, y recién con el resultado se toca el código.

## 1. Método que se respeta
El sistema se construye con Tailwind y tokens. Medido hoy: 152 líneas de CSS propio contra 1075 usos de clases, y 4 estilos en línea.

| Regla | Qué significa |
|---|---|
| Los valores viven en `src/styles/tokens.css` | Colores, tipografías, radios y curvas. Un cambio de marca se hace ahí y se propaga solo |
| Todo lo demás son clases de Tailwind | Cada mejora de este documento se escribe como utilidades sobre los componentes que ya existen |
| No se agregan hojas de estilo | Solo quedan `tokens.css`, `fuentes.css`, `impresion-ticket.css` e `index.css` (base) |
| Estilo en línea solo para datos | Por ejemplo el color hexadecimal de un producto |
| No se toca la lógica | Pedidos, stock y pagos no cambian |

## 2. Diagnóstico con la checklist de `anti-ia`
| Patrón | Evidencia en el código | Estado |
|---|---|---|
| Gradiente en bordes, glow, texto con degradé | No hay | Bien |
| Sombra o brillo en reposo | Reglas de `DESIGN.md`: sin sombras decorativas | Bien |
| Tarjetas oscuras en grilla | No hay | Bien |
| Bordecito de color de un solo lado | No hay | Bien |
| **Todo en cajas de borde fino** | Portada, categorías, productos, "Cómo comprar", "Nuestra tienda" y paneles llevan `border border-borde` sobre fondo gris | **Corregir** |
| **Pasos con número en círculo negro** | `ComoComprar.jsx`: círculo `bg-tinta` con número, en tres tarjetas iguales | **Corregir** |
| **Portada partida con botón negro y flecha** | `Portada.jsx`: texto a la izquierda, foto a la derecha, botón con flecha | **Corregir** |
| **Cuadros vacíos que parecen rotos** | `Categorias.jsx`: tarjeta por categoría aunque no cargue la foto | **Corregir** |
| **Insignia en todo lo nuevo** | `ProductoCard.jsx`: píldora negra "Nuevo" repetida en "Nuevos ingresos" | **Corregir** |
| **Paleta sin acento de marca** | `tokens.css`: gris, negro y blanco. El único color es de estados | **Corregir** |
| Insignias por dato en el panel | `AdminListado.jsx`: estado, precio Bs, precio USD, ícono lápiz y fotos en cada fila | Simplificar |
| Tarjetas de cifras iguales | Ya reemplazadas por tres cifras grandes en R1 | Hecho |
| Mismo radio y borde en todo | `rounded-tarjeta` 4 px en todo menos botones | Corregir |

Resultado: no hay "efectos de IA" fuertes. El problema es de **monotonía**, es decir que todo se ve igual de plano, con las mismas cajas y sin un color que identifique a la marca.

## 3. Mejoras priorizadas, y cómo se hacen con Tailwind y tokens
| # | Mejora | Cómo se implementa |
|---|---|---|
| M1 | Un acento de marca | En `tokens.css`: `--color-acento: #8a3a63`, `--color-acento-hover: #732f52`, `--color-acento-tinte: #f6e8ef`. Sirve para botón principal, enlace activo y marca. El precio queda en texto oscuro. Contraste sobre crema 6,87:1 |
| M2 | Fondo crema y superficies sin borde | `--color-fondo: #fbf7f3`. En tarjetas, quitar `border border-borde` y usar `bg-superficie` con `rounded-2xl`. El borde queda solo para campos, foco y estado |
| M3 | Menos cajas, más aire | En portada, categorías, "Cómo comprar" y "Nuestra tienda": secciones sin marco, separadas por `gap-12 md:gap-16` y por títulos. Una sola capa de tarjeta donde haya que agrupar |
| M4 | Portada con foto y título propios | Bloque tipográfico grande, sin la caja, y una franja de 3 o 4 productos destacados. No se superpone texto a las fotos porque son flyers con texto propio |
| M5 | Categorías solo con foto, deslizables | `flex overflow-x-auto snap-x`, tarjetas `snap-start`, la última asoma cortada para invitar a deslizar |
| M6 | "Cómo comprar" sin tarjetas | Una fila de 3 frases con número chico en acento, `text-sm`, separada por una línea fina |
| M7 | "Nuevo" como texto | En `ProductoCard.jsx`: `text-xs font-medium text-acento` sobre la foto o junto al nombre, sin píldora |
| M8 | Cabecera estable | Fila 1 con menú, logo, buscar y carrito. Fila 2 con Catálogo, Nuevos y categorías, que se va con el scroll. El lema pasa al pie |
| M9 | Panel con lista antes que adornos | Filas con foto, nombre y una sola línea de datos. Estado como texto de color, no como cinco insignias |
| M10 | Tipografía con jerarquía | Títulos de pantalla en Outfit 600 a `text-3xl md:text-5xl`, subtítulos en DM Sans `text-texto-suave`. Máximo dos pesos por pantalla |

Fuera de alcance, por decisión: el kiosco conserva su estructura y solo hereda los tokens, porque es táctil y ya está probado.

## 4. Prompts para Stitch
Se pegan tal cual en Stitch (en español funciona). Usan su estructura de tres capas: **estructura**, **estilo** y **contenido**. Cada uno cierra con lo que NO se quiere, que es lo más importante para evitar el look genérico.

### Prompt A · Inicio de la tienda (celular, 390 px)
```
ESTRUCTURA: Pantalla de inicio de una tienda online de ropa femenina, en celular. Cabecera de una fila con logo a la izquierda y tres íconos a la derecha (buscar, carrito, menú), y debajo una fila de enlaces de texto deslizables: Catálogo, Nuevos, Blusas, Blazers. Después: un título grande de portada con una bajada corta y un único botón; una fila horizontal deslizable de categorías con foto vertical, donde la última se asoma cortada; una grilla de 2 columnas de productos con foto 3:4, nombre y precio; una franja de tres frases numeradas en una sola fila; y un pie de página oscuro con horarios y dirección.

ESTILO: Elegante, cálido y cercano, boutique de barrio con calidad de marca. Fondo crema (#FBF7F3), tarjetas blancas con radio de 16 px y sombra casi invisible, sin bordes en las tarjetas. Un único acento ciruela (#8A3A63) para el botón principal y los enlaces activos. Texto casi negro (#2A2230). Títulos en Outfit semibold, cuerpo en DM Sans. Mucho espacio entre secciones. Fotos grandes como protagonistas.

CONTENIDO: Modas Naty, moda femenina desde Bermejo, Bolivia. Productos reales: Blazer Clásico Corte Redondo Bs 150, Blusa Envolvente Satín Bs 130, Chaleco 3 Botones Bs 120. Categorías: Blazer, Blusas y Camisas, Broderie, Chalecos, Conjuntos.

NO QUIERO: gradientes, brillos, sombras fuertes, tarjetas con borde alrededor de todo, íconos dentro de círculos de colores, insignias en cada producto, números dentro de círculos negros, tres tarjetas iguales en fila, ni texto encima de las fotos.
```

### Prompt B · Ficha de producto (celular)
```
ESTRUCTURA: Ficha de un producto de ropa en celular. Galería de foto grande con miniaturas debajo; nombre del producto y precio; selector de color con muestras redondas pequeñas; selector de cantidad con menos y más; un único botón grande "Agregar al carrito" fijo abajo; un enlace secundario "Consultar por WhatsApp"; descripción corta desplegable; y una fila de "También te puede gustar" con 3 productos.

ESTILO: Limpia, editorial, cálida. Fondo crema (#FBF7F3), superficies blancas sin borde, acento ciruela (#8A3A63) solo en el botón principal. El precio en texto oscuro y grande, no en color. Outfit para el título, DM Sans para el resto. Jerarquía clara: la foto manda, luego el nombre, luego el precio.

CONTENIDO: Blazer Clásico Corte Redondo, Bs 150,00, tallas P y M, colores celeste, blanco, fucsia y mostaza. Texto: "Luce sofisticada y moderna con nuestro blazer clásico de corte redondo."

NO QUIERO: más de un botón de color fuerte, insignias, bordes alrededor de cada bloque, íconos decorativos, ni etiquetas de colores en cada dato.
```

### Prompt C · Inicio del panel de administración (escritorio, 1366 px)
```
ESTRUCTURA: Pantalla de inicio de un panel de administración de una tienda. Barra lateral izquierda angosta con 4 entradas (Inicio, Pedidos, Productos, Gastos) y un grupo "Administración" abajo (Stock, Reportes, Usuarios, Configuración). Arriba, saludo y fecha. Luego tres cifras grandes en una fila: vendido hoy, vendido en el mes, margen del mes. Debajo, la sección principal "Para hacer": una lista de pedidos con código, nombre de la compradora, la acción siguiente ("Preparar", "Entregar") y hace cuánto tiempo, ordenados del más viejo al más nuevo. Al costado o debajo, "Por reponer": modelos con poco stock.

ESTILO: Profesional, tranquilo, sobrio. Fondo crema (#FBF7F3), superficies blancas sin borde, filas separadas por una línea muy fina. Acento ciruela (#8A3A63) solo para el enlace activo de la barra y las acciones. Estados como texto con un punto de color pequeño, no como insignias. DM Sans, números con cifras tabulares.

CONTENIDO: Natali, administradora. Vendido hoy Bs 450,00 (3 pedidos). Pedidos: TN-000012 Ana Prueba, Preparar, hace 2 h; TN-000009 Lucía M., Entregar al retirar, hace 1 día. Por reponer: Blusa Satín Rojo 2 u., Chaleco 3 botones Negro 0 u.

NO QUIERO: ocho tarjetas de cifras iguales, gráficos decorativos, gradientes, íconos dentro de círculos de colores, sombras, tarjetas con borde, ni insignias de colores en cada fila.
```

## 5. Cómo se usa el resultado de Stitch
1. Pegar cada prompt y quedarse con **una** variante por pantalla.
2. Pasarme la captura o el HTML. Yo extraigo **composición, jerarquía y proporciones**. No copio su CSS.
3. Lo traduzco a los componentes existentes con Tailwind y tokens (sección 3).
4. Paso `anti-ia` sobre el resultado: si Stitch trajo gradientes, píldoras o círculos, se sacan.
5. Verifico: pruebas, axe, 320 px, texto al 200 % y contraste del acento.

## 6. Qué se actualiza al aplicarlo
- `app/DESIGN.md`: se corrige "tinta es el único color de acción" y "sin sombras" por las reglas nuevas.
- `app/src/styles/tokens.css`: los tres tokens de acento y el fondo crema.
- `cerebro-facundo/proyectos/modas-naty/kit-de-marca.md`: queda como fuente de verdad. Si el sistema de nota usa la misma paleta, se replica ahí también.
