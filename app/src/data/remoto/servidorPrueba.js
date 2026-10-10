// Herramientas SOLO para pruebas: un "Supabase" en memoria. Postgres real (PGlite) con las migraciones y permisos reales,
// y un cliente que imita la parte de la API de supabase-js que usa la app (from/select/upsert/update, rpc y storage).
// Cada llamada se ejecuta como un usuario concreto (rol `authenticated` + id), así los permisos (RLS) se aplican de verdad.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const esquema = readFileSync(fileURLToPath(new URL('../../../supabase/naty_schema.sql', import.meta.url)), 'utf8')

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

export const USUARIOS = {
  admin: { id: '00000000-0000-4000-8000-000000000001', nombre: 'Natali', iniciales: 'NT', rol: 'admin' },
  ariel: { id: '00000000-0000-4000-8000-000000000002', nombre: 'Ariel Maydana', iniciales: 'AM', rol: 'vendedor' },
  brayan: { id: '00000000-0000-4000-8000-000000000003', nombre: 'Brayan Aquino', iniciales: 'BA', rol: 'vendedor' },
  maria: { id: '00000000-0000-4000-8000-000000000004', nombre: 'María Córdoba', iniciales: 'MC', rol: 'enc_deposito' },
  pamela: { id: '00000000-0000-4000-8000-000000000005', nombre: 'Pamela Aramayo', iniciales: 'PA', rol: 'enc_tienda' },
}

export async function crearServidor() {
  const db = new PGlite()
  await db.exec(STUB)
  await db.exec(esquema)
  for (const u of Object.values(USUARIOS)) {
    const email = `${u.iniciales.toLowerCase()}@test.local`
    await db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, email])
    await db.query('select naty_configurar_usuario($1, $2, $3, $4)', [email, u.rol, u.nombre, u.iniciales])
  }
  return { db, archivos: new Map() }
}

const identificador = (nombre) => {
  if (!/^[a-z_]+$/.test(nombre)) throw new Error(`Nombre inválido: ${nombre}`)
  return `"${nombre}"`
}

// Devuelve un cliente con la forma de supabase-js, que actúa como `usuarioId` (null = anónimo).
export function clienteDe(servidor, usuarioId) {
  const { db } = servidor
  const como = async (fn) => {
    await db.exec(`set role ${usuarioId ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${usuarioId ?? ''}', false);`)
    try {
      return await fn()
    } finally {
      await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
    }
  }
  const respuesta = async (fn) => {
    try {
      return { data: await como(fn), error: null }
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code } }
    }
  }

  class Consulta {
    constructor(tabla) {
      Object.assign(this, { tabla: identificador(tabla), condiciones: [], params: [], orden: null, rango: null, op: 'select', cuerpo: null, opciones: {} })
    }
    select() {
      return this
    }
    #condicion(columna, operador, valor) {
      this.params.push(valor)
      this.condiciones.push(`${identificador(columna)} ${operador} $${this.params.length}`)
      return this
    }
    gt(c, v) {
      return this.#condicion(c, '>', v)
    }
    eq(c, v) {
      return this.#condicion(c, '=', v)
    }
    in(c, lista) {
      this.params.push(JSON.stringify(lista))
      this.condiciones.push(`${identificador(c)}::text in (select json_array_elements_text($${this.params.length}::json))`)
      return this
    }
    order(c, { ascending = true } = {}) {
      this.orden = `${identificador(c)} ${ascending ? 'asc' : 'desc'}`
      return this
    }
    range(a, b) {
      this.rango = [a, b]
      return this
    }
    upsert(filas, opciones = {}) {
      Object.assign(this, { op: 'upsert', cuerpo: Array.isArray(filas) ? filas : [filas], opciones })
      return this
    }
    update(valores) {
      Object.assign(this, { op: 'update', cuerpo: valores })
      return this
    }
    then(ok, mal) {
      return respuesta(async () => {
        const where = this.condiciones.length ? ` where ${this.condiciones.join(' and ')}` : ''
        if (this.op === 'select') {
          const limite = this.rango ? ` limit ${this.rango[1] - this.rango[0] + 1} offset ${this.rango[0]}` : ''
          const sql = `select coalesce(json_agg(t), '[]'::json) as r from (select * from ${this.tabla}${where}${this.orden ? ` order by ${this.orden}` : ''}${limite}) t`
          return (await db.query(sql, this.params)).rows[0].r
        }
        if (this.op === 'upsert') {
          const columnas = Object.keys(this.cuerpo[0]).map(identificador)
          const conflicto = this.opciones.onConflict ? identificador(this.opciones.onConflict) : '"id"'
          const accion = this.opciones.ignoreDuplicates
            ? 'do nothing'
            : `do update set ${columnas.filter((c) => c !== conflicto).map((c) => `${c} = excluded.${c}`).join(', ')}`
          await db.query(`insert into ${this.tabla} (${columnas.join(', ')}) select ${columnas.join(', ')} from json_populate_recordset(null::${this.tabla}, $1::json) on conflict (${conflicto}) ${accion}`, [JSON.stringify(this.cuerpo)])
          return null
        }
        // update
        const claves = Object.keys(this.cuerpo)
        const desplazar = this.params.length
        const sets = claves.map((k, i) => `${identificador(k)} = $${desplazar + 1 + i}`).join(', ')
        const donde = this.condiciones.length ? ` where ${this.condiciones.join(' and ')}` : ''
        await db.query(`update ${this.tabla} set ${sets}${donde}`, [...this.params, ...claves.map((k) => this.cuerpo[k])])
        return null
      }).then(ok, mal)
    }
  }

  return {
    from: (tabla) => new Consulta(tabla),
    rpc: (nombre, args) =>
      respuesta(async () => (await db.query(`select ${identificador(nombre).replaceAll('"', '')}($1::jsonb) as r`, [JSON.stringify(args.p)])).rows[0].r),
    storage: {
      from: (bucket) => ({
        upload: async (ruta, blob) => {
          const r = await respuesta(() => db.query('insert into storage.objects (bucket_id, name) values ($1, $2)', [bucket, ruta]))
          if (!r.error) servidor.archivos.set(`${bucket}/${ruta}`, blob)
          return { data: r.error ? null : { path: ruta }, error: r.error }
        },
        remove: async (rutas) => {
          const r = await respuesta(() => db.query('delete from storage.objects where bucket_id = $1 and name = any($2::text[])', [bucket, rutas]))
          if (!r.error) for (const x of rutas) servidor.archivos.delete(`${bucket}/${x}`)
          return { data: r.error ? null : rutas, error: r.error }
        },
        getPublicUrl: (ruta) => ({ data: { publicUrl: `https://prueba.supabase.co/storage/v1/object/public/${bucket}/${ruta}` } }),
      }),
    },
  }
}
