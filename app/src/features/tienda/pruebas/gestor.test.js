import { describe, expect, it } from 'vitest'
import { esFechaIso, estadoCuenta, validarTransferencia } from '../lib/configTienda.js'
import { enmascarar, resumenGlobal } from '../lib/gestor.js'

const AHORA = new Date(2026, 9, 15, 10, 0, 0).getTime() // 15/10/2026 10:00 hora local
const iso = (dias) => new Date(AHORA - dias * 86400000).toISOString()
const cuenta = (extra = {}) => ({ titular: 'Titular Prueba', cbu: '0000000000000000000000', alias: 'prueba.alias', actualizado_en: iso(1), ...extra })

describe('esFechaIso', () => {
  it('acepta fechas reales y rechaza el resto', () => {
    expect(esFechaIso('2026-12-01')).toBe(true)
    expect(esFechaIso('2026-02-31')).toBe(false)
    expect(esFechaIso('01/12/2026')).toBe(false)
    expect(esFechaIso('')).toBe(false)
  })
})

describe('validarTransferencia: moneda y fecha de cambio', () => {
  it('moneda por defecto pesos y acepta fecha válida', () => {
    const r = validarTransferencia({ titular: 'A', alias: 'a.b.c', cambiar_el: '2026-12-01' })
    expect(r.errores).toEqual([])
    expect(r.valor.moneda).toBe('ars')
    expect(r.valor.cambiar_el).toBe('2026-12-01')
  })
  it('rechaza una fecha de cambio inválida', () => {
    const r = validarTransferencia({ titular: 'A', alias: 'a.b.c', cambiar_el: '2026-13-40' })
    expect(r.errores.join(' ')).toMatch(/fecha de cambio/)
  })
})

describe('estadoCuenta', () => {
  it('sin datos', () => expect(estadoCuenta({}, AHORA).estado).toBe('sin_datos'))
  it('con fecha de cambio lejana está vigente', () => {
    expect(estadoCuenta(cuenta({ cambiar_el: '2026-12-01' }), AHORA)).toMatchObject({ estado: 'vigente', motivo: 'fecha_de_cambio' })
  })
  it('avisa 7 días antes y el mismo día', () => {
    expect(estadoCuenta(cuenta({ cambiar_el: '2026-10-22' }), AHORA)).toMatchObject({ estado: 'por_vencer', dias: 7 })
    expect(estadoCuenta(cuenta({ cambiar_el: '2026-10-15' }), AHORA)).toMatchObject({ estado: 'por_vencer', dias: 0 })
  })
  it('vence al día siguiente de la fecha', () => {
    expect(estadoCuenta(cuenta({ cambiar_el: '2026-10-14' }), AHORA)).toMatchObject({ estado: 'vencida', dias: -1 })
  })
  it('la fecha de cambio manda sobre la antigüedad', () => {
    expect(estadoCuenta(cuenta({ actualizado_en: iso(200), cambiar_el: '2026-12-01' }), AHORA).estado).toBe('vigente')
  })
  it('sin fecha usa la antigüedad: 50 y 60 días', () => {
    expect(estadoCuenta(cuenta({ actualizado_en: iso(10) }), AHORA).estado).toBe('vigente')
    expect(estadoCuenta(cuenta({ actualizado_en: iso(55) }), AHORA).estado).toBe('por_vencer')
    expect(estadoCuenta(cuenta({ actualizado_en: iso(61) }), AHORA).estado).toBe('vencida')
    expect(estadoCuenta(cuenta({ actualizado_en: undefined }), AHORA)).toMatchObject({ estado: 'vencida', motivo: 'sin_fecha' })
  })
})

describe('enmascarar', () => {
  it('deja solo los últimos 4 dígitos', () => {
    expect(enmascarar('1234567890')).toBe('••••••7890')
    expect(enmascarar('123')).toBe('123')
    expect(enmascarar(null)).toBe('')
  })
})

describe('resumenGlobal', () => {
  const naty = { tipo_cambio: { ars: 1590, bs: 12, ejemplo: false, actualizado_en: iso(1) }, mostrar_precios_publico: true, whatsapp_tienda: '59170000000', url_catalogo: 'https://sitio.test/' }
  const config = { transferencia: cuenta({ cambiar_el: '2026-12-01' }), contactos: [{ nombre: 'Ana', telefono: '59171111111' }], locales: [{ nombre: 'Local', direccion: 'Calle 1' }] }

  it('todo en orden: sin alertas', () => {
    const r = resumenGlobal({ config, naty, origen: 'https://sitio.test', ahora: AHORA })
    expect(r.alertas).toEqual([])
    expect(r.hayAlertasAltas).toBe(false)
    expect(r.cuenta.cbuEnmascarado).toMatch(/^•+0000$/)
    expect(r.sitio.urlSistema).toBe('https://sitio.test/admin/')
  })
  it('cuenta vencida y cotización de ejemplo son alertas altas, ordenadas primero', () => {
    const r = resumenGlobal({
      config: { ...config, transferencia: cuenta({ cambiar_el: '2026-10-01' }) },
      naty: { ...naty, tipo_cambio: { ...naty.tipo_cambio, ejemplo: true }, mostrar_precios_publico: false },
      origen: 'https://sitio.test',
      ahora: AHORA,
    })
    const ids = r.alertas.map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['cuenta-vencida', 'cotizacion-ejemplo', 'precios-ocultos']))
    expect(r.alertas[0].nivel).toBe('alta')
    expect(r.hayAlertasAltas).toBe(true)
  })
  it('sin nada cargado no revienta y lo avisa', () => {
    const r = resumenGlobal({ ahora: AHORA })
    expect(r.cuenta.estado).toBe('sin_datos')
    expect(r.alertas.map((a) => a.id)).toEqual(expect.arrayContaining(['cuenta-sin-datos', 'sin-contacto']))
  })
})
