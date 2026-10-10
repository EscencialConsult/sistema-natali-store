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
      todos.map((p) => ({ codigo: p.codigo, nombre: p.nombre, categoria: 'LINO', precio: p.precio_docena_usd_cent / 100, color: p.colores[0]?.nombre ?? '' })),
    )
    const filas = await leerExcel(await blob.arrayBuffer())
    expect(filas).toHaveLength(CANTIDAD_PRODUCTOS)
    const plan = planificar(filas, mapa(todos))
    expect(plan.every((p) => p.accion === 'actualizar')).toBe(true)
    const r = await ejecutar(plan)
    expect(r).toMatchObject({ creados: 0, actualizados: CANTIDAD_PRODUCTOS, errores: [] })
    expect(await productos.listar({ soloActivos: false })).toHaveLength(CANTIDAD_PRODUCTOS)
  }, 120_000)

  it('la planilla de ejemplo se lee sin errores: sus 3 filas serían productos nuevos', async () => {
    const filas = await leerExcel(await (await crearPlantilla()).arrayBuffer())
    const plan = planificar(filas, new Map())
    expect(plan.map((p) => [p.accion, p.datos.codigo])).toEqual([['crear', 'MN-001'], ['crear', 'MN-002'], ['crear', 'MN-003']])
    expect(plan[1].datos.precio_docena_usd_cent).toBe(15050)
  })

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
        { codigo: 'ZA-1', nombre: 'Uno', categoria: '', precio: '12,50', color: 'Negro' },
        { codigo: 'ZA-1', nombre: 'Repetido', categoria: '', precio: '5', color: '' },
        { codigo: '', nombre: 'Sin código', categoria: '', precio: '5', color: '' },
        { codigo: 'ZA-2', nombre: '', categoria: '', precio: '5', color: '' },
        { codigo: 'ZA-3', nombre: 'Sin precio', categoria: '', precio: '', color: '' },
        { codigo: 'ZA-4', nombre: 'Precio raro', categoria: '', precio: 'abc', color: '' },
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
        { codigo: 'P-1', nombre: 'a', categoria: '', precio: '1.234,50', color: '' },
        { codigo: 'P-2', nombre: 'b', categoria: '', precio: '1,234.50', color: '' },
        { codigo: 'P-3', nombre: 'c', categoria: '', precio: 'US$ 99', color: '' },
      ]),
      new Map(),
    )
    expect([a, b, c].map((x) => x.datos.precio_docena_usd_cent)).toEqual([123450, 123450, 9900])
  })
})

describe('ejecutar', () => {
  it('crea con un color y categoría nueva; al actualizar cambia el color conservando su id; vacío lo deja igual', async () => {
    const plan = planificar(aFilas([{ codigo: 'IM-001', nombre: 'Importado', categoria: 'Categoría nueva', precio: '10', color: 'Negro' }]), new Map())
    const r = await ejecutar(plan)
    expect(r.creados).toBe(1)
    const creado = await productos.obtenerPorCodigo('IM-001')
    expect(creado.colores.map((c) => c.nombre)).toEqual(['Negro'])
    const idColor = creado.colores[0].id

    const plan2 = planificar(aFilas([{ codigo: 'IM-001', nombre: 'Importado v2', categoria: 'Categoría nueva', precio: '11', color: 'Azul' }]), mapa([creado]))
    expect(plan2[0].accion).toBe('actualizar')
    await ejecutar(plan2)
    const actualizado = await productos.obtenerPorCodigo('IM-001')
    expect(actualizado.nombre).toBe('Importado v2')
    expect(actualizado.colores).toEqual([expect.objectContaining({ id: idColor, nombre: 'Azul' })])

    await ejecutar(planificar(aFilas([{ codigo: 'IM-001', nombre: 'Importado v3', categoria: '', precio: '11', color: '' }]), mapa([actualizado])))
    expect((await productos.obtenerPorCodigo('IM-001')).colores.map((c) => c.nombre)).toEqual(['Azul'])
  })

  it('rechaza varios colores en una fila', () => {
    const [p] = planificar(aFilas([{ codigo: 'IM-002', nombre: 'X', categoria: '', precio: '1', color: 'Negro, Rojo' }]), new Map())
    expect(p.accion).toBe('error')
    expect(p.errores.join(' ')).toMatch(/solo color/)
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
