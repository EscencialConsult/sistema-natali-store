import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { cargarFixture } from '../../test/fixture.js'
import { productos, stock } from '../../data/repos/index.js'
import { crearPlantillaStock, ejecutarStock, leerExcelStock, planificarStock } from './importarStock.js'

let lista
beforeAll(async () => {
  await cargarFixture()
  lista = await productos.listar()
})

describe('carga de stock por Excel (stock del producto, en docenas)', () => {
  it('la planilla con el stock actual vuelve sin cambios', async () => {
    const actual = await stock.resumen()
    const blob = await crearPlantillaStock(lista.slice(0, 5), actual)
    const filas = await leerExcelStock(await blob.arrayBuffer())
    expect(filas).toHaveLength(5)
    const plan = planificarStock(filas, lista, actual)
    expect(plan.every((p) => p.accion === 'sin_cambio')).toBe(true)
  })

  it('un conteo distinto (en docenas) genera un ajuste por la diferencia, con historial', async () => {
    const p = lista[10]
    const antes = await stock.stockDe(p.id)
    const plan = planificarStock([{ fila: 2, codigo: p.codigo.toLowerCase(), docenas: String((antes + 36) / 12).replace('.', ',') }], lista, { [p.id]: antes })
    expect(plan[0]).toMatchObject({ accion: 'ajustar', delta: 36, actual: antes })
    expect((await ejecutarStock(plan, 'p-maria')).ajustados).toBe(1)
    expect(await stock.stockDe(p.id)).toBe(antes + 36)
    const movs = await stock.movimientos(p.id)
    expect(movs.some((m) => m.tipo === 'ajuste' && m.delta === 36 && m.usuario_id === 'p-maria')).toBe(true)
  })

  it('marca errores por fila sin frenar las demás', () => {
    const p = lista[0]
    const plan = planificarStock(
      [
        { fila: 2, codigo: 'XX-999', docenas: '5' },
        { fila: 3, codigo: p.codigo, docenas: '-3' },
        { fila: 4, codigo: p.codigo, docenas: '0,1' },
        { fila: 5, codigo: p.codigo, docenas: '2,5' },
        { fila: 6, codigo: p.codigo, docenas: '3' },
      ],
      lista,
      {},
    )
    expect(plan.map((x) => x.accion)).toEqual(['error', 'error', 'error', 'ajustar', 'error'])
    expect(plan[2].errores[0]).toMatch(/medias docenas/)
    expect(plan[3]).toMatchObject({ nuevo: 30, delta: 30 }) // 2,5 docenas = 30 prendas
    expect(plan[4].errores[0]).toMatch(/repetido/)
  })

  it('un stock viejo que no es media docena exacta vuelve sin cambio si no se toca', () => {
    const p = lista[0]
    const plan = planificarStock([{ fila: 2, codigo: p.codigo, docenas: '5,33' }], lista, { [p.id]: 64 })
    expect(plan[0].accion).toBe('sin_cambio')
  })

  it('una planilla vieja en unidades no se toma como docenas', async () => {
    const { default: ExcelJS } = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Stock')
    ws.addRow(['codigo', 'producto', 'color', 'unidades'])
    ws.addRow([lista[0].codigo, 'x', 'Negro', 64])
    await expect(leerExcelStock(await wb.xlsx.writeBuffer())).rejects.toThrow(/docenas/)
  })
})
