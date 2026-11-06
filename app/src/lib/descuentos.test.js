import { describe, expect, it } from 'vitest'
import { calcularDescuento, descuentosPorMoneda, etiquetaDescuento, leerDescuento, subtotalDe } from './descuentos.js'

describe('descuentos', () => {
  it('calcula porcentaje y monto en centavos; sin descuento es 0', () => {
    expect(calcularDescuento(10000, null)).toBe(0)
    expect(calcularDescuento(10000, { modo: 'porcentaje', valor: 12.5 })).toBe(1250)
    expect(calcularDescuento(10000, { modo: 'monto', valor: 300 })).toBe(300)
  })

  it('redondea igual que Postgres en los casos que en coma flotante dan distinto', () => {
    // 1,005 × 1,5 % = 0,15075: redondeo aritmético exacto, no el del doble.
    expect(calcularDescuento(1005, { modo: 'porcentaje', valor: 1.5 })).toBe(15)
    expect(calcularDescuento(1000, { modo: 'porcentaje', valor: 1.25 })).toBe(13)
    expect(calcularDescuento(33333, { modo: 'porcentaje', valor: 12.35 })).toBe(4117)
  })

  it('lee lo que escribe la persona', () => {
    expect(leerDescuento('porcentaje', '10,5', 10000, 'usd')).toEqual({ descuento: { modo: 'porcentaje', valor: 10.5 }, cent: 1050 })
    expect(leerDescuento('porcentaje', '10 %', 10000, 'usd').cent).toBe(1000)
    expect(leerDescuento('monto', '50,00', 10000, 'usd')).toEqual({ descuento: { modo: 'monto', valor: 5000 }, cent: 5000 })
    expect(leerDescuento('monto', '59.000', 10_000_000, 'ars').cent).toBe(5_900_000)
    expect(leerDescuento('porcentaje', '100', 10000, 'usd').cent).toBe(10000)
  })

  it('avisa los valores imposibles; el campo vacío todavía no es un error', () => {
    expect(leerDescuento('porcentaje', '', 10000, 'usd')).toEqual({})
    expect(leerDescuento('porcentaje', '0', 10000, 'usd').error).toMatch(/mayor a 0/)
    expect(leerDescuento('porcentaje', '101', 10000, 'usd').error).toMatch(/hasta 100/)
    expect(leerDescuento('porcentaje', 'abc', 10000, 'usd').error).toBeTruthy()
    expect(leerDescuento('monto', '0', 10000, 'usd').error).toMatch(/mayor a 0/)
    expect(leerDescuento('monto', '-5', 10000, 'usd').error).toMatch(/mayor a 0/)
    expect(leerDescuento('monto', '100,01', 10000, 'usd').error).toMatch(/No puede ser mayor/)
    expect(leerDescuento('porcentaje', '0,01', 10, 'usd').error).toMatch(/no descuenta nada/)
  })

  it('suma por moneda sin mezclarlas y sin contar anuladas ni ventas viejas sin el campo', () => {
    const ventas = [
      { moneda: 'bs', estado: 'activa', descuento_cent: 500 },
      { moneda: 'usd', estado: 'activa', descuento_cent: 100 },
      { moneda: 'usd', estado: 'activa', descuento_cent: 200 },
      { moneda: 'usd', estado: 'anulada', descuento_cent: 999 },
      { moneda: 'ars', estado: 'activa', descuento_cent: 0 },
      { moneda: 'ars', estado: 'activa' },
    ]
    expect(descuentosPorMoneda(ventas)).toEqual([{ moneda: 'usd', cent: 300, ventas: 2 }, { moneda: 'bs', cent: 500, ventas: 1 }])
  })

  it('textos y subtotal de una nota', () => {
    expect(etiquetaDescuento({ modo: 'porcentaje', porcentaje: 12.5 })).toBe('Descuento (12,5%)')
    expect(etiquetaDescuento({ modo: 'monto' })).toBe('Descuento')
    expect(subtotalDe({ total_cent: 900, descuento_cent: 100 })).toBe(1000)
    expect(subtotalDe({ total_cent: 900 })).toBe(900)
  })
})
