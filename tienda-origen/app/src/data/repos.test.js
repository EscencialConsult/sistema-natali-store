import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { cargarSeedSiVacio } from './seed/cargar.js'
import { config, perfiles, productos, stock } from './repos/index.js'
import { pendientes, procesar } from './sync/cola.js'

beforeAll(async () => {
  await cargarSeedSiVacio()
})

describe('seed', () => {
  it('carga 138 productos y no duplica en una segunda carga', async () => {
    expect(await db.productos.count()).toBe(138)
    await cargarSeedSiVacio()
    await Promise.all([cargarSeedSiVacio(), cargarSeedSiVacio()])
    expect(await db.productos.count()).toBe(138)
    expect(await db.perfiles.count()).toBe(3)
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

describe('stock y cola', () => {
  async function productoConStock() {
    const lista = await productos.listar()
    for (const p of lista) {
      const s = await stock.stockPorColor(p.id)
      const color = p.colores.find((c) => (s[c.id] ?? 0) >= 24)
      if (color) return { p, color, antes: s[color.id] }
    }
    throw new Error('sin stock en el seed')
  }

  it('un movimiento manual cambia el stock y entra a la cola', async () => {
    const { p, color, antes } = await productoConStock()
    await stock.registrarMovimiento({ producto_id: p.id, color_id: color.id, tipo: 'salida', delta: 5, motivo: 'merma', usuario_id: 'p-maria' })
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 5)
    await stock.registrarMovimiento({ producto_id: p.id, color_id: color.id, tipo: 'entrada', delta: 5, usuario_id: 'p-maria' })
    expect(await stock.stockActual(p.id, color.id)).toBe(antes)
    expect(await pendientes()).toBeGreaterThanOrEqual(2)
  })

  it('rechaza movimientos inválidos', async () => {
    const { p, color } = await productoConStock()
    await expect(stock.registrarMovimiento({ producto_id: p.id, color_id: color.id, tipo: 'regalo', delta: 1 })).rejects.toThrow(/inválido/)
    await expect(stock.registrarMovimiento({ producto_id: p.id, color_id: color.id, tipo: 'ajuste', delta: 0 })).rejects.toThrow(/distinto de 0/)
  })

  it('la cola se vacía al sincronizar y reintenta con espera si falla', async () => {
    const falla = async () => {
      throw new Error('sin servidor')
    }
    const t0 = Date.now()
    const r1 = await procesar({ enviar: falla, ahora: t0 })
    expect(r1.errores).toBeGreaterThan(0)
    expect(await db.cola_sync.where('estado').equals('error').count()).toBeGreaterThan(0)
    // todavía no toca reintentar
    const r2 = await procesar({ enviar: async () => {}, ahora: t0 + 1 })
    expect(r2.enviadas).toBe(0)
    // pasada la espera, se envía y la cola queda vacía
    const r3 = await procesar({ enviar: async () => {}, ahora: t0 + 10 * 60_000 })
    expect(r3.enviadas).toBeGreaterThan(0)
    expect(await pendientes()).toBe(0)
  })
})

describe('config y perfiles', () => {
  it('tiene valores base y guarda cambios', async () => {
    expect((await config.obtener('tipo_cambio')).bs).toBe(6.96)
    await config.guardar('whatsapp_tienda', '59171234567')
    expect(await config.obtener('whatsapp_tienda')).toBe('59171234567')
    expect(await config.obtener('no_existe', 'x')).toBe('x')
  })
  it('perfiles con iniciales', async () => {
    const pamela = await perfiles.obtener('p-pamela')
    expect(pamela.iniciales).toBe('PA')
  })
})
