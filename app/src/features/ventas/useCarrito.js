import { useEffect, useReducer, useState } from 'react'
import { nuevoId } from '../../lib/id.js'
import { agregarLinea } from './calculos.js'

const VACIO = { moneda: 'usd', lineas: [], cliente_nombre: '', cliente_telefono: '', metodo_pago: 'efectivo' }

// Líneas: { key, productoId, colorId, cantidad (docenas), manualCent }. Solo ids: nombres y fotos se leen del catálogo.
function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'moneda':
      // Al cambiar de moneda se vuelve a los precios de lista: un precio manual era de la otra moneda.
      return { ...estado, moneda: accion.moneda, lineas: estado.lineas.map((l) => ({ ...l, manualCent: null })) }
    case 'agregar':
      return { ...estado, lineas: agregarLinea(estado.lineas, { key: nuevoId(), manualCent: null, ...accion.linea }) }
    case 'cantidad':
      return { ...estado, lineas: estado.lineas.map((l) => (l.key === accion.key ? { ...l, cantidad: Math.max(1, Math.min(999, accion.cantidad)) } : l)) }
    case 'precio_manual':
      return { ...estado, lineas: estado.lineas.map((l) => (l.key === accion.key ? { ...l, manualCent: accion.cent } : l)) }
    case 'quitar':
      return { ...estado, lineas: estado.lineas.filter((l) => l.key !== accion.key) }
    case 'campo':
      return { ...estado, [accion.campo]: accion.valor }
    case 'vaciar':
      return VACIO
    default:
      return estado
  }
}

const clave = (usuarioId) => `naty.borrador.${usuarioId}`

function leerBorrador(usuarioId) {
  try {
    const b = JSON.parse(localStorage.getItem(clave(usuarioId)) ?? 'null')
    return b && Array.isArray(b.lineas) ? { ...VACIO, ...b } : null
  } catch {
    return null
  }
}

// Carrito de la venta en curso. Se guarda como borrador en el dispositivo: si se cierra la app a mitad, se recupera.
export function useCarrito(usuarioId) {
  const [estado, despachar] = useReducer(reductor, usuarioId, (id) => leerBorrador(id) ?? VACIO)
  // ¿Había un borrador al abrir la pantalla? Se calcula una sola vez.
  const [recuperado] = useState(() => !!leerBorrador(usuarioId)?.lineas.length)

  useEffect(() => {
    try {
      const vacio = estado.lineas.length === 0 && !estado.cliente_nombre && !estado.cliente_telefono
      if (vacio) localStorage.removeItem(clave(usuarioId))
      else localStorage.setItem(clave(usuarioId), JSON.stringify(estado))
    } catch {
      /* sin almacenamiento: no hay borrador */
    }
  }, [estado, usuarioId])

  return { estado, despachar, recuperado }
}

export const borrarBorrador = (usuarioId) => {
  try {
    localStorage.removeItem(clave(usuarioId))
  } catch {
    /* nada */
  }
}
