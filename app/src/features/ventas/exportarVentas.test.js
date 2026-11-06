import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { cargarFixture } from '../../test/fixture.js'
import { productos, ventas } from '../../data/repos/index.js'
import { totalesPorMoneda } from '../../lib/moneda.js'
import { crearExcelVentas, libroVentas } from './exportarVentas.js'
import { PRIMERA_FILA_DATOS } from '../../lib/excel.js'

beforeAll(async () => {
  await cargarFixture()
})

describe('exportar ventas a Excel', () => {
  it('exporta notas y detalle con importes numéricos y los totales coinciden con la lista', async () => {
    const [p1, p2] = await productos.listar()
    const item = (p, cantidad, precio) => ({ producto_id: p.id, color_id: p.colores[0].id, cantidad, unidad: 'docena', precio_cent: precio })
    await ventas.crear({ vendedor_id: 'p-ariel', moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', cliente_nombre: 'Ana', items: [item(p1, 2, 10050), item(p2, 1, 2500)] })
    await ventas.crear({ vendedor_id: 'p-norma', moneda: 'bs', tipo_cambio: 6.96, metodo_pago: 'transferencia', items: [item(p1, 1, 70000)] })

    const lista = await ventas.listarConItems({})
    const { default: ExcelJS } = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await (await crearExcelVentas(lista)).arrayBuffer())

    const hVentas = wb.getWorksheet('Ventas')
    const hDetalle = wb.getWorksheet('Detalle')
    expect(hVentas.rowCount - PRIMERA_FILA_DATOS + 1).toBe(lista.length)
    expect(hDetalle.rowCount - PRIMERA_FILA_DATOS + 1).toBe(lista.reduce((t, v) => t + v.items.length, 0))
    expect(hVentas.getCell(PRIMERA_FILA_DATOS - 1, 1).fill.fgColor.argb).toBe('FF8A3A63')

    const totalesExcel = {}
    hVentas.eachRow((row, n) => {
      if (n < PRIMERA_FILA_DATOS) return
      expect(typeof row.getCell(7).value).toBe('number')
      const moneda = row.getCell(6).value === 'Bs' ? 'bs' : 'usd'
      totalesExcel[moneda] = Math.round(((totalesExcel[moneda] ?? 0) + row.getCell(7).value) * 100) / 100
    })
    for (const t of totalesPorMoneda(lista)) expect(totalesExcel[t.moneda]).toBe(t.total_cent / 100)
  })

  it('muestra el descuento de cada nota y el total de descuentos por moneda, sin contar anuladas; la comisión no cambia', () => {
    const items = [{ unidad: 'docena', cantidad: 2 }]
    const v = (extra) => ({ numero: 'N', creada_en: '2026-11-06T12:00:00Z', vendedor_nombre: 'A', cliente_nombre: '', moneda: 'usd', metodo_pago: 'efectivo', tipo_cambio: 1, estado: 'activa', items, total_cent: 9000, ...extra })
    const { hojas } = libroVentas([
      v({ descuento_modo: 'porcentaje', descuento_porcentaje: 10, descuento_cent: 1000 }),
      v({ descuento_modo: 'monto', descuento_cent: 500, total_cent: 9500 }),
      v({ descuento_modo: 'monto', descuento_cent: 700, estado: 'anulada' }),
      v({ total_cent: 100 }),
    ])
    const [notas, , resumen] = hojas
    expect(notas.filas[0]).toMatchObject({ total: 90, descuento: 10, descuento_tipo: '10%', subtotal: 100 })
    expect(notas.filas[1]).toMatchObject({ total: 95, descuento: 5, descuento_tipo: 'Monto fijo', subtotal: 100 })
    expect(notas.filas[3]).toMatchObject({ total: 1, descuento: 0, descuento_tipo: '', subtotal: 1 })
    // 3 notas activas × 2 docenas × US$ 1: con o sin descuento.
    expect(resumen.filas[0]).toMatchObject({ descuentos: 15, con_descuento: 2, comision: 6 })
  })
})
