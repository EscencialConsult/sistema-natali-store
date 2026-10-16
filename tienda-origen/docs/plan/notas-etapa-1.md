# Notas de cierre — Etapa 1: Sitio público (2026-10-09)

Verificación: lint sin avisos · build OK · 63 pruebas en 9 archivos · axe-core (WCAG 2.1 A/AA + 2.2 AA) en Inicio, Inicio con menú abierto, Quiénes somos, Contacto, dos legales y 404: **0 infracciones** (tras corregir la lista de definiciones del bloque "Nuestra tienda"). Capturas en `../capturas/etapa-1/`.

## Qué quedó hecho
- **1.1 Cabecera, menú, carrito y pie**: franja con el lema, logo centrado, menú en línea en escritorio y hamburguesa (Sheet, foco atrapado, Escape) en celular, carrito con contador que ya lee el repositorio `carrito`; pie oscuro con dirección, horarios, redes, legales y "Seguir mi pedido"; WhatsApp flotante oculto en carrito y checkout.
- **1.2 Inicio**: portada (foto + título + único botón primario "Ver catálogo"), categorías con la foto del primer producto publicado (enlace a `/catalogo/:slug`), "Nuevos ingresos" y "Destacados" con `ProductoCard` en modo tienda (enlace a `/p/:slug`, precio en Bs), "Cómo comprar" en 3 pasos y "Nuestra tienda". Secciones sin datos no se muestran; skeletons al cargar.
- **1.3 Quiénes somos y Contacto**: bloques de texto/imagen editables; contacto con tarjetas accionables (WhatsApp con mensaje, teléfono, mapa, horarios, redes). Sin formulario (decisión registrada en el plan).
- **1.4 Legales y 404**: tres legales desde `sitio.legales` con aviso de borrador; 404 con buscador hacia el catálogo.
- **1.5 Textos editables**: `esquemaSitio` con `como_comprar`, legales y horarios por defecto, todo marcado `provisorio: true`; prueba de `sitio.guardar` parcial.

## Decisiones de diseño aplicadas
- Un solo botón primario por pantalla (regla "Un acento para comprar"): en Inicio es "Ver catálogo"; las tarjetas no tienen botón comprar.
- El mapa es un enlace a Google Maps, no un iframe: no carga terceros ni pide consentimiento.
- `ProductoCard` tiene dos modos (`tienda` / `panel`) en vez de duplicar la tarjeta.

## Queda afuera a propósito
- `/catalogo` sigue siendo el catálogo heredado del sistema de nota (precio por docena en USD): se reemplaza en la etapa 2 con el catálogo de tienda, los filtros por categoría (`/catalogo/:categoria`) y la ficha `/p/:slug` (hoy marcadores).
- Textos, fotos, dirección y horarios son provisorios (B-S1, B-S2); los legales son borrador (B-L1). Todo se edita desde el panel en la 7.8.
- Lighthouse formal se corre en la etapa 8; la portada ya usa `fetchPriority="high"` y el resto carga diferido.

## Aprendizajes
- `lucide-react` 1.x no trae iconos de marcas (`Instagram`): el error solo aparece en runtime como "does not provide an export". Para redes se usa `Share2`.
- Un `<dl>` solo admite `dt`/`dd` o `div` que los agrupe; un icono suelto adentro rompe WCAG (axe `definition-list`). El icono va dentro del `dt`.
- axe se puede correr en el dev server inyectando `/node_modules/axe-core/axe.min.js` y navegando con `pushState` + `popstate` para auditar varias rutas en una sola pasada.
