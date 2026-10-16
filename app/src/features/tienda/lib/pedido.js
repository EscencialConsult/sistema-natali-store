// Resumen de un pedido contra el catálogo VIGENTE (nunca contra lo que había al agregar).
import { subtotal } from '../../../lib/docenas.js'
import { precioPublico } from './precioPublico.js'

// Monedas en las que se puede mostrar un total: USD siempre, las otras solo con tasa válida y no de ejemplo.
export const monedasDisponibles = (ajustes) => precioPublico({ precioUsdCent: 100, ajustes }).monedas.map((m) => m.moneda)

// Cuando no se pudo consultar el catálogo (sin conexión): se conservan cantidades y el precio queda "a confirmar".
// Nunca se muestra un importe sacado de datos viejos como si fuera vigente.
export function sinConfirmar({ carrito, moneda }) {
  return {
    lineas: carrito.lineas.map((l) => ({ ...l, estado: 'sin_confirmar', docenaCent: null, subtotalCent: null, cambio: false })),
    moneda,
    totalCent: null,
    hayNoDisponibles: false,
    hayCambios: false,
  }
}

/**
 * @param {{ carrito: {lineas: any[]}, vigentes: Map<string, any>, ajustes: any, moneda: 'usd'|'ars'|'bs' }} p
 */
export function resumirPedido({ carrito, vigentes, ajustes, moneda }) {
  const lineas = carrito.lineas.map((l) => {
    const p = vigentes.get(l.id)
    if (!p) return { ...l, estado: 'no_disponible', docenaCent: null, subtotalCent: null, cambio: false }
    const pr = precioPublico({ precioUsdCent: p.precio_docena_usd_cent, ajustes })
    const m = pr.monedas.find((x) => x.moneda === moneda)
    const cambio = l.precioUsdCent !== null && Number.isInteger(p.precio_docena_usd_cent) && l.precioUsdCent !== p.precio_docena_usd_cent
    const base = { ...l, codigo: p.codigo, nombre: p.nombre, cambio }
    if (!m) return { ...base, estado: pr.oculto ? 'precio_oculto' : 'sin_moneda', docenaCent: null, subtotalCent: null }
    return { ...base, estado: 'ok', docenaCent: m.docena, subtotalCent: subtotal(l.cantidad, m.docena) }
  })
  const todasOk = lineas.length > 0 && lineas.every((l) => l.estado === 'ok')
  return {
    lineas,
    moneda,
    // Un total solo existe si TODAS las líneas tienen precio vigente: nunca un total que omita productos.
    totalCent: todasOk ? lineas.reduce((t, l) => t + l.subtotalCent, 0) : null,
    hayNoDisponibles: lineas.some((l) => l.estado === 'no_disponible'),
    hayCambios: lineas.some((l) => l.cambio),
  }
}
