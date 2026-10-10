// Prueba de punta a punta de la sincronización: el código real de la app (repositorios locales, cola, envío y descarga)
// contra un servidor real en memoria (Postgres con las migraciones y permisos de supabase/migrations).
// Cada "dispositivo" es la base local (Dexie) vaciada y vuelta a llenar; cada persona entra con su usuario.
import 'fake-indexeddb/auto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import { config, productos, stock, ventas } from '../repos/index.js'
import { procesar } from '../sync/cola.js'
import { descargar, enviarRemoto } from '../sync/remoto.js'
import { clienteDe, crearServidor, USUARIOS as U } from './servidorPrueba.js'

const CAT = '10000000-0000-4000-8000-000000000001'
const PROD = '20000000-0000-4000-8000-000000000001'
const ROJO = '30000000-0000-4000-8000-000000000001'

let servidor
const q = async (sql, params) => (await servidor.db.query(sql, params)).rows

// Un dispositivo nuevo: base local vacía.
const dispositivoNuevo = async () => {
  await db.delete()
  await db.open()
}
const enviar = (usuario) => {
  const sb = clienteDe(servidor, usuario.id)
  return procesar({ enviar: (item) => enviarRemoto(sb, item) })
}
const bajar = (usuario) => descargar(clienteDe(servidor, usuario.id))
const pendientes = () => db.cola_sync.where('estado').anyOf('pendiente', 'error').toArray()
// El stock es del producto (no del color). En la venta no se elige color: va el del producto.
const stockServidor = async () => (await q('select coalesce(sum(delta), 0)::int as s from naty_movimientos_stock where producto_id = $1', [PROD]))[0].s
const itemVenta = (cantidad, precio) => ({ producto_id: PROD, cantidad, unidad: 'docena', precio_cent: precio })

beforeAll(async () => {
  servidor = await crearServidor()
  // Catálogo cargado por la administración y stock inicial de la encargada de depósito (directo en el servidor).
  const admin = clienteDe(servidor, U.admin.id)
  const r = await admin.rpc('naty_guardar_producto', {
    p: {
      id: PROD, codigo: 'MN-001', nombre: 'Blusa', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, descripcion: 'x', precio_docena_usd_cent: 10000, nuevo: true, activo: true,
      colores: [{ id: ROJO, nombre: 'Rojo', hex: '#c00', orden: 0 }],
      fotos: [{ id: '40000000-0000-4000-8000-000000000001', orden: 0, ruta: 'MN-001/a.jpg' }],
    },
  })
  expect(r.error).toBeNull()
  const maria = clienteDe(servidor, U.maria.id)
  // Uno con color y otro sin (los dos suman al producto).
  for (const [i, color] of [ROJO, null].entries()) {
    const { error } = await maria.from('naty_movimientos_stock').upsert({ id: `50000000-0000-4000-8000-00000000000${i}`, producto_id: PROD, color_id: color, tipo: 'entrada', delta: 100, motivo: 'inicial', usuario_id: U.maria.id, creado_en: '2026-10-01T10:00:00Z' }, { onConflict: 'id', ignoreDuplicates: true })
    expect(error).toBeNull()
  }
}, 60_000)

afterAll(async () => servidor?.db.close())

describe('un dispositivo nuevo se llena con lo del servidor', () => {
  it('baja perfiles, categorías, ajustes, producto con colores y fotos, y stock', async () => {
    await dispositivoNuevo()
    const r = await bajar(U.ariel)
    expect(r).toMatchObject({ perfiles: 5, categorias: 1, productos: 1, movimientos: 2 })
    const [p] = await productos.listar()
    expect(p).toMatchObject({ id: PROD, codigo: 'MN-001', precio_docena_usd_cent: 10000 })
    expect(p.colores.map((c) => c.nombre)).toEqual(['Rojo'])
    expect(p.fotos[0].ruta).toBe('https://prueba.supabase.co/storage/v1/object/public/naty_productos/MN-001/a.jpg')
    expect(await stock.stockDe(PROD)).toBe(200)
    expect((await config.obtener('tipo_cambio')).bs).toBe(6.96)
  })

  it('bajar de nuevo no duplica nada (la bajada repite unos segundos a propósito, para no perder cambios)', async () => {
    const r = await bajar(U.ariel)
    expect(r.ventas).toBe(0)
    expect(await db.productos.count()).toBe(1)
    expect(await db.movimientos_stock.count()).toBe(2)
    expect(await db.producto_colores.count()).toBe(1)
  })
})

describe('una venta hecha en el dispositivo llega al servidor', () => {
  let venta
  it('se envía, descuenta stock en el servidor y queda sincronizada', async () => {
    venta = await ventas.crear({ vendedor_id: U.ariel.id, moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', cliente_nombre: 'Ana', items: [itemVenta(2, 10000), itemVenta(1, 10000)] })
    expect(venta.numero).toBe('NV-AM-0001')
    expect((await pendientes()).length).toBe(1)
    const r = await enviar(U.ariel)
    expect(r).toEqual({ enviadas: 1, errores: 0 })
    expect(await pendientes()).toHaveLength(0)
    expect((await ventas.obtener(venta.id)).sync_status).toBe('synced')
    expect(await stockServidor()).toBe(200 - 36)
    expect(await q('select distinct color_id from naty_venta_items where venta_id = $1', [venta.id])).toEqual([{ color_id: ROJO }])
    const [v] = await q('select numero, total_cent::int as total, vendedor_id from naty_ventas where id = $1', [venta.id])
    expect(v).toEqual({ numero: 'NV-AM-0001', total: 30000, vendedor_id: U.ariel.id })
  })

  it('reenviar la misma venta (el celular perdió la respuesta) no la duplica', async () => {
    const sb = clienteDe(servidor, U.ariel.id)
    const item = { entidad: 'venta', operacion: 'crear', entidad_id: venta.id, payload: { venta, items: venta.items, movimientos: await db.movimientos_stock.where('venta_id').equals(venta.id).toArray() } }
    await enviarRemoto(sb, item)
    await enviarRemoto(sb, item)
    expect((await q('select count(*)::int as c from naty_ventas'))[0].c).toBe(1)
    expect(await stockServidor()).toBe(200 - 36)
  })

  it('al bajar, las ventas propias y sus movimientos no se cuentan dos veces', async () => {
    await bajar(U.ariel)
    expect(await stock.stockDe(PROD)).toBe(200 - 36)
    expect(await db.ventas.count()).toBe(1)
    expect(await db.venta_items.count()).toBe(2)
  })
})

describe('lo que ve cada persona al bajar', () => {
  it('otro vendedor ve el stock descontado pero no la venta ajena', async () => {
    await dispositivoNuevo()
    await bajar(U.brayan)
    expect(await stock.stockDe(PROD)).toBe(164)
    expect(await db.ventas.count()).toBe(0)
  })

  it('la encargada de tienda y la administradora ven la venta con sus ítems', async () => {
    for (const quien of [U.pamela, U.admin]) {
      await dispositivoNuevo()
      await bajar(quien)
      const [v] = await ventas.listar()
      expect(v).toMatchObject({ numero: 'NV-AM-0001', moneda: 'usd', total_cent: 30000, estado: 'activa', sync_status: 'synced' })
      expect(typeof v.tipo_cambio).toBe('number')
      expect((await ventas.obtener(v.id)).items.map((i) => i.color_nombre)).toEqual(['Rojo', 'Rojo'])
    }
  })
})

describe('anular', () => {
  it('la administradora anula, el stock vuelve y los demás lo ven al bajar', async () => {
    await dispositivoNuevo()
    await bajar(U.admin)
    const [v] = await ventas.listar()
    await ventas.anular(v.id, { motivo: 'Error de carga', usuario_id: U.admin.id })
    expect(await enviar(U.admin)).toEqual({ enviadas: 1, errores: 0 })
    expect(await stockServidor()).toBe(200)
    const [fila] = await q('select estado, anulacion_motivo from naty_ventas where id = $1', [v.id])
    expect(fila).toEqual({ estado: 'anulada', anulacion_motivo: 'Error de carga' })

    await dispositivoNuevo()
    await bajar(U.ariel)
    const [propia] = await ventas.listar()
    expect(propia.estado).toBe('anulada')
    expect(await stock.stockDe(PROD)).toBe(200)
  })

  it('un vendedor no puede anular: el servidor lo rechaza y la cola lo marca con problema', async () => {
    await dispositivoNuevo()
    await bajar(U.ariel)
    const [v] = await ventas.listar()
    const nueva = await ventas.crear({ vendedor_id: U.ariel.id, moneda: 'bs', tipo_cambio: 6.96, metodo_pago: 'transferencia', items: [itemVenta(1, 69600)] })
    await enviar(U.ariel)
    await ventas.anular(nueva.id, { motivo: 'quiero anularla', usuario_id: U.ariel.id })
    const r = await enviar(U.ariel)
    expect(r.errores).toBe(1)
    const [item] = await pendientes()
    expect(item).toMatchObject({ estado: 'error', intentos: 1 })
    expect(item.ultimo_error).toMatch(/Solo la administración/)
    expect(v).toBeTruthy()
  })
})

describe('catálogo, stock y ajustes', () => {
  it('la encargada de depósito edita un producto con foto nueva: sube a Storage y el servidor la registra', async () => {
    await dispositivoNuevo()
    await bajar(U.maria)
    const p = (await productos.listar())[0]
    await productos.actualizar(p.id, { ...p, nombre: 'Blusa renovada', precio_docena_usd_cent: 11000, fotos: [...p.fotos.map((f) => ({ ruta: f.ruta })), { ruta: '', blob: new Blob(['datos-de-foto'], { type: 'image/jpeg' }) }], colores: p.colores.map(({ id, nombre, hex }) => ({ id, nombre, hex })) })
    expect(await enviar(U.maria)).toEqual({ enviadas: 1, errores: 0 })
    const fotos = await q('select ruta from naty_producto_fotos where producto_id = $1 order by orden', [PROD])
    expect(fotos).toHaveLength(2)
    expect(fotos[1].ruta).toMatch(/^https:\/\/prueba\.supabase\.co\/storage\/v1\/object\/public\/naty_productos\/MN-001\/.+\.jpg$/)
    expect(servidor.archivos.size).toBe(1)
    // En el dispositivo la foto dejó de ser un archivo local y pasó a tener su dirección.
    const locales = await db.producto_fotos.where('producto_id').equals(PROD).toArray()
    expect(locales.every((f) => f.ruta && !f.blob)).toBe(true)
    expect((await q('select nombre, precio_docena_usd_cent as precio from naty_productos where id = $1', [PROD]))[0]).toEqual({ nombre: 'Blusa renovada', precio: 11000 })
  })

  it('cambiar el color por otro marca el anterior eliminado en el servidor; al bajar se ve solo el nuevo', async () => {
    const p = (await productos.listar())[0]
    const antes = await stockServidor()
    await productos.actualizar(p.id, { ...p, fotos: p.fotos.map((f) => ({ ruta: f.ruta })), colores: [{ nombre: 'Azul', hex: '#00c' }] })
    await enviar(U.maria)
    expect((await q('select nombre, eliminado from naty_producto_colores where producto_id = $1 order by nombre', [PROD]))).toEqual([{ nombre: 'Azul', eliminado: false }, { nombre: 'Rojo', eliminado: true }])
    await dispositivoNuevo()
    await bajar(U.ariel)
    expect((await productos.listar())[0].colores.map((c) => c.nombre)).toEqual(['Azul'])
    // El stock es del producto: cambiar el color no lo toca.
    expect(await stock.stockDe(PROD)).toBe(antes)
  })

  it('un movimiento de stock manual se envía una sola vez aunque se reenvíe', async () => {
    await dispositivoNuevo()
    await bajar(U.maria)
    const antes = await stockServidor()
    const m = await stock.registrarMovimiento({ producto_id: PROD, tipo: 'entrada', delta: 36, motivo: 'reposición', usuario_id: U.maria.id })
    await enviar(U.maria)
    await enviarRemoto(clienteDe(servidor, U.maria.id), { entidad: 'movimiento', operacion: 'registrar', entidad_id: m.id })
    expect(await stockServidor()).toBe(antes + 36)
    await bajar(U.maria)
    expect(await stock.stockDe(PROD)).toBe(antes + 36)
  })

  it('un vendedor que edita el catálogo es rechazado por el servidor; el pedido queda con problema', async () => {
    await dispositivoNuevo()
    await bajar(U.ariel)
    const [cat] = await db.categorias.toArray()
    await productos.crear({ codigo: 'MN-777', nombre: 'No autorizado', categoria_id: cat.id, precio_docena_usd_cent: 100, colores: [], fotos: [] })
    const r = await enviar(U.ariel)
    expect(r.errores).toBe(1)
    expect((await q("select count(*)::int as c from naty_productos where codigo = 'MN-777'"))[0].c).toBe(0)
    expect((await pendientes())[0].ultimo_error).toMatch(/no puede modificar el catálogo/)
  })

  it('la administradora cambia un ajuste y los demás lo reciben; lo pendiente no se pisa al bajar', async () => {
    await dispositivoNuevo()
    await bajar(U.admin)
    await config.guardar('tipo_cambio', { bs: 7, ars: 1500, actualizado_en: '2026-10-08T12:00:00Z', ejemplo: false })
    await config.guardar('url_catalogo', 'https://naty.example/c')
    // Antes de enviar, llega una bajada: lo pendiente del dispositivo no se pisa con lo viejo del servidor.
    await bajar(U.admin)
    expect((await config.obtener('tipo_cambio')).bs).toBe(7)
    expect(await enviar(U.admin)).toEqual({ enviadas: 2, errores: 0 })
    await dispositivoNuevo()
    await bajar(U.ariel)
    expect((await config.obtener('tipo_cambio')).bs).toBe(7)
    expect(await config.obtener('url_catalogo')).toBe('https://naty.example/c')
  })

  it('un teléfono cargado por la administración llega a los demás dispositivos', async () => {
    await dispositivoNuevo()
    await bajar(U.admin)
    const { perfiles } = await import('../repos/index.js')
    await perfiles.actualizar(U.ariel.id, { telefono: '59170000001' })
    await enviar(U.admin)
    await dispositivoNuevo()
    await bajar(U.pamela)
    expect((await perfiles.obtener(U.ariel.id)).telefono).toBe('59170000001')
  })
})

describe('contrato entre la app y la base', () => {
  it('lo que arma la app para registrar una venta es aceptado tal cual por la función SQL', async () => {
    await dispositivoNuevo()
    await bajar(U.brayan)
    const v = await ventas.crear({ vendedor_id: U.brayan.id, moneda: 'ars', tipo_cambio: 1500, metodo_pago: 'efectivo', cliente_nombre: '', items: [itemVenta(3, 1_500_000)] })
    expect(await enviar(U.brayan)).toEqual({ enviadas: 1, errores: 0 })
    const [fila] = await q('select numero, moneda, tipo_cambio::float as tc, total_cent::bigint::int as total from naty_ventas where id = $1', [v.id])
    expect(fila).toEqual({ numero: 'NV-BA-0001', moneda: 'ars', tc: 1500, total: 4_500_000 })
  })
})
