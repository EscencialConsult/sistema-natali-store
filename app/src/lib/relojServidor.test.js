import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  const datos = new Map()
  vi.stubGlobal('localStorage', { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, String(v)) })
  vi.resetModules()
})

describe('desfase del reloj', () => {
  it('PC atrasada 31 min: lo detecta, lo avisa y lo describe', async () => {
    const r = await import('./relojServidor.js')
    r.registrarHoraServidor(new Date('2026-10-21T10:31:00Z').toUTCString(), Date.parse('2026-10-21T10:00:00Z'))
    expect(r.relojDesfasado()).toBe(true)
    expect(Math.round(r.desfaseReloj() / 60_000)).toBe(31)
    expect(r.textoDesfase(r.desfaseReloj())).toBe('31 minutos atrasada')
  })
  it('una diferencia de segundos es normal y no avisa; una fecha ilegible se ignora', async () => {
    const r = await import('./relojServidor.js')
    r.registrarHoraServidor(new Date('2026-10-21T10:00:20Z').toUTCString(), Date.parse('2026-10-21T10:00:00Z'))
    expect(r.relojDesfasado()).toBe(false)
    r.registrarHoraServidor('no es una fecha')
    expect(Math.round(r.desfaseReloj() / 1000)).toBe(20)
  })
  it('adelantada y en horas', async () => {
    const r = await import('./relojServidor.js')
    expect(r.textoDesfase(-3 * 3600_000)).toBe('3 horas adelantada')
  })
})
