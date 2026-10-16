// Carrito de la tienda pública: funciones puras. Cantidades en docenas, de media en media (docena o media docena).
// Guarda una "foto" del precio al agregar solo para AVISAR si cambió; el precio que se muestra es siempre el vigente.
import { CANTIDAD_MAXIMA, normalizarCantidad } from '../../../lib/docenas.js'

export const VERSION_CARRITO = 1
export const carritoVacio = () => ({ v: VERSION_CARRITO, lineas: [] })

const precioONulo = (p) => (Number.isInteger(p) && p >= 0 ? p : null)

// Lo que viene del almacenamiento puede estar roto, viejo o manipulado: se normaliza todo.
export function normalizarCarrito(crudo) {
  if (!crudo || typeof crudo !== 'object' || crudo.v !== VERSION_CARRITO || !Array.isArray(crudo.lineas)) return carritoVacio()
  const vistos = new Set()
  const lineas = []
  for (const l of crudo.lineas) {
    if (!l || typeof l.id !== 'string' || !l.id || vistos.has(l.id)) continue
    const c = Number(l.cantidad)
    if (!Number.isFinite(c) || c <= 0) continue
    vistos.add(l.id)
    lineas.push({
      id: l.id,
      codigo: String(l.codigo ?? '').slice(0, 40),
      nombre: String(l.nombre ?? '').slice(0, 120),
      precioUsdCent: precioONulo(l.precioUsdCent),
      cantidad: normalizarCantidad(c),
    })
  }
  return { v: VERSION_CARRITO, lineas: lineas.slice(0, 200) }
}

export function agregarLinea(carrito, producto, cantidad) {
  const c = normalizarCantidad(cantidad)
  const precio = precioONulo(producto.precio_docena_usd_cent)
  const existe = carrito.lineas.some((l) => l.id === producto.id)
  if (!existe) {
    const nueva = { id: producto.id, codigo: producto.codigo, nombre: producto.nombre, precioUsdCent: precio, cantidad: c }
    return { ...carrito, lineas: [...carrito.lineas, nueva] }
  }
  return {
    ...carrito,
    lineas: carrito.lineas.map((l) => (l.id === producto.id ? { ...l, cantidad: Math.min(CANTIDAD_MAXIMA, l.cantidad + c), precioUsdCent: precio } : l)),
  }
}

export const quitarLinea = (carrito, id) => ({ ...carrito, lineas: carrito.lineas.filter((l) => l.id !== id) })

export function cambiarCantidad(carrito, id, cantidad) {
  if (!(Number(cantidad) > 0)) return quitarLinea(carrito, id)
  return { ...carrito, lineas: carrito.lineas.map((l) => (l.id === id ? { ...l, cantidad: normalizarCantidad(cantidad) } : l)) }
}
