// Repositorio de productos.
//   listar({ categoria_id, texto, soloActivos }) · obtener(id) · obtenerPorSlug(slug) · buscarPorCodigo(texto, limite)
//   listarTienda({ categoria_id, texto, orden }) → solo publicados con precio minorista (sitio y kiosco)
//   crear(datos) · actualizar(id, datos) · eliminar(id) · reactivar(id)  (baja lógica: queda inactivo)
// Cada producto sale con `fotos` (ordenadas) y `colores`.
import { z } from 'zod'
import { db } from '../../db.js'
import { nuevoId } from '../../../lib/id.js'
import { encolar } from '../../sync/cola.js'
import { partirCodigo, puntajeCodigo } from '../../../lib/codigo.js'
import { slugDe } from '../../../lib/slug.js'
import { esPublico, filtrarCatalogo } from '../../../lib/catalogo.js'

export const esquemaProducto = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  categoria_id: z.string().min(1, 'Elegí una categoría.'),
  descripcion: z.string().trim().default(''),
  precio_docena_usd_cent: z.number().int('El precio debe estar en centavos enteros.').min(0, 'El precio no puede ser negativo.'),
  activo: z.boolean().default(true),
  nuevo: z.boolean().default(false),
  // Campos de la tienda (decisión D4: conviven con los del sistema de nota en el mismo producto).
  precio_unidad_bs_cent: z.number().int('El precio debe estar en centavos enteros.').min(0).nullable().default(null),
  publicado_tienda: z.boolean().default(false),
  destacado: z.boolean().default(false),
  slug: z.string().trim().optional(),
  // Una foto es una ruta (seed/servidor) o un blob subido desde el dispositivo.
  fotos: z.array(z.object({ ruta: z.string().default(''), blob: z.any().optional() })).default([]),
  colores: z.array(z.object({ id: z.string().optional(), nombre: z.string().trim().min(1, 'Cada color necesita nombre.'), hex: z.string().default('#cccccc') })).default([]),
})

const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Relaciones agrupadas por producto con un Map: una pasada por tabla en vez de filtrar por cada producto.
const agrupar = (filas) => {
  const m = new Map()
  for (const f of filas) {
    const lista = m.get(f.producto_id)
    if (lista) lista.push(f)
    else m.set(f.producto_id, [f])
  }
  return m
}

async function armar(prods) {
  const ids = prods.map((p) => p.id)
  const [fotos, colores] = await Promise.all([
    db.producto_fotos.where('producto_id').anyOf(ids).toArray(),
    db.producto_colores.where('producto_id').anyOf(ids).toArray(),
  ])
  const fotosDe = agrupar(fotos)
  const coloresDe = agrupar(colores)
  return prods.map((p) => ({
    ...p,
    fotos: (fotosDe.get(p.id) ?? []).sort((a, b) => a.orden - b.orden),
    colores: (coloresDe.get(p.id) ?? []).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
  }))
}

async function validarCodigoUnico(codigo, idPropio) {
  const otro = await db.productos.where('codigo').equals(codigo).first()
  if (otro && otro.id !== idPropio) throw new Error(`Ya existe un producto con el código ${codigo}.`)
}

export const productos = {
  async listar({ categoria_id, texto = '', soloActivos = true } = {}) {
    let lista = await db.productos.toArray()
    if (soloActivos) lista = lista.filter((p) => p.activo)
    if (categoria_id) lista = lista.filter((p) => p.categoria_id === categoria_id)
    const q = norm(texto.trim())
    if (q) lista = lista.filter((p) => norm(`${p.nombre} ${p.codigo}`).includes(q))
    lista.sort((a, b) => a.codigo.localeCompare(b.codigo))
    return armar(lista)
  },

  // Lo que ve el público: activo, publicado y con precio minorista. orden: novedad | precio_asc | precio_desc | nombre.
  async listarTienda(filtros = {}) {
    const lista = filtrarCatalogo((await db.productos.toArray()).filter(esPublico), filtros)
    return armar(lista)
  },

  async obtener(id) {
    const p = await db.productos.get(id)
    return p ? (await armar([p]))[0] : undefined
  },

  async obtenerPorSlug(slug) {
    const p = await db.productos.where('slug').equals(slug).first()
    return p ? (await armar([p]))[0] : undefined
  },

  async obtenerPorCodigo(codigo) {
    const p = await db.productos.where('codigo').equals(codigo).first()
    return p ? (await armar([p]))[0] : undefined
  },

  // "mn5", "MN-005", "5" → MN-005 primero. Si no parece un código ("blazer"), busca por nombre.
  async buscarPorCodigo(texto, limite = 12) {
    const q = String(texto ?? '').trim()
    if (!q) return []
    const activos = (await db.productos.toArray()).filter((p) => p.activo)
    const { letras, digitos, resto } = partirCodigo(q)
    const pareceCodigo = digitos !== '' || (letras !== '' && resto === '' && letras.length <= 3)
    let encontrados = []
    if (pareceCodigo) {
      encontrados = activos
        .map((p) => ({ p, s: puntajeCodigo(q, p.codigo) }))
        .filter((x) => x.s !== null)
        .sort((a, b) => a.s - b.s || a.p.codigo.localeCompare(b.p.codigo))
        .map((x) => x.p)
    }
    if (encontrados.length === 0) {
      const n = norm(q)
      encontrados = activos.filter((p) => norm(p.nombre).includes(n)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }
    return armar(encontrados.slice(0, limite))
  },

  async crear(datos) {
    const d = esquemaProducto.parse(datos)
    d.slug ||= slugDe(`${d.nombre} ${d.codigo}`)
    await validarCodigoUnico(d.codigo)
    const id = nuevoId()
    await db.transaction('rw', db.productos, db.producto_fotos, db.producto_colores, db.cola_sync, async () => {
      const { fotos, colores, ...base } = d
      await db.productos.add({ ...base, id, creado_en: new Date().toISOString() })
      await db.producto_fotos.bulkAdd(fotos.map((f, orden) => ({ id: nuevoId(), producto_id: id, orden, ruta: f.ruta, blob: f.blob })))
      await db.producto_colores.bulkAdd(colores.map((c, orden) => ({ id: c.id ?? nuevoId(), producto_id: id, nombre: c.nombre, hex: c.hex, orden })))
      await encolar({ operacion: 'guardar', entidad: 'producto', entidad_id: id })
    })
    return this.obtener(id)
  },

  async actualizar(id, datos) {
    const d = esquemaProducto.parse(datos)
    d.slug ||= slugDe(`${d.nombre} ${d.codigo}`)
    await validarCodigoUnico(d.codigo, id)
    await db.transaction('rw', db.productos, db.producto_fotos, db.producto_colores, db.cola_sync, async () => {
      const { fotos, colores, ...base } = d
      await db.productos.update(id, base)
      await db.producto_fotos.where('producto_id').equals(id).delete()
      await db.producto_fotos.bulkAdd(fotos.map((f, orden) => ({ id: nuevoId(), producto_id: id, orden, ruta: f.ruta, blob: f.blob })))
      // Los colores existentes conservan su id (el stock y las ventas apuntan a él).
      const previos = await db.producto_colores.where('producto_id').equals(id).toArray()
      const quedan = new Set(colores.map((c) => c.id).filter(Boolean))
      await db.producto_colores.bulkDelete(previos.filter((c) => !quedan.has(c.id)).map((c) => c.id))
      await db.producto_colores.bulkPut(colores.map((c, orden) => ({ id: c.id ?? nuevoId(), producto_id: id, nombre: c.nombre, hex: c.hex, orden })))
      await encolar({ operacion: 'guardar', entidad: 'producto', entidad_id: id })
    })
    return this.obtener(id)
  },

  async eliminar(id) {
    await db.transaction('rw', db.productos, db.cola_sync, async () => {
      await db.productos.update(id, { activo: false })
      await encolar({ operacion: 'guardar', entidad: 'producto', entidad_id: id })
    })
  },

  async reactivar(id) {
    await db.transaction('rw', db.productos, db.cola_sync, async () => {
      await db.productos.update(id, { activo: true })
      await encolar({ operacion: 'guardar', entidad: 'producto', entidad_id: id })
    })
  },
}
