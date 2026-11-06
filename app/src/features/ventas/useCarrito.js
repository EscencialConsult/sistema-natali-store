import { useEffect, useReducer, useState } from 'react'
import { nuevoId } from '../../lib/id.js'
import { agregarLinea, normalizarCantidad } from './calculos.js'

// descuento: null o { modo: 'porcentaje' | 'monto', valor } (% o centavos en la moneda de la venta).
const VACIO = { moneda: 'usd', lineas: [], cliente_nombre: '', cliente_telefono: '', cliente_email: '', cliente_direccion: '', metodo_pago: 'efectivo', metodo_entrega: null, retira_nombre: '', descuento: null }

// Líneas: { key, productoId, colorId (informativo), cantidad (docenas), manualCent }. Una línea por producto. Solo ids: nombres y fotos se leen del catálogo.
function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'moneda':
      // Al cambiar de moneda se vuelve a los precios de lista: un precio manual era de la otra moneda. Lo mismo un descuento de monto fijo.
      return {
        ...estado,
        moneda: accion.moneda,
        lineas: estado.lineas.map((l) => ({ ...l, manualCent: null })),
        descuento: accion.moneda !== estado.moneda && estado.descuento?.modo === 'monto' ? null : estado.descuento,
      }
    case 'agregar':
      return { ...estado, lineas: agregarLinea(estado.lineas, { key: nuevoId(), manualCent: null, ...accion.linea }) }
    case 'cantidad':
      return { ...estado, lineas: estado.lineas.map((l) => (l.key === accion.key ? { ...l, cantidad: normalizarCantidad(accion.cantidad) } : l)) }
    case 'precio_manual':
      return { ...estado, lineas: estado.lineas.map((l) => (l.key === accion.key ? { ...l, manualCent: accion.cent } : l)) }
    case 'quitar': {
      const lineas = estado.lineas.filter((l) => l.key !== accion.key)
      return { ...estado, lineas, descuento: lineas.length ? estado.descuento : null }
    }
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
      const vacio = estado.lineas.length === 0 && !estado.cliente_nombre && !estado.cliente_telefono && !estado.cliente_email && !estado.cliente_direccion && !estado.retira_nombre
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
