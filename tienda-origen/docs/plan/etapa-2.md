# Etapa 2 — Catálogo de tienda (14 h)
Estado: [x] cerrada el 2026-10-09. Notas: `notas-etapa-2.md`.
Leer: `_comun.md`, `../03-sistemas-y-caracteristicas.md` (S2), `../04-arquitectura.md` (campos nuevos del producto, D4). Código heredado a reutilizar: `src/features/catalogo/{GrillaProductos,ProductoCard,ProductoFicha,Galeria,ColoresChips,Foto,Precio}.jsx`, `src/lib/codigo.js`, `src/lib/stock.js`.
Principio: **la foto manda; elegir color y cantidad es un gesto, no un formulario.**

### Tarea 2.1 · Precio minorista, publicación y slug · 2 h
Estado: [x] (2026-10-09)
**Objetivo**: extender el modelo de producto sin romper el sistema hermano.
**Archivos**: `src/data/db.js`, `src/data/seed/productos.json` (campos `precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug`), `src/lib/slug.js` (+ test), `src/data/repos/local/productos.js` (filtro `publicado_tienda`, `obtenerPorSlug`), `src/features/catalogo/Precio.jsx` (modo tienda: Bs por unidad, USD opcional).
**Alcance**: seed con precio minorista derivado provisorio (claramente marcado como inventado); `slug` único generado desde nombre + código; productos no publicados invisibles en el sitio y el kiosco.
**Pasos**
- [x] (2026-10-09) 1. Los campos (`precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug`) ya existen en esquema y seed desde la 0.4. Agregar `productos.listarTienda({ categoria_id, texto, orden })` (solo publicados, con precio) y `Precio.jsx` con modo tienda (Bs por unidad, USD opcional según `sitio.mostrar_usd`).
- [x] (2026-10-09) 2. Test: un producto sin precio o no publicado no sale en `listarTienda`.
**Criterios de aceptación**
- [x] (2026-10-09) Un producto sin `precio_unidad_bs_cent` o no publicado no aparece en la tienda aunque esté activo.
**Bloqueos**: B-C1 (precios reales), B-C2 (qué se publica) → no frenan el desarrollo, sí la salida.

### Tarea 2.2 · Grilla pública · 4 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/catalogo/tienda/CatalogoPage.jsx` (`/catalogo`, `/catalogo/:categoria`), `FiltrosCatalogo.jsx`, adaptación de `GrillaProductos.jsx` y `ProductoCard.jsx` (prop `modo="tienda"`: enlace a `/p/:slug`, precio en Bs, "Sin stock").
**Alcance**: categorías como chips (celular) o lateral (escritorio) con URL propia; orden (novedad, precio ↑↓, nombre) en `Select`; buscador por nombre o código con resultados en vivo (`useBusquedaCodigo` heredado); scroll continuo por tandas de 24; estado vacío por categoría; skeletons; la posición de scroll se conserva al volver de una ficha.
**Pasos**
- [x] (2026-10-09) 1. `features/catalogo/tienda/CatalogoPage.jsx` en `/catalogo` y `/catalogo/:categoria` (categoría por slug del nombre), con `?q=` para la búsqueda.
- [x] (2026-10-09) 2. `FiltrosCatalogo.jsx`: chips de categoría (celular) / lista lateral (escritorio) con enlaces, orden en `Select`, buscador en vivo que escribe `?q=`.
- [x] (2026-10-09) 3. Grilla 2/4 columnas con `ProductoCard modo="tienda"`, tandas de 24 con centinela, estados vacío/error/carga.
- [x] (2026-10-09) 4. Conservar la posición de scroll al volver de una ficha (`useScrollConservado` con `sessionStorage` por `location.key`).
- [x] (2026-10-09) 5. Reemplazar el catálogo heredado en `AppRoutes`. Verificación: 390/1440, axe.
**Criterios de aceptación**
- [x] (2026-10-09) 138 productos sin tirones en un celular medio (fotos con `loading="lazy"`, miniaturas).
- [x] (2026-10-09) Cada categoría y búsqueda tiene URL compartible.
**Bloqueos**: ninguno.

### Tarea 2.3 · Ficha de tienda · 4 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/catalogo/tienda/ProductoPage.jsx` (`/p/:slug`), `SelectorColor.jsx`, `SelectorCantidad.jsx`, `BotonAgregar.jsx`, `Relacionados.jsx`; reutiliza `Galeria.jsx`.
**Alcance**: página completa (no Sheet: necesita URL propia para compartir y SEO); galería con zoom; nombre, código pequeño, precio grande con moneda; colores como chips con muestra, nombre y disponibilidad; cantidad con + / − limitada al stock; "Agregar al carrito" deshabilitado hasta elegir color; confirmación con mini carrito (Sheet) que ofrece "Seguir viendo" o "Ir al carrito"; descripción plegable; relacionados de la misma categoría; producto inexistente o no publicado → 404 del sitio; metadatos por producto.
**Pasos**
- [x] (2026-10-09) 1. `features/catalogo/tienda/ProductoPage.jsx` en `/p/:slug` (`productos.obtenerPorSlug`): galería heredada, nombre, código chico, precio grande, descripción plegable, metadatos (título y descripción).
- [x] (2026-10-09) 2. `SelectorColor.jsx` (chips con muestra, nombre y disponibilidad; sin stock = visible y deshabilitado) y `SelectorCantidad.jsx` (+/− limitado al disponible).
- [x] (2026-10-09) 3. `BotonAgregar.jsx`: deshabilitado sin color; `carrito.agregar`; abre `MiniCarrito.jsx` (Sheet) con "Seguir viendo" / "Ir al carrito".
- [x] (2026-10-09) 4. `Relacionados.jsx` (misma categoría, hasta 4). Producto inexistente o no publicado → 404 del sitio.
**Criterios de aceptación**
- [x] (2026-10-09) Agregar un producto desde el celular: 3 toques (color, cantidad opcional, agregar).
- [x] (2026-10-09) La foto principal carga antes que el resto (prioridad alta).
**Bloqueos**: `useCarrito` llega en 3.1: hasta entonces `BotonAgregar` usa la interfaz del repo local ya definida.

### Tarea 2.4 · Stock visible · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/lib/stock.js` (disponible = stock − reservas vigentes), `src/data/repos/local/stock.js`, tests.
**Alcance**: por color: "Disponible", "Quedan N" cuando N ≤ umbral configurable, "Sin stock" (chip deshabilitado pero visible); tarjeta con "Sin stock" cuando ningún color tiene; nunca mostrar cantidades exactas grandes al público (solo cuando quedan pocas).
**Pasos**
- [x] (2026-10-09) 1. `lib/stock.js`: `disponibilidad(unidades, umbral)` → { clave, texto } con "Disponible" / "Quedan N" / "Sin stock" (nunca cantidades grandes al público). Test.
- [x] (2026-10-09) 2. La tarjeta muestra "Sin stock" cuando ningún color tiene disponible (las reservas vigentes ya descuentan vía movimientos).
**Criterios de aceptación**
- [x] (2026-10-09) Una reserva vigente de otro pedido reduce lo disponible; una vencida no.
**Bloqueos**: ninguno.

### Tarea 2.5 · Compartir y WhatsApp · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/catalogo/tienda/BotonCompartir.jsx`, `BotonConsultar.jsx`, `src/lib/whatsapp.js` (arma el mensaje con código y URL).
**Alcance**: Web Share API con respaldo "copiar enlace"; WhatsApp con mensaje "Hola, consulto por MN-012 Blusa satín (color Rosa) https://…".
**Pasos**
- [x] (2026-10-09) 1. `BotonCompartir.jsx` (Web Share API, respaldo copiar enlace con aviso) y `BotonConsultar.jsx` (`urlWhatsApp` + `mensajeConsulta` con código y color elegido).
**Bloqueos**: B-S2 (número de WhatsApp).

**Cierre de etapa**: build + lint + tests; axe en catálogo y ficha; recorrido con red lenta (throttling 3G) y offline; capturas; `notas-etapa-2.md`. Pedir autorización Etapa 3.
