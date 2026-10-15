import { describe, expect, it } from 'vitest'
import { textoCotizacion } from './lib/cotizacion.js'

describe('textoCotizacion', () => {
  it('muestra pesos y bolivianos con la fecha de la cotización', () => {
    // Mediodía UTC para que la fecha no dependa de la zona horaria de quien corre la prueba.
    const t = textoCotizacion({ tipo_cambio_ars: 1590, tipo_cambio_bs: 12, tipo_cambio_actualizado_en: '2026-10-12T15:00:00Z' })
    expect(t).toMatch(/^Cotización del 12\/10: 1 US\$ = \$ 1\.590 · Bs 12$/)
  })

  it('sin fecha dice solo "Cotización"', () => {
    expect(textoCotizacion({ tipo_cambio_ars: 1590, tipo_cambio_bs: null })).toBe('Cotización: 1 US$ = $ 1.590')
  })

  it('con tasas inválidas o ausentes no muestra nada', () => {
    for (const aj of [null, undefined, {}, { tipo_cambio_ars: 0, tipo_cambio_bs: 'mucho' }]) expect(textoCotizacion(aj)).toBe('')
  })
})
