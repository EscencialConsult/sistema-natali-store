# Etapa 1 — Sitio público (12 h)
Estado: [x] cerrada el 2026-10-09. Notas: `notas-etapa-1.md`. Textos, fotos y datos del local son PROVISORIOS (B-S1, B-S2) y salen de `repos.sitio` marcados `provisorio: true`.
Leer: `_comun.md`, `../03-sistemas-y-caracteristicas.md` (S1), `../referencias/diseno/README.md` (estructura de la referencia: lema arriba, logo centrado, foto protagonista, pie oscuro).
Principio: **una persona que llega desde Instagram entiende en 5 segundos qué vende la tienda y cómo comprar.**

### Tarea 1.1 · Cabecera, menú, carrito y pie · 3 h
Estado: [x] (2026-10-09)
**Objetivo**: estructura común a todas las páginas públicas.
**Archivos**: `src/features/sitio/Cabecera.jsx`, `MenuMovil.jsx` (Sheet heredado), `Pie.jsx`, `BotonWhatsApp.jsx` (flotante), `src/app/layouts/LayoutSitio.jsx`.
**Alcance**: franja superior con lema configurable; logo centrado en celular, menú (Inicio, Catálogo, Quiénes somos, Contacto) y carrito con contador de ítems (lee `useCarrito`, se construye en la etapa 3: hasta entonces muestra 0); menú hamburguesa accesible (foco atrapado, Escape cierra); pie con dirección, horarios, WhatsApp, redes, enlaces legales y "Hecho por Escencial"; WhatsApp flotante con mensaje prearmado; `skip link` al contenido.
**Pasos**
- [x] (2026-10-09) 1. `features/sitio/Cabecera.jsx`: franja superior con `sitio.lema`; fila con botón menú (celular), logo centrado (`Logo`), enlace al carrito con contador (`useCarritoItems`); en `md:` el menú (`MENU_SITIO`) en línea a la izquierda. Verificación: 390 y 1440 px sin scroll horizontal.
- [x] (2026-10-09) 2. `features/sitio/MenuMovil.jsx` con `Sheet` (foco atrapado y Escape ya los da `Modal`): enlaces del menú + WhatsApp. Verificación: abrir con teclado, Escape cierra.
- [x] (2026-10-09) 3. `features/sitio/Pie.jsx`: dirección, horarios, WhatsApp, redes, enlaces legales, "Hecho por Escencial". `features/sitio/BotonWhatsApp.jsx` flotante, oculto en `/carrito` y `/checkout`.
- [x] (2026-10-09) 4. `layouts/LayoutSitio.jsx` usa los tres; `skip link` ya existe. Verificación: lint + build; axe en Inicio.
**Criterios de aceptación**
- [x] (2026-10-09) Sin scroll horizontal a 320 px; menú usable con teclado; contraste AA.
**Bloqueos**: B-S2 (datos del local) → se cargan desde `sitio` con valores provisorios marcados "PROVISORIO".

### Tarea 1.2 · Inicio · 4 h
Estado: [x] (2026-10-09)
**Objetivo**: portada que vende.
**Archivos**: `src/features/sitio/InicioPage.jsx`, secciones: `Portada.jsx`, `Categorias.jsx`, `NuevosIngresos.jsx`, `Destacados.jsx`, `ComoComprar.jsx`, `Local.jsx`.
**Alcance**: foto grande de portada con título y botón "Ver catálogo" (único acento); categorías con foto; "Nuevos ingresos" (hasta 8 productos `nuevo`, reutiliza `ProductoCard` en modo tienda); destacados elegidos en el panel (`destacado`); cómo comprar en 3 pasos (elegí, pagá, retirá o recibí); bloque del local con mapa embebido (solo con consentimiento o imagen estática para no cargar Google Maps de entrada), horarios y WhatsApp; estados de carga y vacío (si no hay destacados, la sección no se muestra).
**Pasos**
- [x] (2026-10-09) 1. `features/sitio/InicioPage.jsx` con secciones `Portada`, `Categorias`, `NuevosIngresos`, `Destacados`, `ComoComprar`, `Local` (archivos propios en `features/sitio/inicio/`).
- [x] (2026-10-09) 2. Portada: imagen de `sitio.portada.imagen` (si no hay, la primera foto de un destacado) con `fetchpriority="high"`, título, bajada y único botón primario "Ver catálogo".
- [x] (2026-10-09) 3. Categorías: tarjetas con la primera foto de un producto publicado de cada categoría, enlace a `/catalogo/:slug-categoria`.
- [x] (2026-10-09) 4. Nuevos ingresos (hasta 8 `nuevo` y publicados) y Destacados (`destacado`): `ProductoCard` en modo tienda (enlace a `/p/:slug`, precio Bs); sección oculta si no hay datos; skeletons al cargar.
- [x] (2026-10-09) 5. Cómo comprar (3 pasos) y Local (dirección, horarios, mapa como enlace, WhatsApp). Verificación: 390/1440, axe, Lighthouse rápido.
**Criterios de aceptación**
- [x] (2026-10-09) LCP < 2,5 s en celular simulado (foto de portada optimizada, `fetchpriority="high"`).
- [x] (2026-10-09) Todo el contenido editable viene de `repos.sitio`, no de texto fijo.
**Bloqueos**: B-S1 (fotos y textos reales).

### Tarea 1.3 · Quiénes somos y Contacto · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/sitio/QuienesSomosPage.jsx`, `ContactoPage.jsx`.
**Alcance**: Quiénes somos con texto en bloques (párrafos e imágenes) desde config; Contacto con WhatsApp, teléfono, dirección, horarios por día, redes; sin formulario (decisión: evita spam y backend de correo; si Natali lo pide, se suma con Netlify Forms).
**Pasos**
- [x] (2026-10-09) 1. `QuienesSomosPage.jsx`: renderiza `sitio.quienes_somos` (bloques título/párrafo/imagen); vacío con texto provisorio marcado.
- [x] (2026-10-09) 2. `ContactoPage.jsx`: tarjetas accionables (WhatsApp `wa.me`, `tel:`, dirección con enlace al mapa, horarios por día, redes). Verificación: cada dato es un enlace.
**Criterios de aceptación**
- [x] (2026-10-09) Cada dato de contacto es accionable (tel:, wa.me, mapa).
**Bloqueos**: B-S1, B-S2.

### Tarea 1.4 · Legales y 404 · 1 h
Estado: [x] (2026-10-09)
**Archivos**: `src/features/sitio/LegalPage.jsx` (`/legales/:slug`), `NoEncontradaSitio.jsx`.
**Alcance**: términos de compra, envíos y cambios, privacidad, con texto base genérico marcado "BORRADOR, revisar con Natali"; 404 con buscador del catálogo.
**Pasos**
- [x] (2026-10-09) 1. `LegalPage.jsx` (`/legales/:slug` → terminos | envios-y-cambios | privacidad) con texto base genérico marcado "BORRADOR" si `sitio.legales.*` está vacío; slug desconocido → 404.
- [x] (2026-10-09) 2. `NoEncontradaSitio.jsx` con buscador que lleva a `/catalogo?q=`.
**Bloqueos**: B-L1.

### Tarea 1.5 · Textos del sitio editables · 2 h
Estado: [x] (2026-10-09)
**Objetivo**: que todo lo que se ve en el sitio (lema, portada, textos, horarios, redes, legales) salga de `repos.sitio` con un esquema zod y valores por defecto.
**Archivos**: `src/data/repos/local/sitio.js`, `src/data/seed/sitio.json`, `src/lib/sitio.js` (esquema), hook `useSitio()`.
**Alcance**: una sola lectura cacheada; en la etapa 7 el panel edita estos mismos campos; en la etapa 4 pasa a `tienda_config`.
**Pasos**
- [x] (2026-10-09) 1. `esquemaSitio` (ya existe de la tarea 0.4) ampliado con lo que usan las pantallas: `como_comprar` (3 pasos), `legales` con valores por defecto, `whatsapp` tomado de `config.whatsapp_tienda`.
- [x] (2026-10-09) 2. `seed`: `sitio` con textos provisorios de ejemplo (marcados) para que el sitio no se vea vacío en desarrollo.
- [x] (2026-10-09) 3. Prueba: cambiar un texto del seed cambia el sitio sin tocar componentes (test de `sitio.guardar` + lectura).
**Criterios de aceptación**
- [x] (2026-10-09) Cambiar un texto en el seed cambia el sitio sin tocar componentes.
**Bloqueos**: ninguno.

**Cierre de etapa**: build + lint + tests; axe en las 5 páginas; capturas 390/1440 en `docs/capturas/etapa-1/`; `notas-etapa-1.md`. Pedir autorización Etapa 2.
