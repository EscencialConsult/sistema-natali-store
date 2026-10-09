import { describe, expect, it } from 'vitest'
import { idDeterministico, nuevoId } from './id.js'

const FORMATO = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('ids', () => {
  it('nuevoId genera UUID v4 distintos', () => {
    const a = nuevoId()
    expect(a).toMatch(FORMATO)
    expect(nuevoId()).not.toBe(a)
  })

  it('idDeterministico: mismo texto → mismo id (en cualquier dispositivo), formato UUID', () => {
    expect(idDeterministico('categoria:BLUSAS')).toBe(idDeterministico('categoria:BLUSAS'))
    expect(idDeterministico('categoria:BLUSAS')).toMatch(FORMATO)
  })

  it('idDeterministico: textos distintos → ids distintos (138 variantes sin choques)', () => {
    const ids = new Set(Array.from({ length: 500 }, (_, i) => idDeterministico(`categoria:CAT-${i}`)))
    expect(ids.size).toBe(500)
    expect(idDeterministico('categoria:LINO')).not.toBe(idDeterministico('categoria:lino'))
  })
})
