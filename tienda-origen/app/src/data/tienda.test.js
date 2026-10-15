import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { cargarSeedSiVacio } from './seed/cargar.js'
import { productos } from './repos/index.js'
import { disponibilidad } from '../lib/stock.js'

beforeAll(async () => {
  await cargarSeedSiVacio()
})

describe('catálogo de tienda', () => {
  it('solo lista publicados con precio minorista', async () => {
    const todos = await productos.listarTienda()
    expect(todos.length).toBeGreaterThan(0)
    const [p] = todos
    await db.productos.update(p.id, { publicado_tienda: false })
    expect((await productos.listarTienda()).some((x) => x.id === p.id)).toBe(false)
    await db.productos.update(p.id, { publicado_tienda: true, precio_unidad_bs_cent: null })
    expect((await productos.listarTienda()).some((x) => x.id === p.id)).toBe(false)
    await db.productos.update(p.id, { precio_unidad_bs_cent: 12000 })
    expect((await productos.listarTienda()).some((x) => x.id === p.id)).toBe(true)
  })
  it('ordena por precio y busca por nombre o código', async () => {
    const asc = await productos.listarTienda({ orden: 'precio_asc' })
    expect(asc[0].precio_unidad_bs_cent).toBeLessThanOrEqual(asc[asc.length - 1].precio_unidad_bs_cent)
    const nov = await productos.listarTienda({ orden: 'novedad' })
    expect(nov[0].nuevo).toBe(true)
    expect((await productos.listarTienda({ texto: 'blazer' })).every((p) => /blazer/i.test(p.nombre))).toBe(true)
    expect((await productos.listarTienda({ texto: 'mn-002' })).map((p) => p.codigo)).toEqual(['MN-002'])
  })
  it('encuentra por slug', async () => {
    const [p] = await productos.listarTienda()
    expect((await productos.obtenerPorSlug(p.slug))?.id).toBe(p.id)
    expect(await productos.obtenerPorSlug('no-existe')).toBeUndefined()
  })
})

describe('disponibilidad pública', () => {
  it('nunca muestra cantidades grandes', () => {
    expect(disponibilidad(0, 6)).toEqual({ clave: 'agotado', texto: 'Sin stock' })
    expect(disponibilidad(3, 6).texto).toBe('Quedan 3')
    expect(disponibilidad(40, 6).texto).toBe('Disponible')
  })
})
