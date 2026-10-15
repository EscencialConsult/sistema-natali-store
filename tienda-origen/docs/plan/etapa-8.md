# Etapa 8 — PWA, SEO, accesibilidad, animación y pulido (12 h)
Leer: `_comun.md`, `app/DESIGN.md`, skills `animate`, `reglas-de-pagina`, `anti-ia`, `checklist-post-lanzamiento` (solo para saber qué scripts preparar). Referencia heredada: `../SISTEMA DE NOTA/Docs/plan/notas-etapa-6.md` (qué se animó y por qué, auditoría axe).
Principio: **lo que se usa cien veces por día no se anima; lo que se publica en Google se ve bien compartido.**

### Tarea 8.1 · PWA · 3 h
Estado: [x] (2026-10-09)
**Archivos**: `vite.config.js` (manifest de la tienda: nombre, íconos, `start_url` según zona), `src/app/ActualizacionPWA.jsx` (heredado), caché de fotos del catálogo (bucket `naty_productos`), `DescargaOffline` para el kiosco.
**Alcance**: el kiosco y el panel se instalan; el sitio público también pero sin insistir (sin banner); aviso de versión nueva no interrumpe un pago ni un ticket (se difiere si hay pedido en curso); el webhook y las functions no se cachean nunca.
**Criterios de aceptación**
- [ ] Kiosco con red cortada: catálogo completo con fotos; pedido en caja se encola.
**Bloqueos**: íconos finales dependen del logo (B-S1).

### Tarea 8.2 · SEO · 2 h
Estado: [x] (2026-10-09)
**Archivos**: `src/lib/seo.js` (título, descripción, Open Graph, canonical por página), `public/robots.txt`, generación de `sitemap.xml` en el build (script que lee la vista pública o una Netlify Function `sitemap.js`), `index.html` (lang, theme-color, favicon).
**Alcance**: cada producto publicado con título, descripción y foto en Open Graph (vista previa correcta al compartir por WhatsApp); `noindex` en panel, kiosco, carrito, checkout, pedido; datos estructurados `Product` con precio en BOB.
**Criterios de aceptación**
- [ ] Compartir `/p/:slug` por WhatsApp muestra foto, nombre y precio.
**Bloqueos**: dominio definitivo (B-D1) para canonical: se usa variable de entorno.

### Tarea 8.3 · Accesibilidad AA · 3 h
Estado: [x] (2026-10-09)
**Alcance**: axe-core en todas las pantallas de las tres zonas (sitio, kiosco, panel) y estados (modales, sheets, errores); teclado completo en sitio y panel; foco visible; nombres accesibles en todos los controles; contraste; zoom 200 %; 320 px; colores forzados; `aria-live` para cambios de estado del pedido y del carrito.
**Criterios de aceptación**
- [ ] Cero infracciones WCAG 2.1 A/AA en el informe guardado en `docs/capturas/axe-etapa-8.md`.
**Bloqueos**: ninguno.

### Tarea 8.4 · Animaciones con propósito · 2 h
Estado: [x] (2026-10-09)
**Alcance**: aplicar la skill `animate` solo a: agregar al carrito (confirmación), apertura de mini carrito y menú (heredado), cambio de estado del pedido (aparece), ticket "imprimiendo", bienvenida del kiosco (atractor sutil, pausable); nada en grilla, filtros ni listados del panel; tabla "Qué / Propósito / Cómo" en `DESIGN.md`; reduced-motion deja solo fundidos.
**Criterios de aceptación**
- [ ] Ninguna animación supera 300 ms salvo el atractor del kiosco.
**Bloqueos**: ninguno.

### Tarea 8.5 · Auditorías y rendimiento · 2 h
Estado: [~] (2026-10-09) · auditoría hecha; Lighthouse ≥ 90 no alcanzado en catálogo ni ficha (miniaturas en backlog-v1.1); `anti-ia` no se corrió como pasada aparte
**Alcance**: correr `reglas-de-pagina` (páginas de error, estados vacíos, legal, footer, SEO, formularios, auth) y `anti-ia` sobre sitio y panel, corregir lo encontrado; Lighthouse en celular para Inicio, catálogo, ficha y checkout (objetivo ≥ 90 rendimiento y accesibilidad); tamaño de chunks por zona; fotos de portada en WebP con tamaños responsivos.
**Criterios de aceptación**
- [ ] Informe en `docs/capturas/lighthouse-etapa-8.md` con cifras antes y después.
**Bloqueos**: ninguno.

**Cierre de etapa**: build + lint + tests; `notas-etapa-8.md`. Pedir autorización Etapa 9.
