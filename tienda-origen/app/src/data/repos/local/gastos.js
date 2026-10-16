// Repositorio de gastos (implementación LOCAL). Dinero en centavos; la fecha es un día "AAAA-MM-DD" en Bolivia.
//   listar({ desde, hasta, categoria_id }) · obtener(id) · crear(datos) · actualizar(id, datos) · eliminar(id)
//   categorias() · crearCategoria(nombre) · totalPorCategoria({ desde, hasta })
import { z } from 'zod'
import { db } from '../../db.js'
import { idDeterministico, nuevoId } from '../../../lib/id.js'
import { encolar } from '../../sync/cola.js'

export const esquemaGasto = z.object({
  categoria_id: z.string().min(1, 'Elegí una categoría.'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha no es válida.'),
  monto_cent: z.number().int('El monto debe estar en centavos enteros.').positive('El monto debe ser mayor a 0.'),
  descripcion: z.string().trim().max(200).default(''),
  comprobante: z.object({ ruta: z.string().default(''), blob: z.any().optional() }).nullable().default(null),
  usuario_id: z.string().nullable().default(null),
})

export const gastos = {
  async listar({ desde, hasta, categoria_id } = {}) {
    let lista = await db.gastos.filter((g) => !g.eliminado).toArray()
    if (desde) lista = lista.filter((g) => g.fecha >= desde)
    if (hasta) lista = lista.filter((g) => g.fecha <= hasta)
    if (categoria_id) lista = lista.filter((g) => g.categoria_id === categoria_id)
    return lista.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en.localeCompare(a.creado_en))
  },
  obtener: (id) => db.gastos.get(id),
  async crear(datos) {
    const d = esquemaGasto.parse(datos)
    const fila = { ...d, id: nuevoId(), eliminado: false, creado_en: new Date().toISOString() }
    await db.transaction('rw', db.gastos, db.cola_sync, async () => {
      await db.gastos.add(fila)
      await encolar({ operacion: 'guardar', entidad: 'gasto', entidad_id: fila.id })
    })
    return fila
  },
  async actualizar(id, datos) {
    const d = esquemaGasto.parse(datos)
    await db.transaction('rw', db.gastos, db.cola_sync, async () => {
      await db.gastos.update(id, d)
      await encolar({ operacion: 'guardar', entidad: 'gasto', entidad_id: id })
    })
    return db.gastos.get(id)
  },
  // Baja lógica: el gasto deja de contar pero queda el registro.
  async eliminar(id) {
    await db.transaction('rw', db.gastos, db.cola_sync, async () => {
      await db.gastos.update(id, { eliminado: true })
      await encolar({ operacion: 'guardar', entidad: 'gasto', entidad_id: id })
    })
  },
  categorias: () => db.gasto_categorias.orderBy('orden').toArray(),
  async crearCategoria(nombre) {
    const limpio = String(nombre ?? '').trim()
    if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')
    const existente = await db.gasto_categorias.where('nombre').equals(limpio).first()
    if (existente) return existente
    const cat = { id: idDeterministico(`gasto_categoria:${limpio.toLowerCase()}`), nombre: limpio, orden: (await db.gasto_categorias.count()) + 1 }
    await db.transaction('rw', db.gasto_categorias, db.cola_sync, async () => {
      await db.gasto_categorias.add(cat)
      await encolar({ operacion: 'guardar', entidad: 'gasto_categoria', entidad_id: cat.id })
    })
    return cat
  },
  async totalPorCategoria(filtros) {
    const lista = await this.listar(filtros)
    const out = {}
    for (const g of lista) out[g.categoria_id] = (out[g.categoria_id] ?? 0) + g.monto_cent
    return out
  },
}
