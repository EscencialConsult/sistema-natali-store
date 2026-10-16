// Prueba tienda_schema.sql y su ejecutor contra el esquema REAL del sistema de nota (PGlite, Postgres en memoria).
// Garantías que verifica: es solo aditivo (ningún objeto naty_* cambia), la matriz de permisos por rol, que no
// se pueda borrar nada, que las vistas públicas no filtren datos internos y que el ejecutor revierta ante cualquier cambio.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { comparar } from '../../../../Docs/tienda/herramientas/comparar-linea-base.mjs'
import { aplicarTienda, verificarSoloTienda } from '../../../scripts/aplicar-tienda.mjs'

const leer = (ruta) => readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')
const NATY = leer('../../../supabase/naty_schema.sql')
const TIENDA = leer('../../../supabase/tienda_schema.sql')
const LINEA_BASE = leer('../../../../Docs/tienda/herramientas/linea-base.sql')

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
const U = {
  admin: '00000000-0000-4000-8000-0000000000a1',
  superadmin: '00000000-0000-4000-8000-0000000000a2',
  vendedor: '00000000-0000-4000-8000-0000000000a3',
  deposito: '00000000-0000-4000-8000-0000000000a4',
}
const ROLES = { admin: 'admin', superadmin: 'superadmin', vendedor: 'vendedor', deposito: 'enc_deposito' }
const INICIALES = { admin: 'AD', superadmin: 'SU', vendedor: 'VE', deposito: 'DE' }
const P = (n) => `20000000-0000-4000-8000-00000000000${n}`

const nuevaBase = async () => {
  const d = new PGlite()
  await d.exec(STUB)
  await d.exec(NATY)
  return d
}
const como = async (d, usuario, fn) => {
  await d.exec(`set role ${usuario ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${usuario ?? ''}', false);`)
  try {
    return await fn()
  } finally {
    await d.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const q = async (d, sql, params) => (await d.query(sql, params)).rows

describe('tienda_schema.sql sobre el esquema real de Renzo', () => {
  let db
  let antes

  beforeAll(async () => {
    db = await nuevaBase()
    for (const [k, id] of Object.entries(U)) {
      await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, `${k}@x.test`])
      await db.query(`insert into naty_perfiles (id, nombre, iniciales, rol, activo) values ($1, $2, $3, $4, true)`, [id, k, INICIALES[k], ROLES[k]])
    }
    const cat = '10000000-0000-4000-8000-000000000001'
    await db.query(`insert into naty_categorias (id, nombre, orden) values ($1, 'Blusas', 1)`, [cat])
    const prod = (n, codigo, activo) =>
      db.query(
        `insert into naty_productos (id, codigo, nombre, categoria_id, descripcion, precio_docena_usd_cent, nuevo, activo)
         values ($1, $2, $3, $4, 'desc', 12000, false, $5)`,
        [P(n), codigo, `Modelo ${codigo}`, cat, activo],
      )
    await prod(1, 'P1', true) // visible
    await prod(2, 'P2', true) // sin foto
    await prod(3, 'P3', false) // inactivo
    await prod(4, 'P4', true) // se oculta
    for (const n of [1, 3, 4]) {
      await db.query(`insert into naty_producto_fotos (id, producto_id, orden, ruta) values (gen_random_uuid(), $1, 0, $2)`, [P(n), `https://x.test/${n}.jpg`])
    }
    // Una foto vacía no cuenta como foto.
    await db.query(`insert into naty_producto_fotos (id, producto_id, orden, ruta) values (gen_random_uuid(), $1, 0, '  ')`, [P(2)])
    await db.query(`update naty_config set valor = '{"bs": 6.96, "ars": 1400, "actualizado_en": "2026-10-15", "ejemplo": false}'::jsonb where clave = 'tipo_cambio'`)
    await db.query(`update naty_config set valor = '"+591 7000-0000"'::jsonb where clave = 'whatsapp_tienda'`)

    antes = JSON.parse((await db.query(LINEA_BASE)).rows[0].linea_base)
  }, 90_000) // cargar el esquema completo en PGlite tarda más cuando corren muchas suites a la vez
  afterAll(async () => db?.close())

  it('se aplica dos veces sin error (idempotente)', async () => {
    await db.exec(TIENDA)
    await db.exec(TIENDA)
    expect((await q(db, `select to_regclass('tienda_config')::text as t`))[0].t).toBe('tienda_config')
  })

  it('no cambia NINGÚN objeto naty_*: estructura, permisos, políticas, funciones ni triggers', async () => {
    const despues = JSON.parse((await db.query(LINEA_BASE)).rows[0].linea_base)
    expect(comparar(antes, despues)).toEqual([])
    // Y los datos de Renzo quedaron igual.
    expect(despues.filas.naty_productos).toBe(antes.filas.naty_productos)
    expect(despues.filas.naty_config).toBe(antes.filas.naty_config)
  })

  it('el archivo cumple su propia guardia (solo objetos tienda_*)', () => {
    expect(verificarSoloTienda(TIENDA)).toEqual([])
  })

  describe('catálogo público', () => {
    it('muestra solo activos con foto y no ocultos, sin precio si la administración no lo habilitó', async () => {
      const filas = await como(db, null, () => q(db, `select codigo, precio_docena_usd_cent, fotos from tienda_catalogo_publico order by codigo`))
      expect(filas.map((f) => f.codigo)).toEqual(['P1', 'P4'])
      expect(filas.every((f) => f.precio_docena_usd_cent === null)).toBe(true)
      expect(filas[0].fotos).toEqual(['https://x.test/1.jpg'])
    })

    it('ocultar saca el producto y mostrarlo de nuevo es una marca, no un borrado', async () => {
      await como(db, U.admin, () => db.query(`insert into tienda_oculto (producto_id) values ($1)`, [P(4)]))
      const oculto = await como(db, null, () => q(db, `select codigo from tienda_catalogo_publico order by codigo`))
      expect(oculto.map((f) => f.codigo)).toEqual(['P1'])
      await como(db, U.admin, () => db.query(`update tienda_oculto set oculto = false where producto_id = $1`, [P(4)]))
      const visible = await como(db, null, () => q(db, `select codigo from tienda_catalogo_publico order by codigo`))
      expect(visible.map((f) => f.codigo)).toEqual(['P1', 'P4'])
    })

    it('el precio sale solo con mostrar_precios_publico', async () => {
      await db.query(`update naty_config set valor = 'true'::jsonb where clave = 'mostrar_precios_publico'`)
      const f = await como(db, null, () => q(db, `select precio_docena_usd_cent from tienda_catalogo_publico where codigo = 'P1'`))
      expect(f[0].precio_docena_usd_cent).toBe(12000)
      await db.query(`update naty_config set valor = 'false'::jsonb where clave = 'mostrar_precios_publico'`)
    })

    it('expone solo la lista blanca de columnas: sin stock, costos, colores ni personas', async () => {
      const cols = (await q(db, `select column_name from information_schema.columns where table_name = 'tienda_catalogo_publico' order by ordinal_position`)).map((c) => c.column_name)
      expect(cols).toEqual(['id', 'codigo', 'nombre', 'categoria_id', 'categoria', 'descripcion', 'nuevo', 'precio_docena_usd_cent', 'fotos'])
    })
  })

  describe('ajustes públicos', () => {
    it('trae tipo de cambio y WhatsApp normalizado, sin nada más', async () => {
      const [a] = await como(db, null, () => q(db, `select * from tienda_ajustes_publicos`))
      expect(Object.keys(a).sort()).toEqual(
        ['mostrar_precios', 'negocio_nombre', 'tipo_cambio_actualizado_en', 'tipo_cambio_ars', 'tipo_cambio_bs', 'tipo_cambio_es_ejemplo', 'whatsapp_tienda'].sort(),
      )
      expect(Number(a.tipo_cambio_bs)).toBe(6.96)
      expect(Number(a.tipo_cambio_ars)).toBe(1400)
      expect(a.tipo_cambio_es_ejemplo).toBe(false)
      expect(a.whatsapp_tienda).toBe('59170000000')
      expect(a.mostrar_precios).toBe(false)
    })

    it('una tasa inválida sale como NULL en vez de romper o multiplicar por cero', async () => {
      await db.query(`update naty_config set valor = '{"bs": 0, "ars": "mucho", "ejemplo": true}'::jsonb where clave = 'tipo_cambio'`)
      const [a] = await como(db, null, () => q(db, `select tipo_cambio_bs, tipo_cambio_ars, tipo_cambio_es_ejemplo from tienda_ajustes_publicos`))
      expect(a.tipo_cambio_bs).toBeNull()
      expect(a.tipo_cambio_ars).toBeNull()
      expect(a.tipo_cambio_es_ejemplo).toBe(true)
      await db.query(`update naty_config set valor = '{"bs": 6.96, "ars": 1400, "ejemplo": false}'::jsonb where clave = 'tipo_cambio'`)
    })
  })

  describe('vendedores públicos', () => {
    it('solo rol vendedor, activo y con teléfono; nombre y teléfono normalizado, nada más', async () => {
      await db.query(`update naty_perfiles set telefono = '+591 7000-1234' where rol = 'vendedor'`)
      await db.query(`update naty_perfiles set telefono = '+591 7000-9999' where rol <> 'vendedor'`)
      const filas = await como(db, null, () => q(db, `select * from tienda_vendedores_publicos`))
      expect(filas).toHaveLength(1)
      expect(filas[0].telefono).toBe('59170001234')
      expect(Object.keys(filas[0]).sort()).toEqual(['id', 'nombre', 'telefono'])
      await db.query(`update naty_perfiles set activo = false where rol = 'vendedor'`)
      expect(await como(db, null, () => q(db, `select * from tienda_vendedores_publicos`))).toEqual([])
      await db.query(`update naty_perfiles set activo = true, telefono = null`)
    })
  })

  describe('matriz de permisos (un principal por vez)', () => {
    // Cualquiera de estas es un rechazo: sin permiso, bloqueada por RLS, o la vista ni siquiera admite escritura.
    const rechazado = /permission denied|row-level security|violates row-level|cannot (update|insert|delete)/i

    it('anon: no puede escribir ni en las vistas ni en las tablas', async () => {
      for (const sql of [
        `insert into tienda_config (clave, valor) values ('x', '1')`,
        `update tienda_config set valor = '2'`,
        `delete from tienda_config`,
        `insert into tienda_oculto (producto_id) values ('${P(1)}')`,
        `update tienda_catalogo_publico set nombre = 'x'`,
        `delete from tienda_catalogo_publico`,
        `update tienda_ajustes_publicos set mostrar_precios = true`,
      ]) {
        await expect(como(db, null, () => db.query(sql)), sql).rejects.toThrow(rechazado)
      }
    })

    it('anon: no lee tienda_oculto, ni tablas de Renzo, ni la configuración privada', async () => {
      await expect(como(db, null, () => db.query(`select * from tienda_oculto`))).rejects.toThrow(rechazado)
      await expect(como(db, null, () => db.query(`select * from naty_productos`))).rejects.toThrow(rechazado)
      await expect(como(db, null, () => db.query(`select * from naty_config`))).rejects.toThrow(rechazado)
      await db.query(`insert into tienda_config (clave, valor, publico) values ('privada', '"secreto"', false), ('transferencia', '{"banco": "X"}', true)`)
      const filas = await como(db, null, () => q(db, `select clave from tienda_config order by clave`))
      expect(filas.map((f) => f.clave)).toEqual(['transferencia'])
    })

    it('vendedor y depósito: pueden leer lo público pero no escribir ni ver lo privado', async () => {
      for (const quien of [U.vendedor, U.deposito]) {
        const filas = await como(db, quien, () => q(db, `select clave from tienda_config order by clave`))
        expect(filas.map((f) => f.clave)).toEqual(['transferencia'])
        await expect(como(db, quien, () => db.query(`insert into tienda_config (clave, valor) values ('nueva', '1')`))).rejects.toThrow(rechazado)
        await expect(como(db, quien, () => db.query(`update tienda_config set valor = '1' where clave = 'transferencia'`))).resolves.toBeTruthy()
        expect((await q(db, `select valor from tienda_config where clave = 'transferencia'`))[0].valor).toEqual({ banco: 'X' })
        await expect(como(db, quien, () => db.query(`insert into tienda_oculto (producto_id) values ('${P(1)}')`))).rejects.toThrow(rechazado)
      }
    })

    it('admin y superadmin: leen todo, crean y editan, pero NO pueden borrar', async () => {
      for (const quien of [U.admin, U.superadmin]) {
        const filas = await como(db, quien, () => q(db, `select clave from tienda_config order by clave`))
        expect(filas.map((f) => f.clave)).toContain('privada')
        await como(db, quien, () => db.query(`insert into tienda_config (clave, valor, publico) values ($1, '"ok"', true) on conflict (clave) do update set valor = excluded.valor`, [`k_${quien.slice(-2)}`]))
        await como(db, quien, () => db.query(`update tienda_config set valor = '"editado"' where clave = 'privada'`))
        await expect(como(db, quien, () => db.query(`delete from tienda_config where clave = 'privada'`))).rejects.toThrow(rechazado)
        await expect(como(db, quien, () => db.query(`delete from tienda_oculto`))).rejects.toThrow(rechazado)
        await expect(como(db, quien, () => db.query(`truncate tienda_config`))).rejects.toThrow(rechazado)
      }
      expect((await q(db, `select valor from tienda_config where clave = 'privada'`))[0].valor).toBe('editado')
    })

    it('rechaza claves y valores fuera de formato', async () => {
      await expect(como(db, U.admin, () => db.query(`insert into tienda_config (clave, valor) values ('Con Mayus', '1')`))).rejects.toThrow()
      await expect(como(db, U.admin, () => db.query(`insert into tienda_config (clave, valor) values ('grande', $1::jsonb)`, [JSON.stringify('x'.repeat(21000))]))).rejects.toThrow()
    })
  })
})

describe('ejecutor aplicar-tienda', { timeout: 60_000 }, () => {
  const ejecutores = (d) => ({ consulta: (s) => d.query(s), ejecutar: (s) => d.exec(s), lineaBaseSql: LINEA_BASE })
  const existe = async (d) => (await d.query(`select to_regclass('tienda_config')::text as t`)).rows[0].t

  it('por defecto prueba y revierte: no deja nada aplicado', async () => {
    const d = await nuevaBase()
    const r = await aplicarTienda({ ...ejecutores(d), sql: TIENDA })
    expect(r.estado).toBe('PROBADO_Y_REVERTIDO')
    expect(r.nuevos).toEqual(expect.arrayContaining(['tienda_config', 'tienda_oculto', 'tienda_catalogo_publico', 'tienda_ajustes_publicos']))
    expect(await existe(d)).toBeNull()
    await d.close()
  })

  it('con aplicar=true confirma, y aplicarlo de nuevo sigue dando OK', async () => {
    const d = await nuevaBase()
    expect((await aplicarTienda({ ...ejecutores(d), sql: TIENDA, aplicar: true })).estado).toBe('APLICADO')
    expect(await existe(d)).toBe('tienda_config')
    expect((await aplicarTienda({ ...ejecutores(d), sql: TIENDA, aplicar: true })).estado).toBe('APLICADO')
    await d.close()
  })

  it('la guardia rechaza antes de tocar la base', async () => {
    const d = await nuevaBase()
    for (const sql of [
      `delete from naty_ventas;`,
      `truncate naty_productos;`,
      `alter table naty_productos add column x int;`,
      `create or replace function naty_guardar_producto(p jsonb) returns uuid language sql as 'select null::uuid';`,
      `alter type naty_rol_usuario add value 'otro';`,
      `drop table naty_ventas;`,
      `grant select on naty_config to anon;`,
      `do $$ begin execute 'alter table naty_config add column z int'; end $$;`,
      `create trigger trg_tienda_x after update on naty_productos for each row execute function tienda_tocar_updated_at();`,
    ]) {
      const r = await aplicarTienda({ ...ejecutores(d), sql, aplicar: true })
      expect(r.estado, sql).toBe('RECHAZADO_POR_GUARDIA')
    }
    await d.close()
  })

  it('si algo pasara la guardia, la comparación antes/después REVIERTE todo', async () => {
    const d = await nuevaBase()
    const sneaky = `create table tienda_ok (a int); alter table naty_config add column intruso int;`
    const r = await aplicarTienda({ ...ejecutores(d), sql: sneaky, aplicar: true, guardia: () => [] })
    expect(r.estado).toBe('REVERTIDO_POR_CAMBIOS_EN_NATY')
    expect(r.cambios.join(' ')).toContain('intruso')
    expect((await d.query(`select to_regclass('tienda_ok')::text as t`)).rows[0].t).toBeNull()
    expect((await d.query(`select count(*)::int as n from information_schema.columns where table_name = 'naty_config' and column_name = 'intruso'`)).rows[0].n).toBe(0)
    await d.close()
  })

  it('un error de SQL revierte y no deja una transacción abierta', async () => {
    const d = await nuevaBase()
    const r = await aplicarTienda({ ...ejecutores(d), sql: `create table tienda_a (a int); create table tienda_a (a int);`, aplicar: true })
    expect(r.estado).toBe('ERROR_REVERTIDO')
    expect((await d.query(`select to_regclass('tienda_a')::text as t`)).rows[0].t).toBeNull()
    await d.exec(`create table prueba_post (a int)`) // si siguiera en transacción abortada, esto fallaría
    await d.close()
  })
})
