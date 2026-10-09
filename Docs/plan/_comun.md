# Reglas comunes a todas las etapas

Método: skill `metodo-etapas-tareas`. Marcas: `[ ]` pendiente · `[~]` en curso · `[x] (fecha)` hecho · `[!]` bloqueado (con causa).

## Ubicaciones
- Código: `MODAS NATALI/app/` (se crea en la tarea 0.1). Documentación: `MODAS NATALI/Docs/`.
- Seed: `Docs/biblioteca-provisional/` (productos.json + imagenes/). Se copia a `app/src/data/seed/` y `app/public/seed/`.
- Referencia visual: `Docs/referencias/diseno/README.md` + capturas. Demo del ERP: `HTML-DEMO.html` (lógica de ventas/stock/comisiones a imitar).
- Contexto: `Docs/01..06-*.md`.

## Comandos de verificación
- `npm run build` (vite build) y `npx oxlint src` antes de marcar un paso de código.
- `npm run dev` y revisar en 390px (celular) y 1440px (escritorio).
- Offline: DevTools → Network → Offline; la app debe seguir funcionando.

## Estándar de código (resumen del método)
- Estados de **carga, error y vacío** siempre.
- Dinero en **centavos enteros**; formateo solo en `src/lib/moneda.js`.
- Efectos que piden datos: bandera `vigente`/AbortController.
- Botones de guardar deshabilitados mientras guarda o no valida (anti doble envío).
- Sin `<select>` nativo: `Select.jsx` (lista corta) / `BuscadorLista.jsx` (lista larga).
- Sin duplicar utilidades: van a `src/lib/`.
- Solo tokens de diseño (Tailwind tokens + DESIGN.md); sin colores sueltos ni emojis.
- Iconos: solo `lucide-react`.
- Animación: skill `animate`; solo con propósito, duración corta, respetar `prefers-reduced-motion`.
- Comentarios solo para un porqué no obvio.
- Pantallas pensadas para **celular primero** (el vendedor atiende de pie con el teléfono).
- Las pantallas hablan con repositorios (`src/data/repos`), nunca con Supabase ni Dexie directo.

## Reglas de proceso
- Arrancar una etapa nueva exige autorización explícita de Facundo.
- Datos de negocio que faltan (comisión, teléfonos, logo) = bloqueo `[!]`, nunca inventar.
- Nada de commit/push hasta que Facundo lo pida (GitHub se conecta al final, ver etapa 9).
- UX primero: cada decisión se justifica por el efecto en el vendedor atendiendo rápido, sin instrucciones.

## Bloqueos globales (se destraban con Natali)
- B1 · Regla de comisión completa ("solo se vende por docena o …").
- B2 · Logo en buena calidad.
- B3 · Teléfonos de vendedores y encargada de tienda.
- B4 · URL pública definitiva del catálogo (para el QR).
- B5 · Tipo de cambio: ¿fijo configurable o manual por venta? ¿USD/Bs/ARS?
- B6 · Permisos exactos de cada encargada.
- B7 · Carga masiva: ¿desde qué (carpeta de fotos, Excel)?
