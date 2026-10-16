# app — Tienda online Modas Naty

React 19 + Vite + Tailwind v4 + lucide + Dexie + Supabase + Netlify Functions. Documentación y plan en `../docs/`. Contexto para IA en `CLAUDE.md`.

## Correr en local
La carpeta del proyecto tiene `#` en la ruta y eso rompe Vite. Desde la raíz del proyecto, `iniciar-dev.bat` monta la carpeta como unidad `R:` y levanta el servidor:

```
iniciar-dev.bat                      → npm run dev (http://localhost:5173)
iniciar-dev.bat npm run build
iniciar-dev.bat npx vitest run --root R:\app
iniciar-dev.bat npx oxlint src
iniciar-dev.bat npx netlify dev      → sitio + functions (necesita netlify/.env con las variables de netlify/.env.example)
```

Sin `.env.local` la app corre en modo prueba: datos de ejemplo (138 productos de otra marca, solo para desarrollo), login de prueba con PIN `0000` y pago simulado. Con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` usa el servidor.

## Zonas
| URL | Qué es |
|---|---|
| `/` | Sitio público: inicio, catálogo, carrito, checkout, pedido |
| `/kiosco` | Kiosco táctil del local (se activa con PIN) |
| `/administracion` | Login y panel de administración |
