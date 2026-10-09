import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { CANTIDAD_PRODUCTOS, cargarFixture, PERFILES_PRUEBA } from '../test/fixture.js'
import { config, perfiles, productos, stock, ventas } from './repos/index.js'
import { pendientes, procesar } from './sync/cola.js'

beforeAll(async () => {
  await cargarFixture()
})

describe('datos de prueba', () => {
  it('carga los productos y no duplica en una segunda carga', async () => {
    expect(await db.productos.count()).toBe(CANTIDAD_PRODUCTOS)
    await cargarFixture()
    await cargarFixture()
    expect(await db.productos.count()).toBe(CANTIDAD_PRODUCTOS)
    expect(await db.perfiles.count()).toBe(PERFILES_PRUEBA.length)
  })
  it('todos los productos tienen foto y al menos 3 colores', async () => {
    const todos = await productos.listar()
    expect(todos.every((p) => p.fotos.length >= 1 && p.colores.length >= 3)).toBe(true)
  })
})

describe('buscarPorCodigo', () => {
  it('"mn5", "MN-005" y "5" devuelven MN-005 primero', async () => {
    for (const q of ['mn5', 'MN-005', 'mn 05', '5']) {
      const r = await productos.buscarPorCodigo(q)
      expect(r[0].codigo).toBe('MN-005')
    }
  })
  it('un prefijo devuelve varios, ordenados', async () => {
    const r = await productos.buscarPorCodigo('mn-01')
    expect(r.map((p) => p.codigo)).toEqual(expect.arrayContaining(['MN-001', 'MN-010']))
  })
  it('si no parece código busca por nombre', async () => {
    const r = await productos.buscarPorCodigo('blazer')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((p) => /blazer/i.test(p.nombre))).toBe(true)
  })
  it('vacío o sin coincidencias devuelve lista vacía', async () => {
    expect(await productos.buscarPorCodigo('')).toEqual([])
    expect(await productos.buscarPorCodigo('zzzzqq')).toEqual([])
  })
})

describe('productos CRUD', () => {
  it('rechaza código repetido y datos inválidos', async () => {
    const [p] = await productos.listar()
    await expect(productos.crear({ codigo: p.codigo, nombre: 'X', categoria_id: p.categoria_id, precio_docena_usd_cent: 100 })).rejects.toThrow(/código/)
    await expect(productos.crear({ codigo: 'ZZ-1', nombre: '', categoria_id: p.categoria_id, precio_docena_usd_cent: 100 })).rejects.toThrow()
    await expect(productos.crear({ codigo: 'ZZ-1', nombre: 'X', categoria_id: p.categoria_id, precio_docena_usd_cent: 10.5 })).rejects.toThrow()
  })
  it('crea, edita conservando ids de colores y da de baja', async () => {
    const [base] = await productos.listar()
    const nuevo = await productos.crear({
      codigo: 'ZZ-001',
      nombre: 'Prueba',
      categoria_id: base.categoria_id,
      precio_docena_usd_cent: 1000,
      colores: [{ nombre: 'Rojo', hex: '#f00' }, { nombre: 'Azul', hex: '#00f' }],
      fotos: [{ ruta: '/x.jpg' }],
    })
    expect(nuevo.colores).toHaveLength(2)
    const rojo = nuevo.colores.find((c) => c.nombre === 'Rojo')
    const editado = await productos.actualizar(nuevo.id, {
      ...nuevo,
      nombre: 'Prueba 2',
      colores: [{ id: rojo.id, nombre: 'Rojo', hex: '#f00' }, { nombre: 'Verde', hex: '#0f0' }],
    })
    expect(editado.nombre).toBe('Prueba 2')
    expect(editado.colores.map((c) => c.nombre).sort()).toEqual(['Rojo', 'Verde'])
    expect(editado.colores.find((c) => c.nombre === 'Rojo').id).toBe(rojo.id)
    await productos.eliminar(nuevo.id)
    expect((await productos.listar()).some((p) => p.id === nuevo.id)).toBe(false)
    expect((await productos.listar({ soloActivos: false })).some((p) => p.id === nuevo.id)).toBe(true)
  })
})

describe('venta, stock y cola', () => {
  async function productoConStock() {
    const lista = await productos.listar()
    for (const p of lista) {
      const s = await stock.stockPorColor(p.id)
      const color = p.colores.find((c) => (s[c.id] ?? 0) >= 24)
      if (color) return { p, color, antes: s[color.id] }
    }
    throw new Error('sin stock en el seed')
  }

  it('una venta descuenta stock, numera por vendedor y entra a la cola', async () => {
    const { p, color, antes } = await productoConStock()
    const venta = await ventas.crear({
      vendedor_id: 'p-ariel',
      moneda: 'usd',
      tipo_cambio: 1,
      metodo_pago: 'efectivo',
      items: [{ producto_id: p.id, color_id: color.id, cantidad: 2, unidad: 'docena', precio_cent: p.precio_docena_usd_cent }],
    })
    expect(venta.numero).toMatch(/^NV-AM-0001$/)
    expect(venta.vendedor_nombre).toBe('Ariel Maydana')
    expect(venta.items[0]).toMatchObject({ codigo: p.codigo, nombre: p.nombre, color_nombre: color.nombre })
    expect(venta.total_cent).toBe(2 * p.precio_docena_usd_cent)
    expect(venta.sync_status).toBe('pending')
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 24)
    expect(await pendientes()).toBeGreaterThanOrEqual(1)

    const otra = await ventas.crear({
      vendedor_id: 'p-ariel',
      moneda: 'bs',
      tipo_cambio: 6.96,
      metodo_pago: 'transferencia',
      items: [{ producto_id: p.id, color_id: color.id, cantidad: 1, unidad: 'docena', precio_cent: 100 }],
    })
    expect(otra.numero).toBe('NV-AM-0002')
  })

  it('rechaza un color que no es del producto', async () => {
    const { p } = await productoConStock()
    const otro = (await productos.listar()).find((x) => x.id !== p.id)
    await expect(
      ventas.crear({ vendedor_id: 'p-ariel', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', items: [{ producto_id: p.id, color_id: otro.colores[0].id, cantidad: 1, precio_cent: 100 }] }),
    ).rejects.toThrow(/color/)
  })

  it('una venta inválida no deja nada a medias', async () => {
    const { p, color } = await productoConStock()
    const antesVentas = await db.ventas.count()
    const antesMovs = await db.movimientos_stock.count()
    await expect(
      ventas.crear({ vendedor_id: 'p-ariel', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', items: [{ producto_id: p.id, color_id: color.id, cantidad: 0, precio_cent: 100 }] }),
    ).rejects.toThrow()
    expect(await db.ventas.count()).toBe(antesVentas)
    expect(await db.movimientos_stock.count()).toBe(antesMovs)
  })

  it('anular devuelve el stock y exige motivo; no se anula dos veces', async () => {
    const { p, color } = await productoConStock()
    const antes = await stock.stockActual(p.id, color.id)
    const v = await ventas.crear({
      vendedor_id: 'p-brayan',
      moneda: 'usd',
      tipo_cambio: 1,
      metodo_pago: 'efectivo',
      items: [{ producto_id: p.id, color_id: color.id, cantidad: 1, precio_cent: 500 }],
    })
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 12)
    await expect(ventas.anular(v.id, { motivo: '  ', usuario_id: 'p-admin' })).rejects.toThrow(/motivo/)
    const a = await ventas.anular(v.id, { motivo: 'error de carga', usuario_id: 'p-admin' })
    expect(a.estado).toBe('anulada')
    expect(await stock.stockActual(p.id, color.id)).toBe(antes)
    await expect(ventas.anular(v.id, { motivo: 'otra vez', usuario_id: 'p-admin' })).rejects.toThrow(/anulada/)
  })

  it('la cola se vacía al sincronizar y reintenta con espera si falla', async () => {
    const falla = async () => {
      throw new Error('sin servidor')
    }
    const t0 = Date.now()
    const r1 = await procesar({ enviar: falla, ahora: t0 })
    expect(r1.errores).toBeGreaterThan(0)
    expect((await db.ventas.where('sync_status').equals('error').count())).toBeGreaterThan(0)
    // todavía no toca reintentar
    const r2 = await procesar({ enviar: async () => {}, ahora: t0 + 1 })
    expect(r2.enviadas).toBe(0)
    // pasada la espera, se envía y todo queda sincronizado
    const r3 = await procesar({ enviar: async () => {}, ahora: t0 + 10 * 60_000 })
    expect(r3.enviadas).toBeGreaterThan(0)
    expect(await pendientes()).toBe(0)
    expect(await db.ventas.where('sync_status').equals('pending').count()).toBe(0)
    expect(await db.ventas.where('sync_status').equals('error').count()).toBe(0)
  })
})

describe('config y perfiles', () => {
  it('tiene valores base y guarda cambios', async () => {
    expect((await config.obtener('tipo_cambio')).bs).toBe(6.96)
    await config.guardar('url_catalogo', 'https://ejemplo.test')
    expect(await config.obtener('url_catalogo')).toBe('https://ejemplo.test')
    expect(await config.obtener('no_existe', 'x')).toBe('x')
  })
  it('perfiles con iniciales', async () => {
    const ariel = await perfiles.obtener('p-ariel')
    expect(ariel.iniciales).toBe('AM')
  })
})

describe('número de nota', () => {
  it('en un dispositivo nuevo sigue desde la última nota descargada (no vuelve a 0001)', async () => {
    const [p] = await productos.listar()
    // Simula una nota de esa persona que vino del servidor (otro dispositivo) y un correlativo local en cero.
    await db.ventas.add({ id: 'venta-de-otro-dispositivo', numero: 'NV-NT-0007', vendedor_id: 'p-norma', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', total_cent: 0, estado: 'activa', sync_status: 'synced', creada_en: new Date().toISOString() })
    await db.config.delete('correlativo:p-norma')
    const v = await ventas.crear({ vendedor_id: 'p-norma', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', items: [{ producto_id: p.id, color_id: p.colores[0].id, cantidad: 1, unidad: 'docena', precio_cent: 100 }] })
    expect(v.numero).toBe('NV-NT-0008')
  })
})
