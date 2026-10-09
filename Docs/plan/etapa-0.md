# Etapa 0 — Fundaciones del frontend (8 h)
Leer antes: `_comun.md`, `../06-arquitectura.md`, `../referencias/diseno/README.md`.

### Tarea 0.1 · Crear la app · 2 h
Estado: [ ]
**Objetivo**: proyecto Vite+React+Tailwind+lucide corriendo, vacío pero con router.
**Archivos**: `app/` (nuevo).
**Pasos**
- [ ] 1. En `MODAS NATALI/` correr `npm create vite@latest app -- --template react`. Verificación: existe `app/package.json`.
- [ ] 2. Instalar: `react-router-dom dexie dexie-react-hooks lucide-react zod qrcode.react xlsx`; dev: `tailwindcss @tailwindcss/vite oxlint vite-plugin-pwa vitest`. Verificación: `npm ls --depth=0` sin errores.
- [ ] 3. Configurar Tailwind en `vite.config.js` y `src/index.css`. Verificación: una clase `bg-black` se ve en `npm run dev`.
- [ ] 4. Crear la estructura de carpetas de `06-arquitectura.md`. Verificación: `ls src`.
- [ ] 5. Router con rutas vacías `/`, `/catalogo`, `/venta`, `/ventas`, `/stock`, `/comisiones`, `/ajustes`. Verificación: navegar a cada una sin error.
- [ ] 6. Scripts `lint` (oxlint), `build` y `test`. Verificación: pasan.
**Criterios de aceptación**
- [ ] `npm run dev` abre; `npm run build` y lint pasan.
**Bloqueos**: ninguno.

### Tarea 0.2 · Kit de marca y DESIGN.md · 2 h
Estado: [ ]
**Objetivo**: tokens de diseño en un solo lugar + reglas nombradas.
**Entradas**: skill `kit-de-marca`; `../referencias/diseno/README.md` (Outfit/DM Sans, paleta cálida, foto protagonista).
**Archivos**: `app/src/styles/tokens.css` (bloque `@theme` de Tailwind), `app/DESIGN.md`.
**Pasos**
- [ ] 1. Definir tokens: colores (fondo cálido, texto, acento, éxito/alerta/error), radios, bordes, espaciados, tipografías. Paleta provisoria hasta tener el logo (B2). Verificación: clases `bg-fondo`, `text-texto` funcionan.
- [ ] 2. Autoalojar fuentes Outfit y DM Sans en `public/fonts` (mala conexión). Verificación: se ven con la red apagada.
- [ ] 3. Escribir `DESIGN.md` con reglas nombradas ("Foto protagonista", "Un solo acento", "Sin sombras decorativas", "Touch target ≥ 44px").
- [ ] 4. Página de muestra de tokens (solo dev). Verificación: se ve bien en 390px y 1440px.
**Criterios de aceptación**
- [ ] No hay colores hardcodeados fuera de tokens.
**Bloqueos**: B2 (logo) solo afecta el tono final.

### Tarea 0.3 · Componentes base de UI · 3 h
Estado: [ ]
**Archivos**: `app/src/components/ui/` — Button, Input, Select, BuscadorLista, Modal, Sheet (panel inferior en celular), Badge, Chip, EmptyState, ErrorState, Skeleton, Toast, Tabs.
**Pasos**
- [ ] 1. `Button`: variantes primario/secundario/fantasma, cargando, deshabilitado, mínimo 44px.
- [ ] 2. `Input` con etiqueta, error y `inputMode` configurable (numérico para cantidades).
- [ ] 3. `Select` propio (no nativo), accesible con teclado y táctil.
- [ ] 4. `BuscadorLista` (campo + lista filtrable, resalta coincidencia).
- [ ] 5. `Modal` y `Sheet` (cierre con Esc, foco atrapado).
- [ ] 6. `Badge`, `Chip`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `Tabs`.
- [ ] 7. Página de muestra con todos sus estados. Verificación: revisión visual + lint + build.
**Criterios de aceptación**
- [ ] Todos usan solo tokens, son navegables con teclado y sus iconos son solo lucide.

### Tarea 0.4 · Seed visual · 1 h
Estado: [ ]
**Objetivo**: catálogo provisional listo en el frontend, con colores.
**Entradas**: `../biblioteca-provisional/`.
**Archivos**: `app/public/seed/imagenes/*`, `app/src/data/seed/productos.json`, `app/src/data/seed/generar-colores.js` (script único).
**Pasos**
- [ ] 1. Copiar imágenes y JSON. Verificación: 138 archivos de imagen.
- [ ] 2. Asignar colores de ejemplo (lista fija de ~12 con nombre y hex; 3 a 8 por producto, determinístico por código) y stock inicial de ejemplo. Marcar `"provisional": true`. Verificación: todos tienen ≥3 colores.
- [ ] 3. Reclasificar a mano las 3 categorías `VARIOS`.
- [ ] 4. Calcular precio USD con un tipo de cambio de ejemplo configurable (marcado como ejemplo). Verificación: ningún precio en 0.
**Criterios de aceptación**
- [ ] El JSON se importa sin errores y ninguna ruta de imagen está rota.

**Verificación de cierre de etapa**: `npm run build` + lint; ver `/` en 390px y 1440px; sin errores en consola. Luego pedir autorización para Etapa 1.
