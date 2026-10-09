import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { cargarSeedSiVacio } from './seed/cargar.js'
import { almacenamiento, productos, stock, ventas } from './repos/index.js'
import { nivelDe, resumenUso } from '../lib/almacenamiento.js'

const POR = { por: 'p-super' }
// Stock sin los colores en 0 (un color sin movimientos y uno que suma 0 tienen el mismo stock).
const stockNeto = async () => Object.fromEntries(Object.entries(await stock.resumen()).filter(([, n]) => n !== 0))
let corte

beforeAll(async () => {
  await db.delete()
  await db.open()
  await cargarSeedSiVacio()
  const [p1, p2] = await productos.listar()
  const item = (p, cantidad) => ({ producto_id: p.id, color_id: p.colores[0].id, cantidad, unidad: 'docena', precio_cent: 1000 })
  const vieja = await ventas.crear({ vendedor_id: 'p-ariel', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', items: [item(p1, 2), item(p2, 0.5)] })
  await ventas.anular(vieja.id, { motivo: 'prueba', usuario_id: 'p-admin' })
  await ventas.crear({ vendedor_id: 'p-norma', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', items: [item(p1, 1)] })
  // La primera venta y sus movimientos pasan a ser "viejos".
  const viejo = '2025-01-15T12:00:00.000Z'
  await db.ventas.update(vieja.id, { creada_en: viejo })
  await db.movimientos_stock.where('venta_id').equals(vieja.id).modify({ creado_en: viejo })
  corte = '2026-01-01T00:00:00.000Z'
})

describe('uso de almacenamiento', () => {
  it('niveles: aviso desde 80 %, urgente desde 95 %; manda el más lleno', () => {
    expect([nivelDe(79.9), nivelDe(80), nivelDe(95)]).toEqual(['ok', 'aviso', 'urgente'])
    const r = resumenUso({ datos_bytes: 90, fotos_bytes: 10 }, { datos: 100, fotos: 100 })
    expect(r).toMatchObject({ pct: 90, nivel: 'aviso' })
  })

  it('mide datos y fotos en bytes', async () => {
    const m = await almacenamiento.medir()
    expect(m.datos_bytes).toBeGreaterThan(0)
    expect(m.fotos_bytes).toBe(0) // el seed usa rutas, no fotos subidas
  })
})

describe('limpieza manual', () => {
  it('solo el superadmin puede borrar', async () => {
    await expect(almacenamiento.borrarVentas({ antesDe: corte }, { por: 'p-admin' })).rejects.toThrow('Solo el superadmin')
    await expect(almacenamiento.borrarFotosDeBaja({ por: 'p-ariel' })).rejects.toThrow('Solo el superadmin')
  })

  it('borrar ventas viejas no cambia el stock y deja las nuevas', async () => {
    const antes = await stockNeto()
    const prev = await almacenamiento.previsualizar({ antesDe: corte })
    expect(prev.ventas.cantidad).toBe(1)
    expect(await almacenamiento.borrarVentas({ antesDe: corte }, POR)).toBe(1)
    expect(await stockNeto()).toEqual(antes)
    expect(await db.ventas.count()).toBe(1)
  })

  it('resumir el historial deja un saldo por color y el mismo stock', async () => {
    const antes = await stockNeto()
    const n = await almacenamiento.resumirMovimientos({ antesDe: '2027-01-01T00:00:00.000Z' }, POR)
    expect(n).toBeGreaterThan(0)
    expect(await stockNeto()).toEqual(antes)
    expect(await db.movimientos_stock.filter((m) => m.tipo !== 'saldo').count()).toBe(0)
  })

  it('productos de baja: borra solo los que nunca se vendieron', async () => {
    const [vendido, , libre] = await productos.listar()
    await db.productos.update(vendido.id, { activo: false })
    await db.productos.update(libre.id, { activo: false })
    const prev = await almacenamiento.previsualizar()
    expect(prev.productos).toMatchObject({ cantidad: 1, conVentas: 1 })
    expect(await almacenamiento.borrarFotosDeBaja(POR)).toBe(2)
    expect(await almacenamiento.borrarProductosDeBaja(POR)).toBe(1)
    expect(await db.productos.get(libre.id)).toBeUndefined()
    expect(await db.productos.get(vendido.id)).toBeDefined()
  })
})
