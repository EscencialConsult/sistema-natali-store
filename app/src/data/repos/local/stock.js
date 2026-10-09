// Repositorio de stock. El stock NUNCA se guarda como número: se calcula sumando movimientos
// (así dos dispositivos que venden lo mismo se suman bien al sincronizar).
//   registrarMovimiento(m) · stockPorColor(producto_id) · stockActual(producto_id, color_id)
//   movimientos(producto_id) · resumen()
import { db } from '../../db.js'
import { nuevoId } from '../../../lib/id.js'
import { encolar } from '../../sync/cola.js'

const TIPOS = ['entrada', 'salida', 'venta', 'anulacion', 'ajuste']

// Se puede llamar dentro de una transacción ya abierta (la venta lo hace).
export async function insertarMovimiento({ producto_id, color_id, tipo, delta, motivo = '', usuario_id = null, venta_id = null }) {
  if (!TIPOS.includes(tipo)) throw new Error(`Tipo de movimiento inválido: ${tipo}`)
  if (!Number.isInteger(delta) || delta === 0) throw new Error('La cantidad del movimiento debe ser un entero distinto de 0.')
  const fila = { id: nuevoId(), producto_id, color_id, tipo, delta, motivo, usuario_id, venta_id, creado_en: new Date().toISOString() }
  await db.movimientos_stock.add(fila)
  return fila
}

export const stock = {
  async registrarMovimiento(m) {
    // entrada/salida las carga el usuario en positivo; el signo lo pone el tipo.
    const cantidad = Math.abs(m.delta)
    const datos = m.tipo === 'entrada' || m.tipo === 'salida' ? { ...m, delta: m.tipo === 'salida' ? -cantidad : cantidad } : m
    return db.transaction('rw', db.movimientos_stock, db.cola_sync, async () => {
      const fila = await insertarMovimiento(datos)
      // Las ventas y anulaciones viajan dentro de su nota; solo estos movimientos manuales se envían por separado.
      if (['entrada', 'salida', 'ajuste'].includes(fila.tipo)) await encolar({ operacion: 'registrar', entidad: 'movimiento', entidad_id: fila.id })
      return fila
    })
  },
  async stockPorColor(producto_id) {
    const movs = await db.movimientos_stock.where('producto_id').equals(producto_id).toArray()
    const out = {}
    for (const m of movs) out[m.color_id] = (out[m.color_id] ?? 0) + m.delta
    return out
  },
  async stockActual(producto_id, color_id) {
    return (await stock.stockPorColor(producto_id))[color_id] ?? 0
  },
  movimientos: (producto_id) => db.movimientos_stock.where('producto_id').equals(producto_id).reverse().sortBy('creado_en'),
  // { [color_id]: unidades } de todo el catálogo, para listados e inventario.
  async resumen() {
    const out = {}
    await db.movimientos_stock.each((m) => {
      out[m.color_id] = (out[m.color_id] ?? 0) + m.delta
    })
    return out
  },
}
