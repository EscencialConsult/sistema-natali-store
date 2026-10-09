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

## Puesta en marcha
1. **Subir el esquema:** Supabase → SQL Editor → New query → pegar `naty_schema.sql` **completo** → Run. Es re-ejecutable (correrlo de nuevo no rompe ni borra nada).
2. **Crear las personas:** Authentication → Users → *Add user* (correo + contraseña, "Auto Confirm User"), una por persona. Después copiar `usuarios.ejemplo.sql`, poner los correos reales (ver `Docs/05-equipo-y-roles.md`) y correrlo en el SQL Editor. **Hasta ese paso nadie puede entrar a la app**: no hay perfil automático.
3. **Conectar la app:** copiar `app/.env.example` como `app/.env.local` y completar la URL y la clave pública (Project Settings → API). Sin esas variables la app funciona en modo prueba, sin servidor.
4. Entrar con el correo y la contraseña de cada persona. La primera vez en cada dispositivo hace falta internet (baja el catálogo); después funciona sin conexión y se sincroniza sola.

> En la instancia compartida, **Authentication es compartida por todos los proyectos**: el registro libre y las plantillas de correo afectan a todos. Por eso la seguridad de Modas Naty no depende de eso sino de que exista el perfil.

## Probar sin tocar la nube
- **Pruebas automáticas** (sin Docker): `iniciar-dev.bat npm test` aplica `naty_schema.sql` (dos veces) sobre un Postgres real en memoria y comprueba permisos, ventas, anulaciones, catálogo, Storage, alta de usuarios, instancia compartida y la sincronización completa de la app.
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
