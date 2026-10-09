// Cálculos de una venta en curso. Todo en centavos enteros; el precio de lista está en USD por docena.
import { convertirDesdeUsd } from '../../lib/moneda.js'

export const UNIDADES_POR_DOCENA = 12

// Tipo de cambio que se guarda en la venta: 1 para USD, o cuántas unidades de esa moneda vale 1 USD.
export function tipoCambioDe(moneda, tc) {
  if (moneda === 'usd') return 1
  const tasa = tc?.[moneda]
  if (!tasa) throw new Error(`Falta cargar el tipo de cambio de ${moneda.toUpperCase()} en Ajustes.`)
  return tasa
}

// Precio de una docena en la moneda de la venta; un precio manual (solo con permiso) tiene prioridad.
export function precioDocena({ precioUsdCent, moneda, tc, manualCent = null }) {
  if (manualCent !== null && manualCent !== undefined) return manualCent
  return convertirDesdeUsd(precioUsdCent, moneda, tc)
}

export const subtotal = (cantidad, precioCent) => cantidad * precioCent

export function totalDeLineas(lineas) {
  return lineas.reduce((t, l) => t + subtotal(l.cantidad, l.precioCent), 0)
}

// Suma una línea; si ya existe el mismo producto y color, junta las cantidades.
export function agregarLinea(lineas, nueva) {
  const i = lineas.findIndex((l) => l.productoId === nueva.productoId && l.colorId === nueva.colorId)
  if (i === -1) return [...lineas, nueva]
  return lineas.map((l, k) => (k === i ? { ...l, cantidad: l.cantidad + nueva.cantidad } : l))
}

// Líneas que piden más unidades que las que hay en el color.
export function lineasSinStock(lineas, stockPorColor) {
  return lineas.filter((l) => l.cantidad * UNIDADES_POR_DOCENA > (stockPorColor[l.colorId] ?? 0))
}
