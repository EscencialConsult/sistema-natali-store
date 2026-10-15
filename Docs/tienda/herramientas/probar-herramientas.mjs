// Prueba las tres herramientas contra el esquema REAL de Renzo en un Postgres en memoria (PGlite).
// Uso: node Docs/tienda/herramientas/probar-herramientas.mjs   (desde la raíz del repo)
import { createRequire } from 'node:module'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const RAIZ = resolve(import.meta.dirname, '..', '..', '..')
const require = createRequire(join(RAIZ, 'app', 'package.json'))
const { PGlite } = await import(pathToFileURL(require.resolve('@electric-sql/pglite')).href)
const { respaldar } = await import('./respaldo.mjs')
const { comparar, diferenciasDeFilas } = await import('./comparar-linea-base.mjs')

const STUB = `
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`
const db = new PGlite()
await db.exec(STUB)
await db.exec(readFileSync(join(RAIZ, 'app', 'supabase', 'naty_schema.sql'), 'utf8'))
const sql = readFileSync(join(import.meta.dirname, 'linea-base.sql'), 'utf8')
const foto = async () => JSON.parse((await db.query(sql)).rows[0].linea_base)

// 1. La línea base corre y trae lo esperado.
const antes = await foto()
const nombres = antes.relaciones.map((r) => r.nombre)
assert.ok(nombres.includes('naty_productos') && nombres.includes('naty_catalogo_publico'), 'faltan relaciones')
assert.ok(antes.funciones.some((f) => f.nombre === 'naty_guardar_producto'), 'falta naty_guardar_producto')
assert.ok(antes.permisos_tablas.some((p) => p.tabla === 'naty_catalogo_publico' && p.para === 'anon'), 'falta el permiso anon de la vista pública')
assert.ok(antes.config_claves.includes('tipo_cambio'), 'falta la clave tipo_cambio')
assert.equal(typeof antes.filas.naty_ventas, 'number')
// No debe traer valores de configuración ni datos de personas.
assert.ok(!JSON.stringify(antes).includes('whatsapp_tienda":"'), 'no debe incluir valores de config')

// 2. Sin cambios, la comparación da vacío.
assert.deepEqual(comparar(antes, await foto()), [])

// 3. Un cambio aditivo tienda_* NO se reporta como cambio de Renzo.
await db.exec(`create table tienda_config (clave text primary key, valor jsonb, publico boolean not null default false);
               create view tienda_ajustes_publicos as select clave from tienda_config where publico;`)
assert.deepEqual(comparar(antes, await foto()), [], 'objetos tienda_* no deben contar como cambio')

// 4. Un cambio real sobre un objeto de Renzo SÍ se detecta (columna, política, permiso y función).
await db.exec(`alter table naty_productos add column prueba_ext int;`)
await db.exec(`grant select on naty_config to anon;`)
await db.exec(`create or replace function naty_slug_extra() returns int language sql as 'select 1';`)
const cambios = comparar(antes, await foto())
assert.ok(cambios.some((c) => c.includes('columnas: AGREGADO naty_productos | prueba_ext')), 'no detectó columna nueva: ' + cambios)
assert.ok(cambios.some((c) => c.includes('permisos_tablas: AGREGADO naty_config | anon | SELECT')), 'no detectó permiso nuevo')
assert.ok(cambios.some((c) => c.startsWith('funciones: AGREGADO naty_slug_extra')), 'no detectó función nueva')

// 5. Filas: informativo.
await db.exec(`insert into naty_categorias (id, nombre, orden) values (gen_random_uuid(), 'X', 0)`)
assert.ok(diferenciasDeFilas(antes, await foto()).some((l) => l.startsWith('naty_categorias')))

// 6. El respaldo escribe todas las tablas, es de solo lectura y rechaza carpetas dentro del repo.
const dir = mkdtempSync(join(tmpdir(), 'respaldo-prueba-'))
try {
  const m = await respaldar((s) => db.query(s), dir)
  assert.ok(m.tablas.naty_categorias.filas === 1 && 'naty_productos' in m.tablas && 'proyectos' in m.tablas)
  await assert.rejects(respaldar((s) => db.query(s), join(RAIZ, 'Docs', 'respaldo-prohibido')), /dentro del repositorio/)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log('OK · línea base, comparación y respaldo verificados contra el esquema real de Renzo en PGlite')
