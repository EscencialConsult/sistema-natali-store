// Descuento de una venta: sobre el total de la nota, en porcentaje o en monto fijo (en la moneda de la venta).
// La venta guarda descuento_modo, descuento_porcentaje (solo en modo porcentaje) y descuento_cent. total_cent ya es lo cobrado.
import { formatear, leerMonto, MONEDAS } from './moneda.js'

export const MODOS_DESCUENTO = { porcentaje: 'Porcentaje', monto: 'Monto fijo' }

// descuento: { modo, valor } (valor: % en modo porcentaje, centavos en modo monto). Devuelve centavos.
// En enteros (centésimas de %) da lo mismo que el round() de naty_registrar_venta: si difiriera, el servidor rechazaría la venta.
export function calcularDescuento(subtotalCent, descuento) {
  if (!descuento) return 0
  if (descuento.modo === 'monto') return descuento.valor
  return Math.round((subtotalCent * Math.round(descuento.valor * 100)) / 10000)
}

// Lo que escribe la persona → { descuento: { modo, valor }, cent } o { error }. Campo vacío: {} (todavía no hay nada que avisar).
export function leerDescuento(modo, texto, subtotalCent, moneda) {
  const t = String(texto ?? '').trim()
  if (!t) return {}
  let descuento
  if (modo === 'porcentaje') {
    const n = Number(t.replace('%', '').trim().replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0 || n > 100) return { error: 'El porcentaje tiene que ser mayor a 0 y hasta 100.' }
    descuento = { modo, valor: Math.round(n * 100) / 100 }
  } else {
    const { cent, error } = leerMonto(t)
    if (error || cent <= 0) return { error: 'Escribí un monto mayor a 0.' }
    descuento = { modo, valor: cent }
  }
  const cent = calcularDescuento(subtotalCent, descuento)
  if (cent > subtotalCent) return { error: `No puede ser mayor que el total de la venta (${formatear(subtotalCent, moneda)}).` }
  if (cent <= 0) return { error: 'Ese porcentaje es tan chico que no descuenta nada.' }
  return { descuento, cent }
}

// "Descuento (12,5%)" o "Descuento" a secas si fue un monto fijo.
export function etiquetaDescuento({ modo, porcentaje }) {
  return modo === 'porcentaje' ? `Descuento (${String(porcentaje).replace('.', ',')}%)` : 'Descuento'
}

export const hayDescuento = (venta) => Number(venta?.descuento_cent) > 0
// Lo que sumaban los productos, antes del descuento.
export const subtotalDe = (venta) => Number(venta.total_cent) + (Number(venta.descuento_cent) || 0)

// Descuentos dados, por moneda (nunca se mezclan), sin las notas anuladas: [{ moneda, cent, ventas }].
export function descuentosPorMoneda(ventas) {
  const porMoneda = {}
  for (const v of ventas) {
    if (v.estado === 'anulada' || !hayDescuento(v)) continue
    const f = (porMoneda[v.moneda] ??= { moneda: v.moneda, cent: 0, ventas: 0 })
    f.cent += Number(v.descuento_cent)
    f.ventas++
  }
  return MONEDAS.filter((m) => porMoneda[m]).map((m) => porMoneda[m])
}
