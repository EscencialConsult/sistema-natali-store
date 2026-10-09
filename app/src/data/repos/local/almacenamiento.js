// Uso de almacenamiento y limpieza MANUAL (solo superadmin, nada se borra solo).
//   medir() · previsualizar({ antesDe }) · borrarVentas({ antesDe }, { por }) · resumirMovimientos({ antesDe }, { por })
//   borrarFotosDeBaja({ por }) · borrarProductosDeBaja({ por })
// Regla de oro: el stock NUNCA cambia por una limpieza. El stock es la suma de movimientos, así que los movimientos
// que se quitan se reemplazan por un "saldo" por color con la misma suma.
import { db } from '../../db.js'
import { fechaDia } from '../../../lib/fechas.js'
import { nuevoId } from '../../../lib/id.js'
import { puede } from '../../../lib/permisos.js'

const TABLAS_DATOS = ['perfiles', 'categorias', 'productos', 'producto_colores', 'ventas', 'venta_items', 'movimientos_stock', 'config', 'cola_sync']

const pesoJson = (filas) => new Blob([JSON.stringify(filas)]).size
const sinBlob = ({ blob, ...resto }) => resto // eslint-disable-line no-unused-vars
const pesoFotos = (fotos) => fotos.reduce((t, f) => t + (f.blob?.size ?? 0), 0) + pesoJson(fotos.map(sinBlob))

async function exigirSuperadmin(por) {
  const actor = por ? await db.perfiles.get(por) : null
  if (!actor?.activo || !puede(actor.rol, 'datos.borrar')) throw new Error('Solo el superadmin puede borrar datos.')
}

// Agrupa movimientos por color y devuelve los saldos (sin los que suman 0).
function saldosDe(movs, antesDe) {
  const m = new Map()
  for (const x of movs) {
    const s = m.get(x.color_id) ?? { producto_id: x.producto_id, color_id: x.color_id, delta: 0 }
    s.delta += x.delta
    m.set(x.color_id, s)
  }
  const fecha = new Date(new Date(antesDe).getTime() - 1).toISOString()
  return [...m.values()]
    .filter((s) => s.delta !== 0)
    .map((s) => ({ id: nuevoId(), ...s, tipo: 'saldo', motivo: `Saldo al ${fechaDia(fecha)} (historial resumido)`, usuario_id: null, venta_id: null, creado_en: fecha }))
}

const ventasAntesDe = (antesDe) => db.ventas.filter((v) => v.creada_en < antesDe).toArray()

async function productosDeBaja() {
  const inactivos = await db.productos.filter((p) => !p.activo).toArray()
  const vendidos = new Set((await db.venta_items.toArray()).map((i) => i.producto_id))
  return { inactivos, borrables: inactivos.filter((p) => !vendidos.has(p.id)) }
}

export const almacenamiento = {
  async medir() {
    let datos_bytes = 0
    for (const t of TABLAS_DATOS) datos_bytes += pesoJson(await db.table(t).toArray())
    const fotos = await db.producto_fotos.toArray()
    return { datos_bytes: datos_bytes + pesoJson(fotos.map(sinBlob)), fotos_bytes: fotos.reduce((t, f) => t + (f.blob?.size ?? 0), 0) }
  },

  // Qué se liberaría con cada acción (cantidades y peso aproximado).
  async previsualizar({ antesDe } = {}) {
    const out = {}
    if (antesDe) {
      const vs = await ventasAntesDe(antesDe)
      const ids = vs.map((v) => v.id)
      const items = await db.venta_items.where('venta_id').anyOf(ids).toArray()
      const movsVenta = await db.movimientos_stock.where('venta_id').anyOf(ids).toArray()
      out.ventas = { cantidad: vs.length, bytes: pesoJson(vs) + pesoJson(items) + pesoJson(movsVenta) }
      const movs = await db.movimientos_stock.filter((m) => m.creado_en < antesDe).toArray()
      out.movimientos = { cantidad: movs.length, bytes: Math.max(0, pesoJson(movs) - pesoJson(saldosDe(movs, antesDe))) }
    }
    const { inactivos, borrables } = await productosDeBaja()
    const idsInactivos = inactivos.map((p) => p.id)
    const fotosBaja = await db.producto_fotos.where('producto_id').anyOf(idsInactivos).toArray()
    out.fotos = { cantidad: fotosBaja.length, bytes: pesoFotos(fotosBaja) }
    const idsBorrables = borrables.map((p) => p.id)
    const [colores, fotosB, movsB] = await Promise.all([
      db.producto_colores.where('producto_id').anyOf(idsBorrables).toArray(),
      db.producto_fotos.where('producto_id').anyOf(idsBorrables).toArray(),
      db.movimientos_stock.where('producto_id').anyOf(idsBorrables).toArray(),
    ])
    out.productos = { cantidad: borrables.length, conVentas: inactivos.length - borrables.length, bytes: pesoJson(borrables) + pesoJson(colores) + pesoFotos(fotosB) + pesoJson(movsB) }
    return out
  },

  // Borra ventas (con sus ítems) anteriores a la fecha. Sus movimientos se resumen en saldos: el stock no cambia.
  async borrarVentas({ antesDe }, { por } = {}) {
    await exigirSuperadmin(por)
    if (!antesDe) throw new Error('Elegí la fecha de corte.')
    return db.transaction('rw', db.ventas, db.venta_items, db.movimientos_stock, db.cola_sync, async () => {
      const ids = (await ventasAntesDe(antesDe)).map((v) => v.id)
      const movs = await db.movimientos_stock.where('venta_id').anyOf(ids).toArray()
      await db.movimientos_stock.bulkDelete(movs.map((m) => m.id))
      await db.movimientos_stock.bulkAdd(saldosDe(movs, antesDe))
      await db.venta_items.where('venta_id').anyOf(ids).delete()
      await db.cola_sync.where('entidad_id').anyOf(ids).delete()
      await db.ventas.bulkDelete(ids)
      return ids.length
    })
  },

  // Resume el historial de movimientos anterior a la fecha en un saldo por color. El stock no cambia.
  async resumirMovimientos({ antesDe }, { por } = {}) {
    await exigirSuperadmin(por)
    if (!antesDe) throw new Error('Elegí la fecha de corte.')
    return db.transaction('rw', db.movimientos_stock, async () => {
      const movs = await db.movimientos_stock.filter((m) => m.creado_en < antesDe).toArray()
      await db.movimientos_stock.bulkDelete(movs.map((m) => m.id))
      await db.movimientos_stock.bulkAdd(saldosDe(movs, antesDe))
      return movs.length
    })
  },

  async borrarFotosDeBaja({ por } = {}) {
    await exigirSuperadmin(por)
    return db.transaction('rw', db.productos, db.producto_fotos, async () => {
      const ids = (await db.productos.filter((p) => !p.activo).toArray()).map((p) => p.id)
      const fotos = await db.producto_fotos.where('producto_id').anyOf(ids).toArray()
      await db.producto_fotos.bulkDelete(fotos.map((f) => f.id))
      return fotos.length
    })
  },

  // Solo productos dados de baja que NUNCA se vendieron (las notas viejas los siguen nombrando).
  async borrarProductosDeBaja({ por } = {}) {
    await exigirSuperadmin(por)
    return db.transaction('rw', db.productos, db.producto_colores, db.producto_fotos, db.movimientos_stock, db.venta_items, async () => {
      const ids = (await productosDeBaja()).borrables.map((p) => p.id)
      await db.producto_colores.where('producto_id').anyOf(ids).delete()
      await db.producto_fotos.where('producto_id').anyOf(ids).delete()
      await db.movimientos_stock.where('producto_id').anyOf(ids).delete()
      await db.productos.bulkDelete(ids)
      return ids.length
    })
  },
}
