import { describe, expect, it } from 'vitest'
import { agregarLinea, lineasSinStock, precioDocena, tipoCambioDe, totalDeLineas } from './calculos.js'

const tc = { bs: 6.96, ars: 1400 }

describe('precio y tipo de cambio', () => {
  it('USD no convierte y su tipo de cambio es 1', () => {
    expect(precioDocena({ precioUsdCent: 12000, moneda: 'usd', tc })).toBe(12000)
    expect(tipoCambioDe('usd', tc)).toBe(1)
  })
  it('convierte a Bs y ARS con el tipo de cambio', () => {
    expect(precioDocena({ precioUsdCent: 10000, moneda: 'bs', tc })).toBe(69600)
    expect(precioDocena({ precioUsdCent: 10000, moneda: 'ars', tc })).toBe(14_000_000)
  })
  it('un precio manual gana sobre el de lista', () => {
    expect(precioDocena({ precioUsdCent: 10000, moneda: 'bs', tc, manualCent: 5000 })).toBe(5000)
    expect(precioDocena({ precioUsdCent: 10000, moneda: 'usd', tc, manualCent: 0 })).toBe(0)
  })
  it('sin tipo de cambio avisa qué falta', () => {
    expect(() => tipoCambioDe('bs', {})).toThrow(/BS/)
  })
})

describe('líneas', () => {
  it('junta el mismo producto en una sola línea', () => {
    let l = agregarLinea([], { productoId: 'p1', colorId: 'c1', cantidad: 1, precioCent: 100 })
    l = agregarLinea(l, { productoId: 'p2', colorId: null, cantidad: 1, precioCent: 100 })
    l = agregarLinea(l, { productoId: 'p1', colorId: 'c1', cantidad: 2, precioCent: 100 })
    expect(l).toHaveLength(2)
    expect(l.find((x) => x.productoId === 'p1').cantidad).toBe(3)
  })
  it('totaliza en enteros', () => {
    expect(totalDeLineas([{ cantidad: 2, precioCent: 1999 }, { cantidad: 1, precioCent: 1 }])).toBe(3999)
  })
  it('detecta líneas que superan el stock del producto', () => {
    const l = [{ productoId: 'p1', cantidad: 2 }, { productoId: 'p2', cantidad: 1 }]
    expect(lineasSinStock(l, { p1: 24, p2: 11 }).map((x) => x.productoId)).toEqual(['p2'])
    expect(lineasSinStock(l, { p1: 24, p2: 12 })).toEqual([])
  })
})
