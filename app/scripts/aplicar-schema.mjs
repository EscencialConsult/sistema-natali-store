// Aplica supabase/naty_schema.sql a la instancia de Supabase indicada por DATABASE_URL (Session pooler, puerto 5432).
//   node scripts/aplicar-schema.mjs --inspeccionar   Solo LECTURA: qué hay en la instancia y si el identificador está libre.
//   node scripts/aplicar-schema.mjs --dry            Aplica el archivo completo en una transacción y la DESHACE (rollback).
//   node scripts/aplicar-schema.mjs                  Aplica el archivo completo en una transacción y confirma (commit).
// Reglas de la skill: se manda el archivo COMPLETO (nunca partido en sentencias) y dentro de una transacción, para que un error
// no deje la base a medio aplicar. La connection string trae la contraseña de Postgres: va en una variable de entorno, NUNCA en el repo.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL (Session pooler, puerto 5432). Ver C:\\Users\\PERSONAL\\.claude\\secretos\\supabase-automatizaciones.md')
  process.exit(1)
}
if (url.includes(':6543')) {
  console.error('Ese es el Transaction pooler (6543): no sirve para aplicar esquemas. Usá el Session pooler (5432).')
  process.exit(1)
}
const modo = process.argv.includes('--inspeccionar') ? 'inspeccionar' : process.argv.includes('--dry') ? 'dry' : 'aplicar'
const archivo = fileURLToPath(new URL('../supabase/naty_schema.sql', import.meta.url))

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, statement_timeout: 120_000 })
const q = async (sql, params) => (await cliente.query(sql, params)).rows

async function inspeccionar() {
  const [{ version }] = await q('select version()')
  console.log('Postgres:', version.split(' ').slice(0, 2).join(' '))
  const maestra = await q("select to_regclass('public.proyectos') as t")
  if (maestra[0].t) {
    console.log('\nProyectos registrados:')
    for (const p of await q('select identificador, estado from proyectos order by identificador')) console.log(` - ${p.identificador} (${p.estado})`)
  } else {
    console.log('\nLa tabla maestra `proyectos` todavía no existe (la crea el archivo).')
  }
  const tablas = await q("select tablename from pg_tables where schemaname = 'public' order by 1")
  console.log('\nTablas en public (solo nombres):', tablas.map((t) => t.tablename).join(', ') || '(ninguna)')
  const choques = await q("select 'tabla' as tipo, tablename as nombre from pg_tables where schemaname = 'public' and tablename like 'naty\\_%' union all select 'funcion', proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and proname like 'naty\\_%' union all select 'tipo', typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and typname like 'naty\\_%' and typtype = 'e'")
  console.log('\nObjetos naty_* ya existentes:', choques.length ? choques.map((c) => `${c.tipo}:${c.nombre}`).join(', ') : 'ninguno (identificador libre)')
  const fn = await q("select pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'set_actualizado'")
  console.log('\nFunción compartida set_actualizado():', fn.length ? 'existe' : 'no existe (la crea el archivo)')
  if (fn.length) console.log(fn[0].def.replace(/\s+/g, ' ').trim())
  const triggersAuth = await q("select t.tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal")
  console.log('\nTriggers sobre auth.users (de otros proyectos):', triggersAuth.map((t) => t.tgname).join(', ') || 'ninguno')
  const usuarios = await q('select count(*)::int as c from auth.users')
  console.log('Usuarios de Auth en la instancia (cantidad):', usuarios[0].c)
  const bucket = await q("select id from storage.buckets where id like 'naty\\_%'")
  console.log('Buckets naty_*:', bucket.map((b) => b.id).join(', ') || 'ninguno')
}

async function aplicar(confirmar) {
  const sql = readFileSync(archivo, 'utf8')
  await cliente.query('begin')
  try {
    await cliente.query(sql)
    if (confirmar) {
      await cliente.query('commit')
      console.log('OK: esquema aplicado y confirmado (commit).')
    } else {
      await cliente.query('rollback')
      console.log('OK: el archivo completo se aplicó sin errores y se DESHIZO (rollback). No quedó nada.')
    }
  } catch (e) {
    await cliente.query('rollback')
    console.error('ERROR: se deshizo todo (rollback). Nada quedó a medias.\n', e.message, e.position ? `(posición ${e.position})` : '')
    process.exitCode = 1
  }
}

try {
  await cliente.connect()
  if (modo === 'inspeccionar') await inspeccionar()
  else await aplicar(modo === 'aplicar')
} finally {
  await cliente.end()
}
