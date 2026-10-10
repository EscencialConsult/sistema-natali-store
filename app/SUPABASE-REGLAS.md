# SUPABASE — Cómo funciona la base de este proyecto

> **LEER ANTES DE TOCAR CUALQUIER COSA DE BASE DE DATOS.**
> Esto aplica a personas y a IAs (Claude, Gemini, Codex, lo que sea).
> Este proyecto vive (provisoriamente) en un sistema compartido. Si rompés estas reglas,
> no rompés solo este proyecto: rompés los otros que viven en la misma instancia.

---

## Qué tenés que saber en 30 segundos

Este proyecto **no tiene un Supabase propio todavía**. Comparte una sola instancia con otros proyectos del Área ID. La separación entre proyectos es por **prefijo de nombre**, no por base ni por schema.

| | |
|---|---|
| Identificador / prefijo | `naty` |
| Todas sus tablas, funciones, vistas y tipos | `naty_*` |
| Su bucket de Storage | `naty_productos` |
| Archivo de esquema | `supabase/naty_schema.sql` |
| Instancia | Supabase compartido de automatizaciones del Área ID — cuenta `areaidautomatizaciones@gmail.com`, ref `aaxrcacoavghapiqhkrn` (elegida por Facundo el 2026-10-08). Claves: `C:\Users\PERSONAL\.claude\secretos\supabase-automatizaciones.md`, **nunca** en el repo |
| Destino final | **Migrar a una cuenta de Supabase de la clienta** cuando el sistema esté terminado (ver `supabase/README.md`) |

---

## Las 5 reglas que no se rompen

1. **Un solo archivo SQL. Nunca migrations sueltas.** Todo cambio de base se agrega al **final** de `supabase/naty_schema.sql`, como sección nueva con fecha.
2. **El archivo se puede correr dos veces sin romper nada** (`create table if not exists`, `create or replace function`, `drop policy if exists` antes de cada `create policy`, `on conflict` en cada `insert`). Las pruebas automáticas lo corren dos veces a propósito.
3. **Nada se toca desde el dashboard de Supabase.** Si un cambio no está en el `.sql`, no existe. La subida es manual (SQL Editor, archivo COMPLETO) o con el runner con transacción.
4. **El prefijo `naty_` va en TODO.** La única tabla sin prefijo es `proyectos` (registro central): no se borra, no se renombra.
5. **Al terminar un hito se actualiza el registro:** el bloque final `insert into proyectos … on conflict do update` (lista real de tablas, `link_github`, `link_web`, `estado`).

---

## Límite del sistema — decisión registrada

La regla de la instancia compartida es la **escala del desarrollo**: automatizaciones acotadas van acá; plataformas de meses van a instancia dedicada. **Modas Naty es un sistema completo para una clienta** (≈ 110 horas de trabajo, con roadmap propio), o sea del lado de "dedicado".

> **Decisión de Facundo (2026-10-08):** se arma acá **de forma provisoria** y cuando esté todo terminado se migra a una cuenta de Supabase de la clienta. Se registra y no se vuelve a plantear.

Consecuencias: no cargar datos reales de la clienta en esta instancia más tiempo que el necesario para probar; la migración está pensada desde el día uno (un solo archivo SQL idempotente + guía en `supabase/README.md`).

---

## Modo de acceso: ABIERTO-AUTENTICADO (excepción a "datos sensibles → CERRADO") — **decisión de Facundo, 2026-10-08**

El sistema maneja **plata y datos de clientas** (ventas, importes, nombres y teléfonos), que según la skill exigen MODO CERRADO (todo server-side con `service_role`, RLS sin políticas). Pero este sistema es un **PWA que funciona sin internet** y habla directo con Supabase con la sesión de cada persona; cerrarlo del todo exigiría un servidor intermedio (Edge Functions) que no existe en el diseño.

Para no abrir la instancia compartida, el modo aplicado es **ABIERTO-AUTENTICADO endurecido**:

1. **`anon` no tiene ninguna política ni permiso** sobre las tablas `naty_*`: la clave pública (que viaja en el navegador y sirve para toda la instancia) **no abre nada**, salvo la vista `naty_catalogo_publico` (catálogo para clientas: sin stock, sin costos, sin ventas; el precio solo si la administración lo activa).
2. **Solo leen los miembros:** hace falta un perfil activo en `naty_perfiles`, creado a mano por la administración con `naty_configurar_usuario(...)`. En esta instancia hay usuarios de **otros proyectos** (Eneagrama, Prode, etc.): sin perfil, ven y hacen **cero** cosas acá. **No hay trigger sobre `auth.users`** (cada usuario nuevo de otro proyecto se habría vuelto vendedor de Modas Naty).
3. **Lo delicado no se escribe con INSERT/UPDATE directos:** ventas, anulaciones y catálogo pasan por funciones `naty_*` (`SECURITY DEFINER`) que revisan rol, titularidad y totales.
4. Cada vendedor ve solo sus ventas; administración y encargadas de tienda y de ventas ven todas.
5. La `service_role` jamás va en la app (solo la clave `anon`, en `.env.local` ignorado por git).

> **Decisión de Facundo (2026-10-08):** se acepta esta excepción **mientras el sistema sea provisorio en la instancia compartida**. Para pasar a **CERRADO estricto** haría falta un backend intermedio (Edge Functions con `service_role`) y reescribir la sincronización; no se hace porque el destino final es una cuenta propia de la clienta, donde este modo es el normal.

---

## Cómo se sube un cambio

1. Editar `supabase/naty_schema.sql` (sección nueva **al final**, con fecha).
2. Correr las pruebas: `npm test` (desde `app/`) (aplican el archivo, dos veces, sobre un Postgres real en memoria y verifican permisos y sincronización).
3. Subir: Supabase → SQL Editor → New query → pegar el archivo **COMPLETO** → Run. O el runner `scripts/aplicar-schema.mjs` (manda el archivo completo en **una transacción** por el Session pooler 5432; con `--dry` hace todo y deshace). Facundo autorizó el runner para este proyecto (2026-10-08).

---

## Credenciales

**No están en este repo ni en `cerebro-facundo`.** Están en `C:\Users\PERSONAL\.claude\secretos\supabase-automatizaciones.md`. En la app solo va la URL y la clave pública (`anon`) en `.env.local`. La contraseña de Postgres y la `service_role` nunca van a una variable `VITE_*`.

---

## Estado actual de este proyecto

| | |
|---|---|
| Estado | `en_desarrollo` — esquema aplicado el 2026-10-08, 7 personas dadas de alta, 138 productos de EJEMPLO cargados |
| Tablas | `naty_perfiles`, `naty_categorias`, `naty_productos`, `naty_producto_colores`, `naty_producto_fotos`, `naty_ventas`, `naty_venta_items`, `naty_movimientos_stock`, `naty_config`, `naty_limpiezas` + vista `naty_catalogo_publico` |
| Funciones | `naty_registrar_venta`, `naty_anular_venta`, `naty_guardar_producto`, `naty_eliminar_productos`, `naty_eliminar_productos_de_baja`, `naty_borrar_ventas`, `naty_resumir_movimientos`, `naty_previsualizar_limpieza`, `naty_configurar_usuario`, `naty_es_miembro`, `naty_es_rol`, `naty_rol_actual` |
| Buckets | `naty_productos` (lectura pública) |
| Modo de acceso | frontend con `anon` + sesión de cada persona (ABIERTO-AUTENTICADO, ver arriba) |
| GitHub | _(sin repo todavía)_ |
| Web | _(sin publicar todavía)_ |

*Si algo de acá quedó desactualizado respecto del `.sql`, el `.sql` manda — y hay que corregir este archivo.*
