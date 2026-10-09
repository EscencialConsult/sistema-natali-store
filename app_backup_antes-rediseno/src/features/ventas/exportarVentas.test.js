import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { cargarSeedSiVacio } from '../../data/seed/cargar.js'
import { productos, ventas } from '../../data/repos/index.js'
import { totalesPorMoneda } from '../../lib/moneda.js'
import { crearExcelVentas } from './exportarVentas.js'

beforeAll(async () => {
  await cargarSeedSiVacio()
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
    expect(hVentas.rowCount - 1).toBe(lista.length)
    expect(hDetalle.rowCount - 1).toBe(lista.reduce((t, v) => t + v.items.length, 0))

    const totalesExcel = {}
    hVentas.eachRow((row, n) => {
      if (n === 1) return
      expect(typeof row.getCell(8).value).toBe('number')
      const moneda = row.getCell(5).value === 'Bs' ? 'bs' : 'usd'
      totalesExcel[moneda] = Math.round(((totalesExcel[moneda] ?? 0) + row.getCell(8).value) * 100) / 100
    })
    for (const t of totalesPorMoneda(lista)) expect(totalesExcel[t.moneda]).toBe(t.total_cent / 100)
  })
})
