// Filtros, conteos, orden y paginación del catálogo, del lado del cliente. Con unos cientos de modelos es más simple y rápido
// que paginar en el servidor, y permite mostrar el total y los conteos por categoría.

export const ORDENES = [
  { valor: 'novedades', etiqueta: 'Novedades' },
  { valor: 'codigo', etiqueta: 'Código' },
  { valor: 'nombre', etiqueta: 'Nombre (A a Z)' },
  { valor: 'precio_asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio_desc', etiqueta: 'Precio: mayor a menor' },
]

// "Blusa Satín" y "blusa satin" son lo mismo para quien busca.
export const normalizar = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export function contarPorCategoria(items) {
  const mapa = new Map()
  for (const p of items ?? []) {
    if (!p.categoria_id) continue
    const actual = mapa.get(p.categoria_id)
    if (actual) actual.cantidad += 1
    else mapa.set(p.categoria_id, { id: p.categoria_id, nombre: p.categoria ?? 'Sin nombre', cantidad: 1 })
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

const precio = (p) => (Number.isInteger(p.precio_docena_usd_cent) ? p.precio_docena_usd_cent : null)
// Los precios ocultos van siempre al final, sea cual sea la dirección.
const porPrecio = (dir) => (a, b) => {
  const pa = precio(a)
  const pb = precio(b)
  if (pa === null && pb === null) return 0
  if (pa === null) return 1
  if (pb === null) return -1
  return dir * (pa - pb)
}
const porCodigo = (a, b) => String(a.codigo).localeCompare(String(b.codigo), 'es', { numeric: true })

export function filtrarYOrdenar(items, { texto = '', categoriaId = '', orden = 'novedades' } = {}) {
  const q = normalizar(texto)
  let lista = (items ?? []).filter((p) => {
    if (categoriaId && p.categoria_id !== categoriaId) return false
    if (!q) return true
    return normalizar(p.codigo).includes(q) || normalizar(p.nombre).includes(q)
  })
  lista = [...lista]
  switch (orden) {
    case 'codigo':
      return lista.sort(porCodigo)
    case 'nombre':
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || porCodigo(a, b))
    case 'precio_asc':
      return lista.sort(porPrecio(1))
    case 'precio_desc':
      return lista.sort(porPrecio(-1))
    default:
      // Novedades: primero lo marcado como nuevo, y dentro de cada grupo el orden por código.
      return lista.sort((a, b) => Number(Boolean(b.nuevo)) - Number(Boolean(a.nuevo)) || porCodigo(a, b))
  }
}

export const textoModelos = (n) => `${n} ${n === 1 ? 'modelo' : 'modelos'}`

// Paginación. 24 por página: es divisible por 2, 3, 4 y 6, así que la última fila de cada página
// queda completa en la grilla de celular (2), tablet (3), escritorio (4) y pantallas anchas (6).
export const POR_PAGINA = 24

export const totalDePaginas = (total, porPagina = POR_PAGINA) => Math.max(1, Math.ceil((Number(total) || 0) / porPagina))

/** Lee ?pagina=: lo que no sea un entero positivo es la página 1, y pasarse del final lleva a la última. */
export function paginaDesdeTexto(valor, totalPaginas = Infinity) {
  const n = /^\d{1,6}$/.test(String(valor ?? '').trim()) ? Number(valor) : 1
  return Math.min(Math.max(1, n), Math.max(1, totalPaginas))
}

/** @returns {{ items: any[], pagina: number, totalPaginas: number, total: number, desde: number, hasta: number }} desde/hasta son posiciones 1-based (0 y 0 si no hay nada). */
export function paginar(lista, pagina = 1, porPagina = POR_PAGINA) {
  const todo = lista ?? []
  const totalPaginas = totalDePaginas(todo.length, porPagina)
  const actual = paginaDesdeTexto(pagina, totalPaginas)
  const inicio = (actual - 1) * porPagina
  const items = todo.slice(inicio, inicio + porPagina)
  return {
    items,
    pagina: actual,
    totalPaginas,
    total: todo.length,
    desde: items.length ? inicio + 1 : 0,
    hasta: inicio + items.length,
  }
}

/**
 * Números para el paginador: siempre la primera, la última y las vecinas de la actual; los huecos de
 * dos o más páginas son `null` (se dibujan como "…") y un hueco de una sola página muestra esa página.
 */
export function paginasVisibles(actual, total, vecinas = 1) {
  if (total <= 1) return [1]
  const fijas = new Set([1, total])
  for (let i = actual - vecinas; i <= actual + vecinas; i += 1) if (i >= 1 && i <= total) fijas.add(i)
  const orden = [...fijas].sort((a, b) => a - b)
  const salida = []
  for (const [i, n] of orden.entries()) {
    const previa = orden[i - 1]
    if (previa !== undefined && n - previa === 2) salida.push(previa + 1)
    else if (previa !== undefined && n - previa > 2) salida.push(null)
    salida.push(n)
  }
  return salida
}

export const textoRango = ({ desde, hasta, total }) => (total === 0 ? 'Sin modelos' : `Mostrando ${desde}-${hasta} de ${total}`)
