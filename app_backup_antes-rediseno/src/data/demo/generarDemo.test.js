import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import { cargarSeedSiVacio } from '../seed/cargar.js'
import { perfiles, stock, ventas } from '../repos/index.js'
import { pendientes } from '../sync/cola.js'
import { generarDemo } from './generarDemo.js'

const AHORA = new Date('2026-10-08T15:00:00')
let res

beforeAll(async () => {
  await cargarSeedSiVacio()
  res = await generarDemo({ cantidad: 40, dias: 9, ahora: AHORA })
}, 120_000)

describe('datos de demostración', () => {
  it('genera ventas, anula dos y repone stock', () => {
    expect(res.ventas).toBeGreaterThan(30)
    expect(res.anuladas).toBe(2)
    expect(res.entradas).toBe(6)
  })

  it('las ventas están repartidas en varios días, hasta hoy, y no en el futuro', async () => {
    const todas = await ventas.listar()
    const dias = new Set(todas.map((v) => v.creada_en.slice(0, 10)))
    expect(dias.size).toBeGreaterThanOrEqual(5)
    expect(todas.every((v) => new Date(v.creada_en) <= AHORA)).toBe(true)
    expect(todas.some((v) => new Date(v.creada_en).toDateString() === AHORA.toDateString())).toBe(true)
  })

  it('la mayoría es en dólares y hay de las tres monedas y de varios vendedores', async () => {
    const todas = await ventas.listar()
    const por = (m) => todas.filter((v) => v.moneda === m).length
    expect(por('usd')).toBeGreaterThan(por('bs') + por('ars'))
    expect(por('bs')).toBeGreaterThan(0)
    expect(por('ars')).toBeGreaterThan(0)
    expect(new Set(todas.map((v) => v.vendedor_id)).size).toBeGreaterThanOrEqual(3)
  })

  it('el stock no queda en negativo y las ventas figuran como ya enviadas', async () => {
    expect(Object.values(await stock.resumen()).every((n) => n >= 0)).toBe(true)
    expect(await pendientes()).toBe(0)
    expect((await ventas.listar()).every((v) => v.sync_status === 'synced')).toBe(true)
  })

  it('la numeración por vendedor es única y las anuladas quedan marcadas', async () => {
    const todas = await ventas.listar()
    expect(new Set(todas.map((v) => v.numero)).size).toBe(todas.length)
    expect(todas.filter((v) => v.estado === 'anulada')).toHaveLength(2)
  })

  it('completa teléfonos y URL del QR solo si estaban vacíos', async () => {
    expect((await perfiles.obtener('p-ariel')).telefono).toBe('59170000001')
    expect((await db.config.get('url_catalogo')).valor).toMatch(/^https:\/\//)
  })

  it('se puede repetir: suma más ventas sin pisar las anteriores', async () => {
    const antes = (await ventas.listar()).length
    const r2 = await generarDemo({ cantidad: 5, dias: 9, ahora: AHORA })
    expect((await ventas.listar()).length).toBe(antes + r2.ventas)
  }, 60_000)
})
