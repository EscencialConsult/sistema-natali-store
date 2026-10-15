import { describe, expect, it } from 'vitest'
import { armarLinea, itemsParaPedido, lineasConProblema, totales } from './carrito.js'

const producto = { id: 'p1', activo: true, publicado_tienda: true, precio_unidad_bs_cent: 1000, colores: [{ id: 'c1', nombre: 'Rojo' }] }
const item = (cantidad, color_id = 'c1') => ({ key: `p1:${color_id}`, producto_id: 'p1', color_id, cantidad })

describe('carrito', () => {
  it('arma la línea con precio actual y detecta problemas', () => {
    expect(armarLinea(item(2), producto, { c1: 5 })).toMatchObject({ precio_cent: 1000, subtotal_cent: 2000, disponible: 5, problema: null })
    expect(armarLinea(item(9), producto, { c1: 5 }).problema).toBe('cantidad_mayor')
    expect(armarLinea(item(1), producto, { c1: 0 }).problema).toBe('sin_stock')
    expect(armarLinea(item(1, 'otro'), producto, {}).problema).toBe('sin_color')
    expect(armarLinea(item(1), undefined, {}).problema).toBe('sin_producto')
    expect(armarLinea(item(1), { ...producto, publicado_tienda: false }, { c1: 5 }).problema).toBe('sin_producto')
  })
  it('totaliza solo lo vendible y acota al disponible', () => {
    const lineas = [armarLinea(item(2), producto, { c1: 5 }), armarLinea(item(9), producto, { c1: 5 }), armarLinea(item(1), undefined, {})]
    expect(totales(lineas)).toEqual({ unidades: 7, subtotal_cent: 7000 })
    expect(lineasConProblema(lineas)).toHaveLength(2)
    expect(itemsParaPedido(lineas)).toEqual([{ producto_id: 'p1', color_id: 'c1', cantidad: 2 }])
  })
})
