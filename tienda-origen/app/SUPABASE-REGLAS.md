# SUPABASE — Cómo funciona la base de este proyecto (tienda online)

> **LEER ANTES DE TOCAR CUALQUIER COSA DE BASE DE DATOS.**
> Esto aplica a personas y a IAs (Claude, Gemini, Codex, lo que sea).
> Este proyecto vive (provisoriamente) en un sistema compartido. Si rompés estas reglas,
> no rompés solo este proyecto: rompés los otros que viven en la misma instancia.

---

## Qué tenés que saber en 30 segundos

Este proyecto **no tiene un Supabase propio todavía**. Comparte una sola instancia con otros proyectos del Área ID. La separación entre proyectos es por **prefijo de nombre**, no por base ni por schema.

| | |
|---|---|
| Identificador / prefijo | `tienda` (y lee el catálogo compartido `naty_*` del sistema de notas de venta, decisión D4) |
| Todas sus tablas, funciones, vistas y tipos | `tienda_*` |
| Su bucket de Storage | `tienda_comprobantes` (privado); las fotos siguen en `naty_productos` |
| Archivo de esquema | `supabase/tienda_schema.sql` (requiere `naty_schema.sql` actualizado, que vive en `../SISTEMA DE NOTA/app/supabase/`) |
| Instancia | Supabase compartido de automatizaciones del Área ID — cuenta `areaidautomatizaciones@gmail.com`, ref `aaxrcacoavghapiqhkrn` (elegida por Facundo el 2026-10-08). Claves: `C:\Users\PERSONAL\.claude\secretos\supabase-automatizaciones.md`, **nunca** en el repo |
| Destino final | **Migrar a una cuenta de Supabase de la clienta** cuando el sistema esté terminado (ver `supabase/README.md`) |

---

## Las 5 reglas que no se rompen

1. **Un solo archivo SQL por proyecto. Nunca migrations sueltas.** Lo de la tienda va al **final** de `supabase/tienda_schema.sql`; lo del catálogo compartido va al final de `naty_schema.sql` en el sistema de nota (nunca se copia acá), como sección nueva con fecha.
2. **El archivo se puede correr dos veces sin romper nada** (`create table if not exists`, `create or replace function`, `drop policy if exists` antes de cada `create policy`, `on conflict` en cada `insert`). Las pruebas automáticas lo corren dos veces a propósito.
3. **Nada se toca desde el dashboard de Supabase.** Si un cambio no está en el `.sql`, no existe. La subida es manual (SQL Editor, archivo COMPLETO) o con el runner con transacción.
4. **El prefijo `tienda_` va en TODO lo nuevo.** Las tablas `naty_*` son del catálogo compartido y solo se extienden (columnas, valores de enum) desde su propio archivo. La única tabla sin prefijo es `proyectos`.
5. **Al terminar un hito se actualiza el registro:** el bloque final `insert into proyectos … on conflict do update` (lista real de tablas, `link_github`, `link_web`, `estado`).

---

## Límite del sistema — decisión registrada

La regla de la instancia compartida es la **escala del desarrollo**: automatizaciones acotadas van acá; plataformas de meses van a instancia dedicada. **Modas Naty (notas de venta + tienda online) es un sistema completo para una clienta**, o sea del lado de "dedicado".

> **Decisión de Facundo (2026-10-08):** se arma acá **de forma provisoria** y cuando esté todo terminado se migra a una cuenta de Supabase de la clienta. Se registra y no se vuelve a plantear.

Consecuencias: no cargar datos reales de la clienta en esta instancia más tiempo que el necesario para probar; la migración está pensada desde el día uno (un solo archivo SQL idempotente + guía en `supabase/README.md`).

---

## Modo de acceso: ABIERTO-AUTENTICADO + público por funciones — **decisión registrada 2026-10-09**

La tienda tiene compradoras **sin sesión**: `anon` no lee ninguna tabla; solo ejecuta `tienda_crear_pedido`, `tienda_pedido_publico` y `tienda_sitio_publico`, y lee la vista `tienda_catalogo_publico`. Cada función valida, bloquea el color (`for update`) y reserva stock del lado del servidor. Lo que requiere `service_role` (confirmar un pago en línea, crear pedidos del kiosco, vencer reservas) corre en **Netlify Functions**, nunca en el navegador. El panel usa la sesión de cada persona con RLS por rol, igual que el sistema de nota.

---

## Cómo se sube un cambio

1. Editar `supabase/naty_schema.sql` (sección nueva **al final**, con fecha).
2. Correr las pruebas: `iniciar-dev.bat npm test` (aplican el archivo, dos veces, sobre un Postgres real en memoria y verifican permisos y sincronización).
3. Subir: Supabase → SQL Editor → New query → pegar el archivo **COMPLETO** → Run. O el runner `scripts/aplicar-schema.mjs` (manda el archivo completo en **una transacción** por el Session pooler 5432; con `--dry` hace todo y deshace). Facundo autorizó el runner para este proyecto (2026-10-08).

---

## Credenciales

**No están en este repo ni en `cerebro-facundo`.** Están en `C:\Users\PERSONAL\.claude\secretos\supabase-automatizaciones.md`. En la app solo va la URL y la clave pública (`anon`) en `.env.local`. La contraseña de Postgres y la `service_role` nunca van a una variable `VITE_*`.

---

## Estado actual de este proyecto

| | |
|---|---|
| Estado | `en_desarrollo` — esquema escrito y probado en memoria (2026-10-09); **todavía NO aplicado** en la instancia compartida (espera OK de Facundo) |
| Tablas | `tienda_pedidos`, `tienda_pedido_items`, `tienda_pedido_historial`, `tienda_pagos`, `tienda_webhook_eventos`, `tienda_gasto_categorias`, `tienda_gastos`, `tienda_kiosco_dispositivos`, `tienda_config` + vista `tienda_catalogo_publico` |
| Funciones | `tienda_crear_pedido`, `tienda_confirmar_pago`, `tienda_cambiar_estado`, `tienda_vencer_reservas`, `tienda_pedido_publico`, `tienda_sitio_publico`, `tienda_disponible`, `tienda_transicion_valida` |
| Buckets | `tienda_comprobantes` (privado) |
| Modo de acceso | público por funciones + sesión de cada persona con RLS (ver arriba) |
| GitHub | https://github.com/EscencialConsult/tienda-natali-online |
| Web | _(sin publicar todavía)_ |

*Si algo de acá quedó desactualizado respecto del `.sql`, el `.sql` manda — y hay que corregir este archivo.*
