// Repositorio de productos.
//   listar({ categoria_id, texto, soloActivos }) · obtener(id) · buscarPorCodigo(texto, limite)
//   crear(datos) · actualizar(id, datos) · eliminar(id) · reactivar(id)  (baja lógica: queda inactivo)
// Cada producto sale con `fotos` (ordenadas) y `colores`.
import { z } from 'zod'
import { db } from '../../db.js'
import { nuevoId } from '../../../lib/id.js'
import { encolar } from '../../sync/cola.js'
import { partirCodigo, puntajeCodigo } from '../../../lib/codigo.js'

export const esquemaProducto = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  categoria_id: z.string().min(1, 'Elegí una categoría.'),
  descripcion: z.string().trim().default(''),
  precio_docena_usd_cent: z.number().int('El precio debe estar en centavos enteros.').min(0, 'El precio no puede ser negativo.'),
  activo: z.boolean().default(true),
  nuevo: z.boolean().default(false),
  // Una foto es una ruta (dirección en Supabase Storage) o un blob recién elegido en el dispositivo (se sube al sincronizar).
  fotos: z.array(z.object({ ruta: z.string().default(''), blob: z.any().optional() })).default([]),
  colores: z.array(z.object({ id: z.string().optional(), nombre: z.string().trim().min(1, 'Cada color necesita nombre.'), hex: z.string().default('#cccccc') })).default([]),
})

const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

async function armar(prods) {
  const ids = prods.map((p) => p.id)
  const [fotos, colores] = await Promise.all([
    db.producto_fotos.where('producto_id').anyOf(ids).toArray(),
    db.producto_colores.where('producto_id').anyOf(ids).toArray(),
  ])
  return prods.map((p) => ({
    ...p,
    fotos: fotos.filter((f) => f.producto_id === p.id).sort((a, b) => a.orden - b.orden),
    colores: colores.filter((c) => c.producto_id === p.id).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
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

  async obtener(id) {
    const p = await db.productos.get(id)
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

  // Acción rápida del listado: poner o quitar la etiqueta "Nuevo" sin abrir el formulario.
  async marcarNuevo(id, nuevo) {
    await db.transaction('rw', db.productos, db.cola_sync, async () => {
      await db.productos.update(id, { nuevo: !!nuevo })
      await encolar({ operacion: 'guardar', entidad: 'producto', entidad_id: id })
    })
  },
}
