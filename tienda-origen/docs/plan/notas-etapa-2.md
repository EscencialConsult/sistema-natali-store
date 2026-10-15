# Notas de cierre — Etapa 2: Catálogo de tienda (2026-10-09)

Verificación: lint sin avisos · build OK · 67 pruebas en 10 archivos · axe (WCAG 2.1 A/AA + 2.2 AA) en catálogo, categoría, búsqueda, categoría inexistente, ficha, ficha inexistente y ficha con mini carrito abierto: **0 infracciones** · flujo real en el navegador a 390 px: elegir color, cantidad 2, agregar → mini carrito "Celeste · 2 unidades · Bs 300,00" y contador "Carrito, 2 artículos". Capturas en `../capturas/etapa-2/`.

## Qué quedó hecho
- **2.1** `productos.listarTienda` (solo activos, publicados y con precio minorista; orden novedad / precio / nombre; búsqueda por nombre o código), `obtenerPorSlug`, `Precio` con modo tienda (Bs por unidad, USD opcional según `sitio.mostrar_usd`).
- **2.2** `/catalogo` y `/catalogo/:categoria` (categoría por slug del nombre) con `?q=` para buscar: cada combinación tiene URL compartible; categorías como enlaces (solo las que tienen productos publicados), orden, grilla 2/4 columnas por tandas de 24, estados vacío/error/carga, posición de scroll conservada al volver de una ficha.
- **2.3** `/p/:slug`: galería heredada, precio grande, colores como chips con disponibilidad (sin stock visible pero deshabilitado), cantidad limitada al disponible, único botón primario "Agregar al carrito" (dice por qué está deshabilitado: "Elegí un color" / "Sin stock en este color"), mini carrito con "Seguir viendo" / "Ir al carrito", descripción plegable, relacionados, metadatos; producto inexistente o no publicado → 404 del sitio.
- **2.4** `disponibilidad()`: "Disponible", "Quedan N" (≤ umbral) o "Sin stock"; nunca cantidades grandes al público. Las reservas de pedidos ya descuentan porque son movimientos.
- **2.5** Compartir (Web Share, respaldo copiar enlace) y Consultar por WhatsApp con código y color (se muestra cuando haya WhatsApp cargado, B-S2).

Se eliminó el catálogo público heredado del sistema de nota (`features/catalogo/publico/`): lo reemplaza el de tienda.

## Decisiones
- La ficha es una página, no un Sheet: necesita URL propia para compartir y para Google.
- El estado derivado reemplazó a los efectos (reinicio de filtros al cambiar la URL, reinicio de selección al cambiar de modelo, cantidad acotada al disponible): sin renders en cascada y sin avisos del compilador de React.
- En la tarjeta la foto lleva `alt=""`: el nombre ya es el texto del enlace; repetirlo duplicaba el nombre accesible.

## Queda afuera a propósito
- `/carrito`, `/checkout`, `/pedido/:codigo` y `/seguimiento` siguen como marcadores: etapa 3.
- Precios minoristas del seed son derivados (docena USD × 6,96 ÷ 12) y todos los productos están publicados: bloqueos B-C1 y B-C2.
- El panel heredado (`/administracion/buscar`, `/administracion/productos`) sigue mostrando precio por docena en USD; los campos de tienda se agregan al formulario en la 7.3.

## Aprendizajes
- Los chips de color heredados (`ColoresChips`) ya traían selección y estados de stock: alcanzó con un modo `publico` en vez de un selector nuevo.
- `useSearchParams` con `replace: true` para la búsqueda en vivo: cada letra no agrega una entrada al historial.
