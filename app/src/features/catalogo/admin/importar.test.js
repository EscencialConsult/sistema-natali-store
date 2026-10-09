import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { CANTIDAD_PRODUCTOS, cargarFixture } from '../../../test/fixture.js'
import { productos } from '../../../data/repos/index.js'
import { agruparFotos, crearPlantilla, ejecutar, leerExcel, planificar } from './importar.js'

const mapa = (lista) => new Map(lista.map((p) => [p.codigo, p]))
const aFilas = (lista) => lista.map((f, i) => ({ fila: i + 2, ...f }))

beforeAll(async () => {
  await cargarFixture()
})

describe('plantilla y lectura de Excel', () => {
  it('exporta todos los productos, los lee de vuelta y todos quedan como "actualizar", sin duplicar', async () => {
    const todos = await productos.listar()
    const blob = await crearPlantilla(
      todos.map((p) => ({ codigo: p.codigo, nombre: p.nombre, categoria: 'LINO', precio: p.precio_docena_usd_cent / 100, colores: p.colores.map((c) => c.nombre).join(', ') })),
    )
    const filas = await leerExcel(await blob.arrayBuffer())
    expect(filas).toHaveLength(CANTIDAD_PRODUCTOS)
    const plan = planificar(filas, mapa(todos))
    expect(plan.every((p) => p.accion === 'actualizar')).toBe(true)
    const r = await ejecutar(plan)
    expect(r).toMatchObject({ creados: 0, actualizados: CANTIDAD_PRODUCTOS, errores: [] })
    expect(await productos.listar({ soloActivos: false })).toHaveLength(CANTIDAD_PRODUCTOS)
  }, 120_000)

  it('pide la plantilla si faltan columnas', async () => {
    const { default: ExcelJS } = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('x').addRow(['foo', 'bar'])
    await expect(leerExcel(await wb.xlsx.writeBuffer())).rejects.toThrow(/Faltan columnas/)
  })
})

describe('planificar', () => {
  it('detecta errores por fila y duplicados dentro del archivo', () => {
    const plan = planificar(
      aFilas([
        { codigo: 'ZA-1', nombre: 'Uno', categoria: '', precio: '12,50', colores: 'Negro' },
        { codigo: 'ZA-1', nombre: 'Repetido', categoria: '', precio: '5', colores: '' },
        { codigo: '', nombre: 'Sin código', categoria: '', precio: '5', colores: '' },
        { codigo: 'ZA-2', nombre: '', categoria: '', precio: '5', colores: '' },
        { codigo: 'ZA-3', nombre: 'Sin precio', categoria: '', precio: '', colores: '' },
        { codigo: 'ZA-4', nombre: 'Precio raro', categoria: '', precio: 'abc', colores: '' },
      ]),
      new Map(),
    )
    expect(plan.map((p) => p.accion)).toEqual(['crear', 'error', 'error', 'error', 'error', 'error'])
    expect(plan[0].datos.precio_docena_usd_cent).toBe(1250)
    expect(plan[1].errores[0]).toMatch(/repetido/i)
  })

  it('interpreta precios con coma, punto y miles', () => {
    const [a, b, c] = planificar(
      aFilas([
        { codigo: 'P-1', nombre: 'a', categoria: '', precio: '1.234,50', colores: '' },
        { codigo: 'P-2', nombre: 'b', categoria: '', precio: '1,234.50', colores: '' },
        { codigo: 'P-3', nombre: 'c', categoria: '', precio: 'US$ 99', colores: '' },
      ]),
      new Map(),
    )
    expect([a, b, c].map((x) => x.datos.precio_docena_usd_cent)).toEqual([123450, 123450, 9900])
  })
})

describe('ejecutar', () => {
  it('crea productos nuevos con colores y categoría nueva; luego actualiza conservando colores y fotos', async () => {
    const plan = planificar(aFilas([{ codigo: 'IM-001', nombre: 'Importado', categoria: 'Categoría nueva', precio: '10', colores: 'Negro, Rojo, negro' }]), new Map())
    const r = await ejecutar(plan)
    expect(r.creados).toBe(1)
    const creado = await productos.obtenerPorCodigo('IM-001')
    expect(creado.colores.map((c) => c.nombre)).toEqual(['Negro', 'Rojo'])
    const idNegro = creado.colores.find((c) => c.nombre === 'Negro').id

    const plan2 = planificar(aFilas([{ codigo: 'IM-001', nombre: 'Importado v2', categoria: 'Categoría nueva', precio: '11', colores: 'Rojo, Azul' }]), mapa([creado]))
    expect(plan2[0].accion).toBe('actualizar')
    await ejecutar(plan2)
    const actualizado = await productos.obtenerPorCodigo('IM-001')
    expect(actualizado.nombre).toBe('Importado v2')
    expect(actualizado.colores.map((c) => c.nombre).sort()).toEqual(['Azul', 'Negro', 'Rojo'])
    expect(actualizado.colores.find((c) => c.nombre === 'Negro').id).toBe(idNegro)
  })
})

describe('agruparFotos', () => {
  it('asocia por código del nombre de archivo y ordena por sufijo', async () => {
    const lista = await productos.listar()
    const f = (name) => ({ name })
    const { grupos, sinMatch } = agruparFotos([f('MN-005_2.jpg'), f('MN-005_1.jpg'), f('mn6.png'), f('cualquiera.jpg')], lista)
    expect(sinMatch).toEqual(['cualquiera.jpg'])
    const g5 = grupos.find((g) => g.producto.codigo === 'MN-005')
    expect(g5.archivos.map((x) => x.archivo.name)).toEqual(['MN-005_1.jpg', 'MN-005_2.jpg'])
    expect(grupos.some((g) => g.producto.codigo === 'MN-006')).toBe(true)
  })
})
