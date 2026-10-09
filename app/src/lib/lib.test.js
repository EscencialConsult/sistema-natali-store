import { describe, expect, it } from 'vitest'
import { aCentavos, convertirDesdeUsd, formatear, MONEDAS, sumar, totalesPorMoneda } from './moneda.js'
import { partirCodigo, puntajeCodigo } from './codigo.js'
import { puede } from './permisos.js'

describe('moneda', () => {
  it('USD va primero y Bs al final', () => {
    expect(MONEDAS).toEqual(['usd', 'ars', 'bs'])
  })
  it('convierte a centavos sin errores de flotante', () => {
    expect(aCentavos(1.005)).toBe(101)
    expect(aCentavos(19.99)).toBe(1999)
    expect(aCentavos(0.1 + 0.2)).toBe(30)
  })
  it('suma en enteros', () => {
    expect(sumar([1999, 1, 0])).toBe(2000)
  })
  it('formatea con símbolo', () => {
    expect(formatear(1999, 'usd')).toMatch(/^US\$ 19,99$/)
    expect(formatear(5, 'bs')).toMatch(/^Bs 0,05$/)
  })
  it('convierte desde USD y exige tipo de cambio', () => {
    expect(convertirDesdeUsd(1000, 'usd', {})).toBe(1000)
    expect(convertirDesdeUsd(1000, 'bs', { bs: 6.96 })).toBe(6960)
    expect(() => convertirDesdeUsd(1000, 'ars', { bs: 6.96 })).toThrow()
  })
  it('totaliza por moneda sin mezclar y en orden USD primero', () => {
    const t = totalesPorMoneda([
      { moneda: 'bs', total_cent: 100 },
      { moneda: 'usd', total_cent: 50 },
      { moneda: 'bs', total_cent: 25 },
    ])
    expect(t).toEqual([
      { moneda: 'usd', total_cent: 50 },
      { moneda: 'bs', total_cent: 125 },
    ])
  })
})

describe('codigo', () => {
  it('parte letras y números', () => {
    expect(partirCodigo('MN-005')).toEqual({ letras: 'MN', digitos: '005', resto: '' })
    expect(partirCodigo(' mn 5 ')).toEqual({ letras: 'MN', digitos: '5', resto: '' })
  })
  it('"mn5", "MN-005" y "5" apuntan al mismo código', () => {
    for (const q of ['mn5', 'MN-005', 'mn05', '5']) expect(puntajeCodigo(q, 'MN-005')).toBe(0)
  })
  it('prefijo numérico puntúa peor que exacto y no coincide con otros', () => {
    expect(puntajeCodigo('1', 'MN-010')).toBeGreaterThan(0)
    expect(puntajeCodigo('1', 'MN-005')).toBeNull()
    expect(puntajeCodigo('xx5', 'MN-005')).toBeNull()
  })
})

describe('permisos', () => {
  it('cada rol solo hace lo suyo', () => {
    expect(puede('vendedor', 'venta.crear')).toBe(true)
    expect(puede('vendedor', 'ventas.ver_todas')).toBe(false)
    expect(puede('enc_deposito', 'stock.mover')).toBe(true)
    expect(puede('enc_deposito', 'venta.crear')).toBe(false)
    expect(puede('admin', 'ajustes.editar')).toBe(true)
    expect(puede(null, 'catalogo.ver')).toBe(false)
  })
})
