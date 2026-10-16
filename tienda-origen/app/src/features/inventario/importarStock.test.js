import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { cargarSeedSiVacio } from '../../data/seed/cargar.js'
import { productos, stock } from '../../data/repos/index.js'
import { crearPlantillaStock, ejecutarStock, leerExcelStock, planificarStock } from './importarStock.js'

let lista
beforeAll(async () => {
  await cargarSeedSiVacio()
  lista = await productos.listar()
})

describe('carga de stock por Excel', () => {
  it('la planilla con el stock actual vuelve sin cambios', async () => {
    const actual = await stock.resumen()
    const blob = await crearPlantillaStock(lista.slice(0, 5), actual)
    const filas = await leerExcelStock(await blob.arrayBuffer())
    expect(filas.length).toBeGreaterThan(10)
    const plan = planificarStock(filas, lista, actual)
    expect(plan.every((p) => p.accion === 'sin_cambio')).toBe(true)
  })

  it('un conteo distinto genera un ajuste por la diferencia, con historial', async () => {
    const p = lista[10]
    const c = p.colores[0]
    const antes = (await stock.stockActual(p.id, c.id))
    const plan = planificarStock([{ fila: 2, codigo: p.codigo.toLowerCase(), color: c.nombre.toUpperCase(), unidades: String(antes + 36) }], lista, { [c.id]: antes })
    expect(plan[0]).toMatchObject({ accion: 'ajustar', delta: 36, actual: antes })
    expect((await ejecutarStock(plan, 'p-maria')).ajustados).toBe(1)
    expect(await stock.stockActual(p.id, c.id)).toBe(antes + 36)
    const movs = await stock.movimientos(p.id)
    expect(movs.some((m) => m.tipo === 'ajuste' && m.delta === 36 && m.usuario_id === 'p-maria')).toBe(true)
  })

  it('marca errores por fila sin frenar las demás', () => {
    const p = lista[0]
    const c = p.colores[0]
    const plan = planificarStock(
      [
        { fila: 2, codigo: 'XX-999', color: 'Rojo', unidades: '5' },
        { fila: 3, codigo: p.codigo, color: 'ColorInexistente', unidades: '5' },
        { fila: 4, codigo: p.codigo, color: c.nombre, unidades: '-3' },
        { fila: 5, codigo: p.codigo, color: c.nombre, unidades: '12,5' },
        { fila: 6, codigo: p.codigo, color: c.nombre, unidades: '24' },
        { fila: 7, codigo: p.codigo, color: c.nombre, unidades: '30' },
      ],
      lista,
      {},
    )
    expect(plan.map((x) => x.accion)).toEqual(['error', 'error', 'error', 'error', 'ajustar', 'error'])
    expect(plan[5].errores[0]).toMatch(/repetidos/)
  })
})
