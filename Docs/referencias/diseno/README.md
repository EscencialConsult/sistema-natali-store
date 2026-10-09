# Referencia de DISEÑO — Divas House Bolivia (catálogo mayorista)

Fuente: https://divashousebolivia.com/catalogo-mayorista?store-page-ai-Yu3fZC=4
Aclaración de la clienta/intermediario: la página es **ejemplo de diseño** ("ellos quieren una página web que sea catálogo"). **No** es para sacar datos de texto.

Capturas (2026-10-08):
- `catalogo-desktop.png` — listado en escritorio (1440px)
- `catalogo-mobile.png` — listado en celular (390px)
- `ficha-producto-mobile.png` — ficha de producto (corset-clasico) en celular

## Estructura observada
**Escritorio – listado**
- Franja superior fina gris cálido con lema en mayúsculas espaciadas ("DE BOLIVIA PARA EL MUNDO").
- Header gris cálido: menú izquierda (Inicio · Catálogo · Tienda · Dónde encontrarnos), **logo centrado**, redes a la derecha.
- Título H1 enorme (64px) + bajada corta.
- Sidebar izquierda "Navegar por" con categorías en MAYÚSCULAS (Blazer, Faldas y shorts, Lino, Rib, Satin, Vestidos…).
- Contenido: título "Todos los productos", **buscador centrado**, "Ordenar por", **grilla de 4 columnas**.
- Tarjeta de producto: imagen vertical con borde fino, etiqueta negra "Nuevo/Novedad" arriba a la izquierda, nombre en negrita, precio debajo. Sin sombras, sin botón "comprar".
- Botón flotante de WhatsApp (verde) abajo a la derecha.
- Footer oscuro (violeta muy oscuro) con contacto y redes.

**Celular**
- Menú hamburguesa a la izquierda, logo centrado.
- Grilla de **1 columna**, tarjetas anchas con la foto grande.
- Ficha: foto grande arriba, título centrado, subtítulo en negrita, precio, descripción centrada, carrusel "También te puede interesar", paginación numérica (‹ 1 2 3 4 35 ›).

## Sistema visual
| Token | Valor |
|---|---|
| Tipografía títulos | Outfit, 600 (H1 64px) |
| Tipografía cuerpo | DM Sans |
| Texto principal | #1D1E20 |
| Texto fuerte/títulos | #0D141A |
| Fondo header/franja | #F5F3F1 / #F8F6F3 |
| Fondo páginas | blanco |
| Footer | #2B2230 |
| Acento | negro puro (etiquetas, logo) · WhatsApp verde |
| Bordes | 1px gris claro (#D1D5DB), esquinas rectas en tarjetas |

Estética: minimalista, editorial, mucho blanco, la **foto es protagonista**, casi sin color de UI.

## Qué aplicar a Modas Naty (propuesta)
- Mantener: grilla limpia, tarjeta con foto protagonista, buscador visible y centrado, WhatsApp flotante, logo centrado, etiqueta "Nuevo".
- Cambiar para el caso de uso (vendedor atendiendo rápido, mala conexión):
  - **Buscador por código arriba de todo y enfocado al abrir** (en la referencia es discreto).
  - Ficha con **código grande + colores como chips/swatches** (en la referencia los colores van en texto).
  - Varias fotos con galería deslizable; miniaturas livianas (lazy-load, caché).
  - Paginación → scroll continuo o filtro por categoría (la referencia pagina a 35 páginas).
  - Skeletons de carga ya vistos en la referencia: útiles con internet lenta.
- Adaptar paleta/logo a la marca de Natali (pedir logo).
