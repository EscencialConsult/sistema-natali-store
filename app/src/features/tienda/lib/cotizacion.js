import { fechaDia } from '../../../lib/fechas.js'

const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

// "Cotización del 12/10/2026: 1 US$ = $ 1.590 · Bs 12". Los precios base están en dólares y se convierten con la cotización
// que la administración carga en Ajustes: por eso se muestra de qué día es. La fecha usa el mismo formato que el sistema de notas.
export function textoCotizacion(ajustes) {
  const partes = []
  const ars = Number(ajustes?.tipo_cambio_ars)
  const bs = Number(ajustes?.tipo_cambio_bs)
  if (Number.isFinite(ars) && ars > 0) partes.push(`$ ${numero.format(ars)}`)
  if (Number.isFinite(bs) && bs > 0) partes.push(`Bs ${numero.format(bs)}`)
  if (!partes.length) return ''
  const t = Date.parse(ajustes?.tipo_cambio_actualizado_en ?? '')
  return `${Number.isFinite(t) ? `Cotización del ${fechaDia(new Date(t).toISOString())}` : 'Cotización'}: 1 US$ = ${partes.join(' · ')}`
}
