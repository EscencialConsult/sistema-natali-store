// Prueba el cargador de datos iniciales de la tienda contra el esquema real de Renzo (PGlite, Postgres en memoria).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { comparar } from '../../../../Docs/tienda/herramientas/comparar-linea-base.mjs'
import { cargarConfig, prepararConfig } from '../../../scripts/cargar-config-tienda.mjs'

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
const nuevaBase = async () => {
  const d = new PGlite()
  await d.exec(STUB)
  await d.exec(NATY)
  return d
}
const io = (d) => ({ consulta: (s, p) => d.query(s, p), ejecutar: (s) => d.exec(s) })

const DATOS = {
  transferencia: { titular: 'Titular de Prueba', cuit: '20-12345678-6', cbu: '0140000000000000000001', alias: 'alias.prueba', cuenta: '0000000000001' },
  locales: [
    { nombre: 'Local 27 de Mayo', direccion: 'Calle sin nombre, esquina Colorados', horario: '6:00 a 12:00 y 14:00 a 16:00' },
    { nombre: 'Local Chalanitas', direccion: 'Calle 23 de Marzo, esquina Colorados', horario: '6:00 a 13:00 y 14:00 a 17:00' },
  ],
}

describe('cargador de datos iniciales de la tienda', { timeout: 60_000 }, () => {
  it('valida antes de escribir: rechaza claves desconocidas, datos inválidos y vacíos', () => {
    expect(prepararConfig({ naty_config: { x: 1 } }).errores[0]).toMatch(/Clave desconocida/)
    expect(prepararConfig({ transferencia: { cbu: '123', alias: 'a' } }).errores.join(' ')).toMatch(/CBU/)
    expect(prepararConfig({ locales: [{ nombre: 'X', mapa: 'javascript:alert(1)' }] }).errores.join(' ')).toMatch(/mapa/i)
    expect(prepararConfig({ horarios: [] }).errores.join(' ')).toMatch(/vacío/)
    expect(prepararConfig([]).errores).toHaveLength(1)
    expect(prepararConfig(DATOS).errores).toEqual([])
  })

  it('el archivo real de datos iniciales (fuera del repo) es válido', () => {
    const archivo = 'C:/Users/PERSONAL/.claude/secretos/modas-naty-tienda-config-inicial.json'
    let texto
    try {
      texto = readFileSync(archivo, 'utf8')
    } catch {
      return // en otra máquina el archivo no existe: no es un error del código
    }
    const r = prepararConfig(JSON.parse(texto))
    expect(r.errores).toEqual([])
    expect(r.filas.map((f) => f.clave).sort()).toEqual(['locales', 'transferencia'])
  })

  it('sin la tabla de la tienda no escribe nada y lo explica', async () => {
    const d = await nuevaBase()
    const r = await cargarConfig({ ...io(d), datos: DATOS, aplicar: true })
    expect(r.estado).toBe('RECHAZADO')
    expect(r.errores[0]).toMatch(/esquema de la tienda/)
    await d.close()
  })

  it('por defecto prueba y revierte; con aplicar guarda, y repetirlo actualiza sin duplicar', async () => {
    const d = await nuevaBase()
    await d.exec(TIENDA)
    const prueba = await cargarConfig({ ...io(d), datos: DATOS })
    expect(prueba.estado).toBe('PROBADO_Y_REVERTIDO')
    expect((await d.query('select count(*)::int as n from tienda_config')).rows[0].n).toBe(0)

    const real = await cargarConfig({ ...io(d), datos: DATOS, aplicar: true })
    expect(real.estado).toBe('APLICADO')
    expect([...real.claves].sort()).toEqual(['locales', 'transferencia'])
    const guardado = (await d.query('select clave, valor, publico from tienda_config order by clave')).rows
    expect(guardado.map((f) => f.clave)).toEqual(['locales', 'transferencia'])
    expect(guardado.every((f) => f.publico)).toBe(true)
    expect(guardado[1].valor.cbu).toBe('0140000000000000000001')
    expect(guardado[1].valor.cuit).toBe('20123456786')
    expect(guardado[1].valor.actualizado_en).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(guardado[0].valor[0].horario).toBe('6:00 a 12:00 y 14:00 a 16:00')

    await cargarConfig({ ...io(d), datos: { transferencia: { ...DATOS.transferencia, alias: 'nuevo.alias' } }, aplicar: true })
    const filas = (await d.query(`select valor from tienda_config where clave = 'transferencia'`)).rows
    expect(filas).toHaveLength(1)
    expect(filas[0].valor.alias).toBe('nuevo.alias')
    await d.close()
  })

  it('nunca toca los objetos ni los datos de Renzo', async () => {
    const d = await nuevaBase()
    await d.exec(TIENDA)
    const antes = JSON.parse((await d.query(LINEA_BASE)).rows[0].linea_base)
    await cargarConfig({ ...io(d), datos: DATOS, aplicar: true })
    const despues = JSON.parse((await d.query(LINEA_BASE)).rows[0].linea_base)
    expect(comparar(antes, despues)).toEqual([])
    expect(despues.filas.naty_config).toBe(antes.filas.naty_config)
    await d.close()
  })
})
