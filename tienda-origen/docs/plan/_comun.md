# Reglas comunes a todas las etapas

Método: skill `metodo-etapas-tareas`. Marcas: `[ ]` pendiente · `[~]` en curso · `[x] (fecha)` hecho · `[!]` bloqueado (con causa).

## Ubicaciones
- Código: `TIENDA ONLINE/app/` (clonado del sistema de nota el 2026-10-09; se poda en la Etapa 0). Documentación: `TIENDA ONLINE/docs/`.
- Sistema hermano (lógica de catálogo, esquema, componentes de referencia): `../SISTEMA DE NOTA/` — se **lee**, nunca se edita desde acá.
- Seed de desarrollo: `app/public/seed/` y `app/src/data/seed/productos.json` (138 productos de prueba, fotos de otra marca: solo para desarrollo, nunca publicar).
- Referencia visual: `docs/referencias/diseno/README.md` + capturas; `docs/referencias/DESIGN-sistema-de-nota.md`; plan de rediseño "de tienda" en `docs/referencias/rediseno-tienda-PLAN.md`.
- Contexto: `docs/01..07-*.md`. Leer siempre `04-arquitectura.md` antes de tocar datos y `05-pagos.md` antes de tocar pagos.
- Serverless: `app/netlify/functions/`. Esquema: `app/supabase/tienda_schema.sql` (más los agregados a `naty_schema.sql` del sistema hermano, decisión D4).

## Comandos de verificación
- Siempre desde la unidad `R:` (el `#` de la ruta rompe Vite): `iniciar-dev.bat` (dev), `iniciar-dev.bat npm run build`, `iniciar-dev.bat npm test`, `iniciar-dev.bat npx oxlint src`.
- Revisar en **390 px** (celular), **1440 px** (escritorio) y, para el kiosco, la resolución real del equipo (bloqueo B-K1; mientras tanto 1024×768 táctil).
- Offline: DevTools → Network → Offline; sitio y kiosco deben seguir mostrando el catálogo.
- Netlify Functions en local: `netlify dev` (CLI de Netlify) desde `R:\app`.
- Accesibilidad: axe-core sobre cada pantalla nueva antes de cerrar la tarea (WCAG 2.1 AA, sin infracciones).

## Estándar de código (resumen del método)
- Estados de **carga, error y vacío** siempre.
- Dinero en **centavos enteros**; formateo solo en `src/lib/moneda.js`. Moneda de la tienda: `bs`.
- Fechas: solo `src/lib/fechas.js`, con `timeZone: 'America/La_Paz'` explícito. Nunca `new Date().toLocaleDateString()` suelto.
- Efectos que piden datos: bandera `vigente`/AbortController.
- Botones de guardar y de pagar deshabilitados mientras procesan (anti doble envío); idempotencia en el servidor además.
- Sin `<select>` nativo: `Select.jsx` / `BuscadorLista.jsx`.
- Sin duplicar utilidades: van a `src/lib/`.
- Solo tokens de diseño (`tokens.css` + `DESIGN.md`); sin colores sueltos ni emojis. Iconos: solo `lucide-react`.
- Animación: skill `animate`; solo con propósito; respetar `prefers-reduced-motion`.
- Las pantallas hablan con repositorios (`src/data/repos`), nunca con Supabase ni Dexie directo. Las Netlify Functions son las únicas que usan `service_role`.
- Nada sensible en `VITE_*`. Claves de pasarela y `service_role` solo en variables de entorno de Netlify.
- Textos de la interfaz en español rioplatense neutro para Bolivia ("tocá", "elegí"), sin regionalismos argentinos marcados ("vos" está bien; "plata" no, "dinero" o "pago").
- Comentarios solo para un porqué no obvio.
- Celular primero para el sitio; **táctil primero** para el kiosco (56 px, 18 px base); escritorio primero para el panel (tablas), pero usable en celular.

## Reglas de proceso
- Arrancar una etapa nueva exige autorización explícita de Facundo.
- Datos de negocio que faltan (precios, textos, cuenta de pagos, equipo del kiosco) = bloqueo `[!]`, nunca inventar.
- Nada de commit/push hasta que Facundo lo pida.
- Los pasos detallados de cada tarea se escriben **al autorizar la etapa**, siguiendo la plantilla del método (Objetivo, Entradas, Archivos, Pasos con verificación, Código de referencia, Criterios, Verificación final, Bloqueos). Hasta entonces cada tarea tiene objetivo, alcance, archivos, criterios y bloqueos.
- UX primero: cada decisión se justifica por el efecto en la compradora (sin instrucciones), en la persona frente al kiosco (sin ayuda) o en Natali (sin miedo a romper algo).
- Al cerrar cada etapa: `notas-etapa-N.md` con qué quedó hecho, qué quedó afuera y qué aprendimos.

## Bloqueos globales
Ver `../07-preguntas-abiertas-y-bloqueos.md`. Los que frenan etapas: B-P1 (pasarela en Bolivia, etapa 5), B-K1 (equipo kiosco, etapa 6), B-C1/B-C2 (precios minoristas y qué se publica, etapa 2), B-E1 (envíos, etapa 3), B-S1/B-S2 (textos, logo, datos del local, etapa 1).
