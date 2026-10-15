# Brief para Stitch: comprobante de compra (correo y PDF)

Punto de partida: el modelo que salió del duelo de IA (ver `docs/pagos/comprobante-y-recargo.md`). Esto es lo que hay que pulir con
Stitch y qué NO se puede romper al hacerlo.

## Archivos del modelo actual
- Correo: `app/netlify/functions/_lib/correo.js` (función `renderComprobante`, HTML con tablas y estilos en línea).
- PDF: `app/netlify/functions/_lib/comprobantePdf.js` (función `maquetarComprobante`, dibuja con pdf-lib).
- Logos originales: `C:\Users\PERSONAL\Downloads\modasnaty` (imagotipo, isotipo, logotipo; PNG con transparencia).
  Para el correo se usa `app/public/email/logo-naty-v1.png` (compuesto sobre blanco, 27 KB).

## Marca
- Logo dorado champagne con monograma NM (serif caligráfico). Paleta del sitio: ciruela `#8a3a63` (acento), crema `#fbf7f3`
  (fondo), texto `#2a2230`, suave `#5c5663`, línea `#e8e0d8`, tinte `#f4ece6`.
- Tono: femenino, sobrio, cálido; voseo ("Retirás", "Seguí tu pedido").
- Regla anti-IA: sin gradientes, glows, íconos decorativos, banda de color con título gigante, badges de varios colores, sombras en
  reposo ni acentos de borde parcial. Escala de espaciado 4/8. Un solo botón primario.

## Contenido que no puede faltar (en este orden de importancia para la clienta)
1. Confirmación de pago y monto. 2. Entrega: retiro en la tienda (con dirección) o envío (con dirección). 3. Productos: nombre, código,
color, cantidad, precio unitario, subtotal. 4. Totales: subtotal, envío, **recargo por pago en línea (%) con su aclaración**, diferencia
si la hay, total pagado. 5. Datos del comprobante: N° CP-000000, pedido TN-000000, fecha en hora de Bolivia, medio de pago, ID de la
operación, tipo de cambio (1 Bs = 0,2 ARS). 6. Botón "Seguir mi pedido". 7. Contacto por WhatsApp. 8. "Comprobante de pago. No es
una factura."

## Restricciones técnicas del correo (no negociables)
- Una columna de 600 px, tablas anidadas, estilos en línea, sin JavaScript ni fuentes web (Georgia/Arial). Funciona con imágenes
  bloqueadas (el alt "Modas Naty" lleva estilo propio). Se lee bien en Gmail del celular y en Outlook.
- Logo como `<img>` con URL https y ancho/alto explícitos; nunca base64.
- Modo oscuro: el logo ya viene compuesto sobre fondo claro; no depender de que el cliente invierta colores.
- Peso del HTML por debajo de 90 KB (Gmail recorta a 102 KB).

## Restricciones técnicas del PDF
- A4, fuentes estándar (Helvetica) → solo Latin-1/WinAnsi; si Stitch propone otra tipografía, hay que embeberla (peso y licencia).
- Debe poder partirse en varias páginas (hasta cientos de productos) con encabezado repetido y los totales al final.

## Prompt para pegar en Stitch (correo)
> Diseñá el correo de confirmación de compra de **Modas Naty**, una tienda de moda femenina de Bermejo, Bolivia. Ancho 600 px,
> una sola columna, fondo crema #fbf7f3 y tarjeta blanca. Arriba el logo dorado (monograma NM con el texto MODAS NATY) centrado.
> Titular serif "¡Pago confirmado!" y una frase corta con el nombre y el monto. Luego, en este orden: bloque **Entrega** (retiro en
> la tienda con dirección, o envío), lista **Tu compra** (nombre en negrita, "Código · Color", cantidad × precio y subtotal a la
> derecha), **totales** alineados a la derecha con una línea "Recargo por pago en línea (4 %)" y una nota chica que explica que es la
> comisión de Mercado Pago, y **Total pagado** grande en ciruela #8a3a63; después **Datos del comprobante** (N°, pedido, fecha,
> medio, ID de operación) y un único botón "Seguir mi pedido" en ciruela. Pie con contacto por WhatsApp y "Comprobante de pago.
> No es una factura." Estilo editorial, sobrio y cálido; sin gradientes, sin íconos decorativos, sin sombras, sin badges de
> colores. Que se lea cómodo en un celular de 390 px.

## Prompt para pegar en Stitch (PDF)
> Diseñá el comprobante de pago en PDF A4 de **Modas Naty**. Arriba a la izquierda el logo dorado; a la derecha "Comprobante de
> pago", N° CP-000020, pedido TN-000020 y fecha. Debajo "Pago confirmado" y una frase de agradecimiento. Secciones con título en
> versalitas y un filete oscuro: Entrega, Tu compra (tabla con encabezado en tinte #f4ece6: producto, cantidad, precio, subtotal),
> totales alineados a la derecha con el recargo por pago en línea y su aclaración, "Total pagado" en ciruela #8a3a63, Datos del
> comprobante y enlace "Seguir mi pedido". Pie en cada página: "Comprobante de pago. No es una factura." y número de página.
> Sobrio, mucho aire, sin cajas pesadas ni fondos macizos. Pensalo para que se pueda extender a varias páginas.

## Cómo volver a integrar el resultado
1. Pasar el HTML de Stitch a tablas con estilos en línea si no lo está, y reemplazar los textos fijos por las variables del modelo
   (`m.total`, `m.items`, `m.recargo`, `m.entregaDetalle`, etc.: ver `modeloComprobante` en `correo.js`).
2. Mantener `escapar()` en todo texto variable.
3. Correr `npx vitest run --root R:\app` (hay pruebas de contenido, escape, tamaño y maquetado) y mandar uno de prueba con
   `scripts` o el procedimiento de `docs/pagos/comprobante-y-recargo.md`.
