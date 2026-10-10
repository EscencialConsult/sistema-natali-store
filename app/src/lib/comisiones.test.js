import { describe, expect, it } from 'vitest'
import { comisionDeDocenas, comisionesPorVendedor, docenasDe } from './comisiones.js'
import { aPrendas, esCantidadValida, leerDocenas, normalizarCantidad, subtotal, textoDocenas } from './docenas.js'
import { estadoStock } from './stock.js'

const item = (cantidad) => ({ unidad: 'docena', cantidad })

describe('comisión', () => {
  it('criterio de aceptación: 3 docenas + 2 medias docenas = USD 4,00', () => {
    const items = [item(1), item(1), item(1), item(0.5), item(0.5)]
    expect(docenasDe(items)).toBe(4)
    expect(comisionDeDocenas(docenasDe(items))).toBe(400)
  })

  it('es en dólares sin importar la moneda, por vendedor, y las anuladas no suman', () => {
    const r = comisionesPorVendedor([
      { vendedor_id: 'a', moneda: 'bs', estado: 'activa', items: [item(2.5)] },
      { vendedor_id: 'a', moneda: 'usd', estado: 'activa', items: [item(1)] },
      { vendedor_id: 'a', moneda: 'usd', estado: 'anulada', items: [item(10)] },
      { vendedor_id: 'b', moneda: 'ars', estado: 'activa', items: [item(0.5)] },
    ])
    expect(r.find((f) => f.vendedor_id === 'a')).toMatchObject({ docenas: 3.5, comision_usd_cent: 350 })
    expect(r.find((f) => f.vendedor_id === 'b')).toMatchObject({ docenas: 0.5, comision_usd_cent: 50 })
  })
})

describe('medias docenas', () => {
  it('solo acepta pasos de 0,5 y redondea medio centavo', () => {
    expect(esCantidadValida(1.5)).toBe(true)
    expect(esCantidadValida(1.25)).toBe(false)
    expect(normalizarCantidad(1.3)).toBe(1.5)
    expect(normalizarCantidad(0)).toBe(0.5)
    expect(subtotal(0.5, 10001)).toBe(5001)
  })
})

describe('todo en docenas', () => {
  it('solo docenas o medias docenas: nada de 0,1 ni unidades sueltas', () => {
    expect(leerDocenas('1,5')).toEqual({ docenas: 1.5 })
    expect(leerDocenas('2')).toEqual({ docenas: 2 })
    expect(leerDocenas('0,1').error).toMatch(/medias docenas/)
    expect(leerDocenas('1,25').error).toMatch(/medias docenas/)
    expect(leerDocenas('0').error).toBeTruthy()
    expect(leerDocenas('0', { permitirCero: true })).toEqual({ docenas: 0 })
    expect(leerDocenas('-1').error).toBeTruthy()
    expect(aPrendas(1.5)).toBe(18)
  })
  it('el stock se muestra en docenas', () => {
    expect(textoDocenas(18)).toBe('1,5 doc.')
    expect(textoDocenas(12, { corto: false })).toBe('1 docena')
    expect(estadoStock(120, 24).texto).toBe('10 doc.')
    expect(estadoStock(18, 24).texto).toBe('Quedan 1,5 doc.')
  })
})
