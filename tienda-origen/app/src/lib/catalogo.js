// Filtro y orden del catálogo público. Función pura: la usan el repositorio y las pantallas, que leen el catálogo una
// sola vez y derivan de esa base tanto los resultados como las categorías (así filtrar no hace desaparecer opciones).
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ORDENES = {
  novedad: (a, b) => Number(b.nuevo) - Number(a.nuevo) || (b.creado_en ?? '').localeCompare(a.creado_en ?? '') || a.codigo.localeCompare(b.codigo),
  precio_asc: (a, b) => a.precio_unidad_bs_cent - b.precio_unidad_bs_cent || a.codigo.localeCompare(b.codigo),
  precio_desc: (a, b) => b.precio_unidad_bs_cent - a.precio_unidad_bs_cent || a.codigo.localeCompare(b.codigo),
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
}

export const esPublico = (p) => p.activo && p.publicado_tienda && Number.isInteger(p.precio_unidad_bs_cent)

export function filtrarCatalogo(base, { categoria_id, texto = '', orden = 'novedad' } = {}) {
  let lista = base.filter(esPublico)
  if (categoria_id) lista = lista.filter((p) => p.categoria_id === categoria_id)
  const q = norm(texto.trim())
  if (q) lista = lista.filter((p) => norm(`${p.nombre} ${p.codigo}`).includes(q))
  return [...lista].sort(ORDENES[orden] ?? ORDENES.novedad)
}

// Categorías con al menos un modelo publicado, en el orden de la lista de categorías. Se calcula sobre la base completa.
export function categoriasConProductos(categorias, base) {
  const usadas = new Set(base.filter(esPublico).map((p) => p.categoria_id))
  return categorias.filter((c) => usadas.has(c.id))
}
