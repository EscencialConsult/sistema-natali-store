import { describe, expect, it } from 'vitest'
import { diaLaPaz, esHoy, fechaDia, fechaHoraTicket, finDelDia, inicioDelDia, inicioDelMes, sumarDias } from './fechas.js'

// Estas pruebas no dependen de la zona del sistema: corren igual con TZ=UTC o TZ=America/Argentina/Buenos_Aires.
describe('fechas en America/La_Paz', () => {
  it('a las 23:30 de Argentina todavía es el mismo día en Bolivia', () => {
    // 2026-10-09 23:30 en Buenos Aires = 2026-10-10 02:30 UTC = 2026-10-09 22:30 en La Paz
    const f = new Date('2026-10-10T02:30:00Z')
    expect(diaLaPaz(f)).toBe('2026-10-09')
    expect(fechaDia(f)).toBe('09/10/2026')
    expect(fechaHoraTicket(f)).toBe('09/10/2026 22:30')
  })

  it('a las 03:30 UTC ya es el día siguiente en Bolivia solo después de las 04:00 UTC', () => {
    expect(diaLaPaz(new Date('2026-10-10T03:59:59Z'))).toBe('2026-10-09')
    expect(diaLaPaz(new Date('2026-10-10T04:00:00Z'))).toBe('2026-10-10')
  })

  it('inicio y fin del día son las 00:00 y 23:59:59.999 de Bolivia', () => {
    const f = new Date('2026-10-10T02:30:00Z')
    expect(inicioDelDia(f).toISOString()).toBe('2026-10-09T04:00:00.000Z')
    expect(finDelDia(f).toISOString()).toBe('2026-10-10T03:59:59.999Z')
  })

  it('sumar días y primer día del mes', () => {
    const f = new Date('2026-10-10T02:30:00Z')
    expect(sumarDias(f, -6).toISOString()).toBe('2026-10-03T04:00:00.000Z')
    expect(inicioDelMes(f).toISOString()).toBe('2026-10-01T04:00:00.000Z')
  })

  it('esHoy compara días de Bolivia', () => {
    expect(esHoy(new Date())).toBe(true)
    expect(esHoy(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))).toBe(false)
  })
})
