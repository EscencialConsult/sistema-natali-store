# Base de datos de Modas Naty (Supabase)

Todo está en **un solo archivo idempotente: [`naty_schema.sql`](naty_schema.sql)** (regla de la skill `supabase-automatizacion-skill`; leer [`../SUPABASE-REGLAS.md`](../SUPABASE-REGLAS.md) primero). Todo lo que crea lleva el prefijo `naty_`, más la tabla maestra `proyectos`, y no toca nada de los otros proyectos de la instancia.

| Bloque del archivo | Qué hace |
|---|---|
| 0 | Tabla maestra `proyectos` (idéntica en todos los proyectos) |
| 1 | Tipos y tablas `naty_*`, índices, `updated_at` automático |
| 2 | Funciones: miembro/rol, **registrar venta**, **anular venta**, **guardar producto**, **alta de personas**, vista del catálogo público |
| 3 | Storage: bucket `naty_productos` |
| 4 | Permisos por rol (RLS) y privilegios mínimos |
| 5 | Ajustes base (tipo de cambio de ejemplo, etc.) |
| 6 | Registro del proyecto en `proyectos` |

## Cómo funciona la seguridad
- **Nada de lo delicado se escribe con INSERT/UPDATE directos.** Ventas, anulaciones y cambios de catálogo pasan por funciones que revisan quién es quién.
- **Solo leen los miembros** (perfil activo creado por la administración). En esta instancia compartida hay usuarios de otros proyectos: sin perfil no ven nada. No hay alta automática de perfiles.
- Cada vendedor ve solo sus ventas; administración y encargadas de tienda y de ventas ven todas.
- `anon` no tiene permisos sobre las tablas: el público solo lee la vista `naty_catalogo_publico` (sin stock ni costos; el precio, solo si la administración lo activa).
- La clave de la app es la pública (`anon`). La `service_role` y la contraseña de Postgres **nunca** van en la app ni en el repo.
- Detalle del modo de acceso y su excepción: [`../SUPABASE-REGLAS.md`](../SUPABASE-REGLAS.md).

## Puesta en marcha (proyecto propio de Supabase)
1. **Claves** (git ignora ambos archivos):
   - `app/.env.local` (la app): `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave *publishable*).
   - `app/.env.servidor.local` (solo para configurar): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (clave *secret*), `DATABASE_URL` (Session pooler, puerto 5432, contraseña codificada para URL) y `SUPABASE_ACCESS_TOKEN` (opcional).
2. **Esquema** (desde `app/`): `node --env-file=.env.servidor.local scripts/aplicar-schema.mjs --dry` (prueba y deshace) → lo mismo sin `--dry` (aplica) → `scripts/verificar-schema.mjs` (solo lectura).
3. **Login**: registro libre apagado y confirmación de correo apagada (Authentication → Sign In / Providers, o por API con el access token).
4. **Primer superadmin** (una sola vez, desde el SQL Editor o un script con `DATABASE_URL`): `select naty_crear_usuario_interno('<CI>', '<Nombre>', 'superadmin', '<contraseña>');`. El resto del equipo lo da de alta el superadmin desde la pantalla **Usuarios** de la app.
5. **Ingreso**: cada persona entra con su **CI** y contraseña. Supabase Auth usa un correo interno `<ci>@ci.modasnaty.internal` (no recibe correos); la app lo arma sola.
6. **Netlify**: cargar solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en las variables del sitio. Nunca la clave secreta.

> Estado (2026-10-09): proyecto propio en São Paulo (sa-east-1) con el esquema aplicado y verificado, login configurado y un superadmin inicial (CI provisorio 1000000).

## Probar sin tocar la nube
- **Pruebas automáticas** (sin Docker): `npm test` (desde `app/`) aplica `naty_schema.sql` (dos veces) sobre un Postgres real en memoria y comprueba permisos, ventas, anulaciones, catálogo, Storage, alta de usuarios, instancia compartida y la sincronización completa de la app.
- **Supabase local completo** (Auth + Storage + API reales): requiere Docker Desktop encendido. Baja varios GB la primera vez.

## Cosas a saber
- El número de nota (`NV-AM-0001`) lo arma cada dispositivo para vender sin internet. Si la misma persona vende desde dos dispositivos sin conexión a la vez, podrían repetirse números (la venta es válida y no se rechaza). Para revisarlo: `select numero, count(*) from naty_ventas group by numero having count(*) > 1;`
- Las iniciales de cada persona son únicas (forman el número de nota).
- Al reemplazar fotos de un producto, las anteriores quedan en Storage sin usar (limpieza pendiente; no afecta el funcionamiento).
- Quitar un color de un producto lo marca `eliminado` (no se borra): el stock y las ventas históricas lo siguen necesitando.

## Migrar a la cuenta de la clienta
Como todo es **un archivo idempotente**, la migración es corta:
1. Que la clienta cree su proyecto de Supabase y te dé acceso (o te pase URL, clave pública y clave de servicio por un canal seguro).
2. En el proyecto nuevo: correr `naty_schema.sql` completo, crear las personas y correr `usuarios.ejemplo.sql` con los correos reales.
3. Copiar los datos de las tablas `naty_*` del proyecto provisorio (`pg_dump --data-only` de esas tablas, importar en el nuevo, respetando el orden por claves foráneas) y los archivos del bucket `naty_productos`. Las contraseñas no se copian entre proyectos: se crean de nuevo o se envía "restablecer contraseña".
4. Cambiar las dos variables del `.env` de la app y volver a publicar. Comparar conteos (productos, ventas, fotos, usuarios) entre origen y destino.
5. **Borrar `naty_*` y el bucket del proyecto compartido** y marcar `naty` como `archivado` en `proyectos`.
