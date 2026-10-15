// Repositorio del carrito (siempre LOCAL: el carrito vive en el dispositivo, nunca en el servidor).
//   items() · agregar({ producto_id, color_id, cantidad }) · cantidad(key, n) · quitar(key) · vaciar()
// Cada ítem guarda solo ids y cantidad: nombre, foto y precio se leen del catálogo al mostrarlo (así nunca quedan viejos).
import { db } from '../../db.js'

const clave = (producto_id, color_id) => `${producto_id}:${color_id}`

export const carrito = {
  items: () => db.carrito.orderBy('agregado_en').toArray(),
  async agregar({ producto_id, color_id, cantidad = 1 }) {
    const key = clave(producto_id, color_id)
    const previo = await db.carrito.get(key)
    const n = Math.max(1, Math.min(999, (previo?.cantidad ?? 0) + cantidad))
    await db.carrito.put({ key, producto_id, color_id, cantidad: n, agregado_en: previo?.agregado_en ?? new Date().toISOString() })
    return n
  },
  async cantidad(key, n) {
    if (n <= 0) return db.carrito.delete(key)
    return db.carrito.update(key, { cantidad: Math.min(999, Math.trunc(n)) })
  },
  quitar: (key) => db.carrito.delete(key),
  vaciar: () => db.carrito.clear(),
  total: async () => (await db.carrito.toArray()).reduce((t, i) => t + i.cantidad, 0),
}
