import { describe, expect, it } from 'vitest'
import { aCentavos, convertirDesdeUsd, formatear, MONEDAS, sumar, totalesPorMoneda } from './moneda.js'
import { resumenCobros } from './cobros.js'
import { partirCodigo, puntajeCodigo, siguienteCodigo } from './codigo.js'
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

describe('siguienteCodigo', () => {
  it('suma uno al número más alto del prefijo más usado', () => {
    expect(siguienteCodigo(['MN-001', 'MN-138', 'MN-020'])).toBe('MN-139')
    expect(siguienteCodigo(['MN-009', 'PRUEBA-100', 'MN-010'])).toBe('MN-011')
  })
  it('sin productos arranca en MN-001 y respeta otro prefijo por defecto', () => {
    expect(siguienteCodigo([])).toBe('MN-001')
    expect(siguienteCodigo(['', null, 'sin-codigo'])).toBe('MN-001')
    expect(siguienteCodigo([], 'XX')).toBe('XX-001')
  })
  it('un número mayor a 999 no se corta', () => {
    expect(siguienteCodigo(['MN-999'])).toBe('MN-1000')
  })
})

describe('resumenCobros', () => {
  const c = (cobrado, neto, precio, recargo = 0) => ({ cobrado, neto, precio, recargo })
  it('suma cobrado, descuento y neto solo de los cobros con detalle', () => {
    const r = resumenCobros([c(5.21, 4.74, 5, 0.21), c(26.04, 24.97, 25, 1.04), { cobrado: 100, neto: null, precio: 1 }])
    expect(r.conDetalle).toBe(2)
    expect(r.sinDetalle).toBe(1)
    expect(r.cobrado).toBe(31.25)
    expect(r.neto).toBe(29.71)
    expect(r.descuento).toBe(1.54)
    expect(r.faltante).toBe(0.29) // el precio era 30 y llegaron 29,71
    expect(r.descuentoPct).toBeCloseTo(4.93, 1)
  })
  it('sin cobros no inventa porcentajes', () => {
    const r = resumenCobros([])
    expect(r).toMatchObject({ conDetalle: 0, descuentoPct: null, faltante: null, minPct: null })
  })
})

describe('permisos', () => {
  it('cada rol solo hace lo suyo', () => {
    expect(puede('vendedor', 'panel.ver')).toBe(false)
    expect(puede('enc_tienda', 'pedidos.estado')).toBe(true)
    expect(puede('enc_tienda', 'catalogo.editar')).toBe(false)
    expect(puede('enc_deposito', 'stock.mover')).toBe(true)
    expect(puede('enc_deposito', 'pedidos.ver')).toBe(false)
    expect(puede('admin', 'ajustes.editar')).toBe(true)
    expect(puede('admin', 'pedidos.reembolsar')).toBe(true)
    expect(puede(null, 'catalogo.ver')).toBe(false)
  })
})
