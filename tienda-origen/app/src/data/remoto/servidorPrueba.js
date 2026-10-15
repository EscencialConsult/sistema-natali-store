// Herramientas SOLO para pruebas: un "Supabase" en memoria. Postgres real (PGlite) con los DOS esquemas reales
// (naty_schema.sql del sistema de nota + tienda_schema.sql) y sus permisos. Cada llamada se ejecuta como un usuario
// concreto (rol `authenticated` + id), como anónimo (`anon`) o como servicio (sin rol: bypass de RLS, igual que service_role).
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

// naty_schema.sql vive en el repo hermano (decisión D4). Las pruebas corren desde la unidad R: (que monta solo TIENDA ONLINE),
// así que la ruta relativa no alcanza: se prueba también la ruta real y la variable NATY_SCHEMA.
const candidatosNaty = [
  process.env.NATY_SCHEMA,
  fileURLToPath(new URL('../../../../../SISTEMA DE NOTA/app/supabase/naty_schema.sql', import.meta.url)),
  'C:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS PERSONALIZADO/MODAS NATALI/SISTEMA DE NOTA/app/supabase/naty_schema.sql',
].filter(Boolean)
const rutaNaty = candidatosNaty.find((r) => existsSync(r))
if (!rutaNaty) throw new Error(`No encuentro naty_schema.sql (probé: ${candidatosNaty.join(' · ')}). Definí NATY_SCHEMA.`)

export const ESQUEMA_NATY = readFileSync(rutaNaty, 'utf8')
export const ESQUEMA_TIENDA = readFileSync(fileURLToPath(new URL('../../../supabase/tienda_schema.sql', import.meta.url)), 'utf8')

export const STUB = `
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

export const USUARIOS = {
  admin: { id: '00000000-0000-4000-8000-000000000001', nombre: 'Natali', iniciales: 'NT', rol: 'admin' },
  pamela: { id: '00000000-0000-4000-8000-000000000005', nombre: 'Pamela Aramayo', iniciales: 'PA', rol: 'enc_tienda' },
  maria: { id: '00000000-0000-4000-8000-000000000004', nombre: 'María Córdoba', iniciales: 'MC', rol: 'enc_deposito' },
  ariel: { id: '00000000-0000-4000-8000-000000000002', nombre: 'Ariel Maydana', iniciales: 'AM', rol: 'vendedor' },
}
export const INTRUSO = '00000000-0000-4000-8000-000000000099'

export async function aplicarEsquemas(db) {
  await db.exec(ESQUEMA_NATY)
  await db.exec(ESQUEMA_TIENDA)
}

export async function crearServidor() {
  const db = new PGlite()
  await db.exec(STUB)
  await aplicarEsquemas(db)
  for (const u of Object.values(USUARIOS)) {
    const email = `${u.iniciales.toLowerCase()}@test.local`
    await db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, email])
    await db.query('select naty_configurar_usuario($1, $2, $3, $4)', [email, u.rol, u.nombre, u.iniciales])
  }
  await db.query('insert into auth.users (id, email) values ($1, $2)', [INTRUSO, 'intruso@test.local'])
  return db
}

// Ejecuta `fn` como un usuario (id), como anónimo (null) o como servicio ('servicio').
export async function como(db, quien, fn) {
  if (quien === 'servicio') return fn()
  await db.exec(`set role ${quien ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${quien ?? ''}', false); select set_config('request.jwt.claim.role', '${quien ? 'authenticated' : 'anon'}', false);`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claim.role', '', false);`)
  }
}

export const q = async (db, sql, params) => (await db.query(sql, params)).rows
export const rpc = async (db, nombre, p) => (await db.query(`select ${nombre}($1::jsonb) as r`, [JSON.stringify(p)])).rows[0].r
