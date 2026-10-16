# Cómo publicar la tienda en Netlify (versión de prueba para Natali)

Esta versión corre en **modo demostración**: sin servidor, con 138 productos de ejemplo guardados en el navegador de cada persona. Sirve para que Natali recorra todo. No cobra de verdad ni comparte datos entre dispositivos.

## 1. Repositorio
El código ya está en `EscencialConsult/tienda-natali-online` (privado, rama `main`). Si preferís otro repo, creá uno vacío y corré:

```
git remote set-url origin https://github.com/<cuenta>/<repo>.git
git push -u origin main
```

## 2. Sitio en Netlify
1. Netlify → **Add new site → Import an existing project** → elegí el repo.
2. No cambies nada: `netlify.toml` ya define carpeta base `app`, comando de build y carpeta de salida.
3. Antes de desplegar, en **Site configuration → Environment variables** agregá una sola variable:

| Variable | Valor |
|---|---|
| `VITE_MODO_DEMO` | `1` |

4. Deploy. Cuando termine, Netlify te da una URL tipo `https://nombre.netlify.app`. Podés cambiarla en *Domain management → Options → Edit site name*.

## 3. Qué NO cargar todavía
No pongas variables de Supabase ni de Mercado Pago. Con ellas la app deja el modo demo y busca un servidor que aún no tiene el esquema aplicado.

## 4. Pasar a producción real (más adelante)
Orden: aplicar `app/supabase/tienda_schema.sql` en Supabase, cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, después las variables privadas de las Functions (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`) y quitar `VITE_MODO_DEMO`. Detalle en `docs/05-pagos.md` y `docs/plan/etapa-9.md`.
