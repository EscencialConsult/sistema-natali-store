// Filtros, conteos y orden del catálogo, del lado del cliente. Con unos cientos de modelos es más simple y rápido
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
