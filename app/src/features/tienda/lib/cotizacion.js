const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

// "Cotización del 12/10: 1 US$ = $ 1.590 · Bs 12". Los precios base están en dólares y se convierten con la cotización
// que la administración carga en Ajustes: por eso se muestra de qué día es.
export function textoCotizacion(ajustes) {
  const partes = []
  const ars = Number(ajustes?.tipo_cambio_ars)
  const bs = Number(ajustes?.tipo_cambio_bs)
  if (Number.isFinite(ars) && ars > 0) partes.push(`$ ${numero.format(ars)}`)
  if (Number.isFinite(bs) && bs > 0) partes.push(`Bs ${numero.format(bs)}`)
  if (!partes.length) return ''
  const t = Date.parse(ajustes?.tipo_cambio_actualizado_en ?? '')
  const fecha = Number.isFinite(t) ? new Date(t).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : null
  return `${fecha ? `Cotización del ${fecha}` : 'Cotización'}: 1 US$ = ${partes.join(' · ')}`
}
