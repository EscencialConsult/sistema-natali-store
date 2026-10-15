import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { sitio } from './repos/index.js'

describe('contenido del sitio', () => {
  it('sale completo con valores por defecto marcados como provisorios', async () => {
    const s = await sitio.obtener()
    expect(s.provisorio).toBe(true)
    expect(s.como_comprar).toHaveLength(3)
    expect(s.legales.terminos).toMatch(/^BORRADOR/)
    expect(s.local.horarios.length).toBeGreaterThan(0)
  })
  it('guardar un cambio parcial conserva el resto', async () => {
    const s = await sitio.guardar({ lema: 'Nuevo lema', provisorio: false })
    expect(s.lema).toBe('Nuevo lema')
    expect(s.provisorio).toBe(false)
    expect(s.como_comprar).toHaveLength(3)
    expect((await sitio.obtener()).lema).toBe('Nuevo lema')
  })
  it('rechaza datos inválidos', async () => {
    await expect(sitio.guardar({ compra_minima_cent: -1 })).rejects.toThrow()
  })
})
