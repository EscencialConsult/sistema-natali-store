import { beforeEach, describe, expect, it, vi } from 'vitest'

// localStorage mínimo para el entorno de pruebas (node).
beforeEach(() => {
  const datos = new Map()
  vi.stubGlobal('localStorage', { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, String(v)) })
  vi.resetModules()
})

describe('estado de la sincronización', () => {
  it('un fallo queda registrado con su tipo y desde cuándo; no se pisa el «desde» mientras siga fallando', async () => {
    const { estadoSync, registrarFallo } = await import('./estado.js')
    registrarFallo(new Error('registrar_venta: JWT expired'), new Date('2026-10-21T10:00:00Z'))
    registrarFallo(new Error('registrar_venta: JWT expired'), new Date('2026-10-21T10:05:00Z'))
    expect(estadoSync().fallo).toMatchObject({ tipo: 'sesion', desde: '2026-10-21T10:00:00.000Z' })
  })
  it('un ciclo exitoso limpia el fallo y guarda cuándo fue; sobrevive a recargar', async () => {
    const m = await import('./estado.js')
    m.registrarFallo(new Error('Failed to fetch'))
    m.registrarExito(new Date('2026-10-21T10:10:00Z'))
    expect(m.estadoSync()).toEqual({ ok_en: '2026-10-21T10:10:00.000Z', fallo: null })
    vi.resetModules()
    const otra = await import('./estado.js')
    expect(otra.estadoSync().ok_en).toBe('2026-10-21T10:10:00.000Z')
  })
})
