// Stock en el dispositivo: la misma regla que tienda_disponible() en la base (dos modelos conviven).
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { stock } from './repos/index.js'

const mov = (id, producto_id, color_id, tipo, delta) => ({ id, producto_id, color_id, tipo, delta, motivo: '', creado_en: new Date().toISOString() })

beforeEach(async () => {
  await Promise.all([db.producto_colores.clear(), db.movimientos_stock.clear()])
  await db.producto_colores.bulkAdd([
    { id: 'c-unico', producto_id: 'p-unico', nombre: 'Negro', hex: '#000', orden: 0, eliminado: false },
    { id: 'c-viejo', producto_id: 'p-unico', nombre: 'Viejo', hex: '#ccc', orden: 1, eliminado: true },
    { id: 'c-rojo', producto_id: 'p-multi', nombre: 'Rojo', hex: '#f00', orden: 0, eliminado: false },
    { id: 'c-azul', producto_id: 'p-multi', nombre: 'Azul', hex: '#00f', orden: 1, eliminado: false },
  ])
  await db.movimientos_stock.bulkAdd([
    mov('1', 'p-unico', 'c-unico', 'entrada', 10),
    mov('2', 'p-unico', 'c-viejo', 'entrada', 4),
    mov('3', 'p-unico', null, 'venta', -2),
    mov('4', 'p-multi', 'c-rojo', 'entrada', 3),
    mov('5', 'p-multi', 'c-azul', 'entrada', 1),
  ])
})

describe('stock por producto o por color', () => {
  it('color único: cuentan todos los movimientos del producto, también los sin color y los de colores eliminados', async () => {
    expect(await stock.stockPorColor('p-unico')).toEqual({ 'c-unico': 12 })
    expect((await stock.resumen())['c-unico']).toBe(12)
  })
  it('varios colores: el stock sigue siendo por color', async () => {
    expect(await stock.stockPorColor('p-multi')).toEqual({ 'c-rojo': 3, 'c-azul': 1 })
  })
  it('las reservas de un producto de color único se cuentan en ese color', async () => {
    await db.movimientos_stock.add(mov('6', 'p-unico', null, 'reserva', -3))
    expect((await stock.reservado())['c-unico']).toBe(3)
  })
})
