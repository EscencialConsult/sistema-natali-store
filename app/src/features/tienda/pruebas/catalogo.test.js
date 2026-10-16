import { describe, expect, it } from 'vitest'
import { contarPorCategoria, filtrarYOrdenar, normalizar, ORDENES, paginar, paginaDesdeTexto, paginasVisibles, POR_PAGINA, textoModelos, textoRango, totalDePaginas } from '../lib/catalogo.js'

const p = (codigo, nombre, extra = {}) => ({ id: `id-${codigo}`, codigo, nombre, categoria_id: null, categoria: null, nuevo: false, precio_docena_usd_cent: 1000, ...extra })
const LISTA = [
  p('F0010', 'Blusa Satín', { categoria_id: 'c1', categoria: 'BLUSAS', precio_docena_usd_cent: 9000 }),
  p('F0002', 'Pantalón sastre', { categoria_id: 'c2', categoria: 'PANTALONES', nuevo: true, precio_docena_usd_cent: 15000 }),
  p('F0100', 'Blusa rib', { categoria_id: 'c1', categoria: 'BLUSAS', nuevo: true, precio_docena_usd_cent: null }),
  p('F0003', 'Falda corta', { categoria_id: 'c3', categoria: 'FALDAS', precio_docena_usd_cent: 5000 }),
]
const codigos = (l) => l.map((x) => x.codigo)

describe('normalizar', () => {
  it('ignora tildes, mayúsculas y espacios de más', () => {
    expect(normalizar('  BLUSA   Satín ')).toBe('blusa satin')
    expect(normalizar(null)).toBe('')
  })
})

describe('contarPorCategoria', () => {
  it('cuenta por categoría, ordena por nombre y omite los modelos sin categoría', () => {
    const r = contarPorCategoria([...LISTA, p('X', 'Suelto')])
    expect(r.map((k) => [k.nombre, k.cantidad])).toEqual([['BLUSAS', 2], ['FALDAS', 1], ['PANTALONES', 1]])
    expect(contarPorCategoria(null)).toEqual([])
  })
})

describe('filtrarYOrdenar', () => {
  it('busca por código o nombre sin importar tildes', () => {
    expect(codigos(filtrarYOrdenar(LISTA, { texto: 'satin', orden: 'codigo' }))).toEqual(['F0010'])
    expect(codigos(filtrarYOrdenar(LISTA, { texto: 'pantalon', orden: 'codigo' }))).toEqual(['F0002'])
    expect(codigos(filtrarYOrdenar(LISTA, { texto: 'f01', orden: 'codigo' }))).toEqual(['F0100'])
    expect(filtrarYOrdenar(LISTA, { texto: 'zzz' })).toEqual([])
  })

  it('filtra por categoría y combina con la búsqueda', () => {
    expect(codigos(filtrarYOrdenar(LISTA, { categoriaId: 'c1', orden: 'codigo' }))).toEqual(['F0010', 'F0100'])
    expect(codigos(filtrarYOrdenar(LISTA, { categoriaId: 'c1', texto: 'rib' }))).toEqual(['F0100'])
  })

  it('novedades: primero lo nuevo, y dentro de cada grupo por código', () => {
    expect(codigos(filtrarYOrdenar(LISTA, { orden: 'novedades' }))).toEqual(['F0002', 'F0100', 'F0003', 'F0010'])
  })

  it('código y nombre', () => {
    expect(codigos(filtrarYOrdenar(LISTA, { orden: 'codigo' }))).toEqual(['F0002', 'F0003', 'F0010', 'F0100'])
    // Alfabético: "Blusa rib", "Blusa Satín", "Falda corta", "Pantalón sastre".
    expect(codigos(filtrarYOrdenar(LISTA, { orden: 'nombre' }))).toEqual(['F0100', 'F0010', 'F0003', 'F0002'])
  })

  it('precio: los modelos sin precio van siempre al final', () => {
    expect(codigos(filtrarYOrdenar(LISTA, { orden: 'precio_asc' }))).toEqual(['F0003', 'F0010', 'F0002', 'F0100'])
    expect(codigos(filtrarYOrdenar(LISTA, { orden: 'precio_desc' }))).toEqual(['F0002', 'F0010', 'F0003', 'F0100'])
  })

  it('no modifica la lista original y tolera null', () => {
    const copia = [...LISTA]
    filtrarYOrdenar(LISTA, { orden: 'precio_desc' })
    expect(LISTA).toEqual(copia)
    expect(filtrarYOrdenar(null)).toEqual([])
  })

  it('todas las opciones de orden conocidas funcionan', () => {
    for (const o of ORDENES) expect(filtrarYOrdenar(LISTA, { orden: o.valor })).toHaveLength(4)
  })
})

describe('textoModelos', () => {
  it('singular y plural', () => {
    expect(textoModelos(1)).toBe('1 modelo')
    expect(textoModelos(138)).toBe('138 modelos')
    expect(textoModelos(0)).toBe('0 modelos')
  })
})

describe('paginación', () => {
  const muchos = Array.from({ length: 140 }, (_, i) => ({ id: `m${i}`, codigo: `F${String(i).padStart(4, '0')}` }))

  it('24 por página: divisible por las grillas de 2, 3, 4 y 6 columnas', () => {
    expect(POR_PAGINA).toBe(24)
    for (const columnas of [2, 3, 4, 6]) expect(POR_PAGINA % columnas).toBe(0)
  })

  it('140 modelos son 6 páginas; la segunda muestra del 25 al 48', () => {
    expect(totalDePaginas(140)).toBe(6)
    const r = paginar(muchos, 2)
    expect(r.items).toHaveLength(24)
    expect(r.items[0].codigo).toBe('F0024')
    expect(textoRango(r)).toBe('Mostrando 25-48 de 140')
    const ultima = paginar(muchos, 6)
    expect(ultima.items).toHaveLength(20)
    expect(textoRango(ultima)).toBe('Mostrando 121-140 de 140')
  })

  it('una página inválida o pasada del final se corrige', () => {
    for (const malo of ['abc', '0', '-3', '2.5', '', null, undefined, '1e3']) expect(paginaDesdeTexto(malo), String(malo)).toBe(1)
    expect(paginaDesdeTexto('99', 6)).toBe(6)
    expect(paginar(muchos, 99).pagina).toBe(6)
    expect(paginar(muchos, 'x').pagina).toBe(1)
  })

  it('sin resultados: una página vacía y sin rango', () => {
    const r = paginar([], 3)
    expect(r).toMatchObject({ items: [], pagina: 1, totalPaginas: 1, total: 0, desde: 0, hasta: 0 })
    expect(textoRango(r)).toBe('Sin modelos')
    expect(paginar(null).items).toEqual([])
  })

  it('exactamente 24 es una sola página', () => {
    expect(paginar(muchos.slice(0, 24), 1).totalPaginas).toBe(1)
    expect(paginar(muchos.slice(0, 25), 1).totalPaginas).toBe(2)
  })

  it('el paginador abrevia con elipsis y no deja huecos de una sola página', () => {
    expect(paginasVisibles(1, 1)).toEqual([1])
    expect(paginasVisibles(1, 5)).toEqual([1, 2, null, 5])
    expect(paginasVisibles(3, 5)).toEqual([1, 2, 3, 4, 5])
    expect(paginasVisibles(1, 10)).toEqual([1, 2, null, 10])
    expect(paginasVisibles(5, 10)).toEqual([1, null, 4, 5, 6, null, 10])
    expect(paginasVisibles(10, 10)).toEqual([1, null, 9, 10])
    expect(paginasVisibles(4, 10)).toEqual([1, 2, 3, 4, 5, null, 10])
  })
})
