// Prueba de integración contra el Supabase REAL (Auth, API REST y Storage verdaderos, cliente oficial supabase-js).
// Se salta sola si no están las variables: no corre en el uso normal de `npm test`. Para correrla:
//   NATY_URL, NATY_ANON, NATY_USUARIOS (JSON { ariel|maria|admin|pamela: { email, password } }),
//   NATY_DATABASE_URL y NATY_SERVICE_ROLE (solo para crear un usuario "intruso" y LIMPIAR lo que crea la prueba).
// Todo lo que crea lleva el código ZZ-TEST o es una venta de prueba, y se borra al final.
import 'fake-indexeddb/auto'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import { productos, stock, ventas } from '../repos/index.js'
import { procesar } from '../sync/cola.js'
import { descargar, enviarRemoto } from '../sync/remoto.js'

const E = process.env
const hay = Boolean(E.NATY_URL && E.NATY_ANON && E.NATY_USUARIOS && E.NATY_DATABASE_URL && E.NATY_SERVICE_ROLE)

describe.skipIf(!hay)('integración con Supabase real', () => {
  const U = JSON.parse(E.NATY_USUARIOS ?? '{}')
  const ventasCreadas = []
  let admin
  let pgc
  let intruso

  const cliente = (clave = E.NATY_ANON) => createClient(E.NATY_URL, clave, { auth: { persistSession: false, autoRefreshToken: false } })
  const entrar = async (quien) => {
    const sb = cliente()
    const { error } = await sb.auth.signInWithPassword(U[quien])
    expect(error, `login de ${quien}`).toBeNull()
    return sb
  }
  const dispositivoNuevo = async () => {
    await db.delete()
    await db.open()
  }
  const enviar = (sb) => procesar({ enviar: (item) => enviarRemoto(sb, item) })
  const filas = async (sql, params) => (await pgc.query(sql, params)).rows
  const stockServidor = async (color) => (await filas('select coalesce(sum(delta), 0)::int as s from naty_movimientos_stock where color_id = $1', [color]))[0].s

  beforeAll(async () => {
    pgc = new pg.Client({ connectionString: E.NATY_DATABASE_URL, ssl: { rejectUnauthorized: false } })
    await pgc.connect()
    admin = await entrar('admin')
  }, 60_000)

  afterAll(async () => {
    if (!pgc) return
    // Limpieza: nada de lo que creó la prueba queda en la instancia.
    for (const id of ventasCreadas) {
      await pgc.query('delete from naty_movimientos_stock where venta_id = $1', [id])
      await pgc.query('delete from naty_ventas where id = $1', [id])
    }
    const fotos = await filas("select f.ruta from naty_producto_fotos f join naty_productos p on p.id = f.producto_id where p.codigo like 'ZZ-TEST%'")
    for (const { ruta } of fotos) {
      const path = ruta.split('/naty_productos/')[1]
      if (path) await fetch(`${E.NATY_URL}/storage/v1/object/naty_productos/${path}`, { method: 'DELETE', headers: { apikey: E.NATY_SERVICE_ROLE, Authorization: `Bearer ${E.NATY_SERVICE_ROLE}` } })
    }
    await pgc.query("delete from naty_movimientos_stock where producto_id in (select id from naty_productos where codigo like 'ZZ-TEST%')")
    await pgc.query("delete from naty_productos where codigo like 'ZZ-TEST%'")
    if (intruso) await fetch(`${E.NATY_URL}/auth/v1/admin/users/${intruso}`, { method: 'DELETE', headers: { apikey: E.NATY_SERVICE_ROLE, Authorization: `Bearer ${E.NATY_SERVICE_ROLE}` } })
    await pgc.end()
  }, 60_000)

  it('un dispositivo nuevo baja el catálogo real: productos, colores, fotos públicas y stock', async () => {
    await dispositivoNuevo()
    const sb = await entrar('ariel')
    const r = await descargar(sb)
    expect(r.productos).toBeGreaterThanOrEqual(138)
    expect((await productos.listar()).length).toBeGreaterThanOrEqual(138)
    const [p] = await productos.buscarPorCodigo('MN-005')
    expect(p.colores.length).toBeGreaterThanOrEqual(3)
    expect(p.fotos[0].ruta).toContain('/storage/v1/object/public/naty_productos/')
    expect((await fetch(p.fotos[0].ruta, { method: 'HEAD' })).status).toBe(200)
    expect(Object.keys(await stock.resumen()).length).toBeGreaterThan(300)
  }, 120_000)

  it('una venta hecha en el dispositivo llega al servidor real, descuenta stock y es idempotente', async () => {
    const sb = await entrar('ariel')
    const [p] = await productos.buscarPorCodigo('MN-005')
    const colores = await stock.stockPorColor(p.id)
    const color = p.colores.find((c) => (colores[c.id] ?? 0) >= 24)
    const antes = await stockServidor(color.id)
    const { data: perfil } = await sb.from('naty_perfiles').select('*').eq('iniciales', 'AM').single()
    const venta = await ventas.crear({ vendedor_id: perfil.id, moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', cliente_nombre: 'PRUEBA INTEGRACIÓN', items: [{ producto_id: p.id, color_id: color.id, cantidad: 2, unidad: 'docena', precio_cent: p.precio_docena_usd_cent }] })
    ventasCreadas.push(venta.id)
    expect(await enviar(sb)).toEqual({ enviadas: 1, errores: 0 })
    expect(await stockServidor(color.id)).toBe(antes - 24)
    const item = { entidad: 'venta', operacion: 'crear', entidad_id: venta.id, payload: { venta, items: venta.items, movimientos: await db.movimientos_stock.where('venta_id').equals(venta.id).toArray() } }
    await enviarRemoto(sb, item)
    expect(await stockServidor(color.id)).toBe(antes - 24)
    expect((await filas('select count(*)::int as c from naty_ventas where id = $1', [venta.id]))[0].c).toBe(1)
  }, 120_000)

  it('la clave pública (anon) no abre nada, salvo el catálogo público sin stock ni costos', async () => {
    const anon = cliente()
    for (const tabla of ['naty_productos', 'naty_ventas', 'naty_movimientos_stock', 'naty_perfiles', 'naty_config']) {
      const { data, error } = await anon.from(tabla).select('*').limit(1)
      expect(error?.code ?? 'sin-error', tabla).toBe('42501')
      expect(data).toBeNull()
    }
    const { data, error } = await anon.from('naty_catalogo_publico').select('*').limit(3)
    expect(error).toBeNull()
    expect(data.length).toBe(3)
    expect(Object.keys(data[0]).sort()).toEqual(['categoria', 'codigo', 'colores', 'descripcion', 'fotos', 'id', 'nombre', 'nuevo', 'precio_docena_usd_cent'])
    expect(data[0].precio_docena_usd_cent).toBeNull()
    const rpc = await anon.rpc('naty_registrar_venta', { p: {} })
    expect(rpc.error?.code).toBe('42501')
  }, 60_000)

  it('un usuario de OTRO proyecto de la instancia (sin perfil) no ve nada y no puede operar', async () => {
    const email = `intruso-${Date.now()}@example.com`
    const password = `Tmp-${Math.random().toString(36).slice(2)}-Aa1`
    const r = await fetch(`${E.NATY_URL}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: E.NATY_SERVICE_ROLE, Authorization: `Bearer ${E.NATY_SERVICE_ROLE}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) })
    expect(r.ok).toBe(true)
    intruso = (await r.json()).id
    const sb = cliente()
    expect((await sb.auth.signInWithPassword({ email, password })).error).toBeNull()
    for (const tabla of ['naty_productos', 'naty_producto_colores', 'naty_categorias', 'naty_movimientos_stock', 'naty_ventas', 'naty_perfiles', 'naty_config']) {
      const { data, error } = await sb.from(tabla).select('*').limit(5)
      expect(error, tabla).toBeNull()
      expect(data, tabla).toHaveLength(0)
    }
    expect((await sb.rpc('naty_registrar_venta', { p: { id: '00000000-0000-4000-8000-000000000001', vendedor_id: intruso, items: [] } })).error?.message).toMatch(/no puede registrar ventas/)
    expect((await sb.rpc('naty_guardar_producto', { p: {} })).error?.message).toMatch(/no puede modificar el catálogo/)
    expect((await filas('select count(*)::int as c from naty_perfiles where id = $1', [intruso]))[0].c).toBe(0)
  }, 60_000)

  it('un vendedor no puede anular ni editar el catálogo; la administradora anula y el stock vuelve', async () => {
    const ariel = await entrar('ariel')
    const id = ventasCreadas[0]
    const sinPermiso = await ariel.rpc('naty_anular_venta', { p: { id, motivo: 'x', movimientos: [] } })
    expect(sinPermiso.error?.message).toMatch(/Solo la administración/)
    expect((await ariel.rpc('naty_guardar_producto', { p: {} })).error?.message).toMatch(/no puede modificar el catálogo/)

    await dispositivoNuevo()
    await descargar(admin)
    const v = await ventas.obtener(id)
    const color = v.items[0].color_id
    const antes = await stockServidor(color)
    await ventas.anular(id, { motivo: 'Prueba de integración', usuario_id: (await db.perfiles.where('rol').equals('admin').first()).id })
    expect(await enviar(admin)).toEqual({ enviadas: 1, errores: 0 })
    expect(await stockServidor(color)).toBe(antes + 24)
    expect((await filas('select estado from naty_ventas where id = $1', [id]))[0].estado).toBe('anulada')
  }, 120_000)

  it('la encargada de depósito sube un producto con foto: Storage real, dirección pública y stock inicial', async () => {
    await dispositivoNuevo()
    const sb = await entrar('maria')
    await descargar(sb)
    const [cat] = await db.categorias.toArray()
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
    const prod = await productos.crear({ codigo: 'ZZ-TEST-1', nombre: 'Producto de prueba', categoria_id: cat.id, precio_docena_usd_cent: 5000, fotos: [{ ruta: '', blob: new Blob([png], { type: 'image/jpeg' }) }], colores: [{ nombre: 'Negro', hex: '#000000' }] })
    await stock.registrarMovimiento({ producto_id: prod.id, color_id: prod.colores[0].id, tipo: 'entrada', delta: 36, motivo: 'prueba', usuario_id: (await db.perfiles.where('rol').equals('enc_deposito').first()).id })
    expect(await enviar(sb)).toEqual({ enviadas: 2, errores: 0 })
    const [foto] = await filas("select f.ruta from naty_producto_fotos f join naty_productos p on p.id = f.producto_id where p.codigo = 'ZZ-TEST-1'")
    expect(foto.ruta).toContain('/storage/v1/object/public/naty_productos/ZZ-TEST-1/')
    expect((await fetch(foto.ruta, { method: 'HEAD' })).status).toBe(200)
    expect(await stockServidor(prod.colores[0].id)).toBe(36)
    // El mismo catálogo lo ven los demás al bajar.
    await dispositivoNuevo()
    await descargar(await entrar('pamela'))
    expect((await productos.obtenerPorCodigo('ZZ-TEST-1')).fotos[0].ruta).toBe(foto.ruta)
  }, 120_000)
})
