# Plan de rediseño y auditoría — Tienda Modas Naty (duelo IA 2026-10-09)

Sesión `20261009-2010-rediseno-tienda-online` (cerebro-facundo/historiales/debates-ia). Claude propuso, Codex auditó en 4 rondas hasta CONSENSO, Gemini aportó la mirada de usuaria. Capturas "antes" en `docs/capturas/duelo/`.

## Dirección
Tienda de ropa, no plantilla: fondo crema, sin cajas con borde alrededor de todo, un solo acento de marca (ciruela `#8A3A63`, 6,87:1 sobre crema) para acción principal y enlace activo. Precios y datos críticos en texto oscuro, no en ciruela (Gemini 4). Las fotos son flyers de la clienta: no se les superpone texto ni se recortan fuerte.

## Etapa R1 · Correcciones de lógica y permisos (antes que lo visual)
- `navegacion.js`: `PANTALLAS` sigue siendo el registro de rutas (ninguna URL se pierde). Campo `menu: 'principal' | 'mas'` para agrupar.
- Productos para roles sin `catalogo.editar`: sin "Nuevo"/"Importar", cada fila abre la ficha de consulta y una línea dice "Modo consulta: para editar pedile acceso a la administración" (Gemini 8, con texto en vez de botones deshabilitados).
- Inicio del panel: cola "Para hacer" por estado abierto (`pagado`, `en_preparacion`, `listo_retiro`, `pendiente_pago` vigente), sin corte de mes, ordenada de más vieja a más nueva, con antigüedad y enlace. Estados cargando / error / vacío distintos, también en `PagosPorConfirmar`. Umbral de stock bajo único. Acciones filtradas por permiso.
  - Descarto el corte de 48–72 h que propuso Gemini: un pedido pagado y sin entregar es justo lo que hay que ver, y los pendientes de pago se cancelan solos a los 30 min.
- Tres cifras grandes (ventas de hoy, ventas del mes, margen del mes con su explicación) en lugar de ocho tarjetas (Gemini 6, parcial).
- Portada: un solo `<Link>` con estilo de botón (sin `<button>` adentro).
- Caché offline: patrón `naty_productos`.

## Etapa R2 · Catálogo más fluido
- Una sola lectura del catálogo publicado; categorías de esa base; resultados con la función pura `filtrarCatalogo`. Prueba: con búsqueda sin resultados las categorías siguen.
- Repo local: fotos y colores agrupados por producto con un `Map`.
- Scroll: clave por entrada de historial y filtros, guarda posición y tandas, restaura una vez.
- Miniaturas por convención de ruta (`urlsFoto`): Storage relativo o URL pública del mismo origen y bucket → `<ruta>.mini.webp`; seed de demo → `/seed/imagenes/mini/<n>.webp`; otros orígenes, blobs y data URL sin miniatura. `srcSet` con ancho real; si falla, se retira el `srcSet` y queda el original. Subida: el sincronizador sube también la miniatura generada en el navegador (opcional, no bloquea). Demo: miniaturas pregeneradas y commiteadas con manifiesto verificado por prueba.

## Etapa R3 · Marca, superficies, cabecera y portada
- `DESIGN.md`, `tokens.css` y el kit de marca: crema + ciruela; el pie oscuro no usa ciruela para texto.
- Tarjeta de producto sin borde; "Nuevo" como texto chico; precio en texto oscuro.
- Cabecera:
  - En celular la fila 1 queda fija: menú, logo, buscar, carrito, todos de 44 px.
  - La fila 2 son enlaces deslizables (Catálogo, Nuevos, categorías). **Se va con el scroll**, así no come pantalla (Gemini 1) ni hace falta esconderla con JS. El último enlace asoma cortado para invitar a deslizar (Gemini 3).
  - En escritorio es una sola fila.
  - Alturas mínimas, no fijas, y `--alto-cabecera` para `scroll-padding-top`.
  - El buscador se despliega con `aria-expanded`, cierra con Escape y devuelve el foco. Envía a `/catalogo?q=`.
  - El lema pasa al pie.
- Portada: bloque tipográfico + franja de productos destacados, sin texto sobre fotos. Categorías en fila deslizable con scroll-snap.
- "Cómo comprar": tres pasos con número chico en ciruela, en línea y sin tarjetas. Se conserva la secuencia (Gemini 2).
- "Nuestra tienda": sección plana.

## Etapa R4 · Panel más simple
- Menú principal: Inicio, Pedidos, Productos, Gastos. En "Más": Inventario, Reportes, Usuarios, Configuración, Buscar. Varía por rol. Depósito tiene Inventario en el principal.
- Productos con pestañas "Catálogo" y "Stock" (si tiene `stock.ver`). Stock conserva su filtro de stock bajo a un toque (Gemini 10).
- Verificación por rol: admin, enc_tienda, enc_ventas, enc_deposito. Los enlaces viejos siguen funcionando.

## Etapa R5 · Verificación
Tests existentes más los nuevos:
- Permisos del listado.
- Pedido abierto del mes anterior en la cola.
- Error de pendientes.
- Restauración de tandas.
- Derivación y fallback de miniaturas.
- Manifiesto de miniaturas.
- Categorías estables.

Además: axe, 320 px, texto al 200 %, teclado, movimiento reducido. Lighthouse comparable con `lighthouse-etapa-8.md`. Capturas "después".

## Descartado con motivo
- **View Transitions:** la app usa BrowserRouter y no las integra sin migrar de router.
- **Transformación de imágenes de Supabase:** requiere plan Pro.
- **Cabecera que se esconde con JS:** se reemplaza por una fila 2 que se va con el scroll.
- **Chips de colores en cifras:** Gemini 6, ruido.
- **Botones deshabilitados con candado:** Gemini 8, se reemplazan por una línea de texto.
- **Etiquetas de moneda nuevas:** Gemini 7, ya existe el tratamiento por moneda.

## Pedido a Natali (agregado)
Necesitamos una foto limpia por producto, sin texto ni collage, y una foto de portada.
