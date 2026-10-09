// Único lugar donde se formatea y convierte dinero. Todo importe es un entero en centavos.

// Orden fijo en toda la app (pedido de la clienta): USD primero, Bs al final.
export const MONEDAS = ['usd', 'ars', 'bs']

export const META_MONEDA = {
  usd: { simbolo: 'US$', nombre: 'Dólares', corto: 'USD' },
  ars: { simbolo: '$', nombre: 'Pesos arg.', corto: 'ARS' },
  bs: { simbolo: 'Bs', nombre: 'Bolivianos', corto: 'Bs' },
}

export const aCentavos = (monto) => Math.round(Number.parseFloat((Number(monto) * 100).toPrecision(15)))

const numero = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatear(centavos, moneda = 'usd') {
  const m = META_MONEDA[moneda] ?? META_MONEDA.usd
  return `${m.simbolo} ${numero.format((centavos ?? 0) / 100)}`
}

export const sumar = (lista, f = (x) => x) => lista.reduce((t, x) => t + f(x), 0)

// tc = { bs: Bs por 1 USD, ars: ARS por 1 USD }. El precio de lista está en USD.
export function convertirDesdeUsd(usdCentavos, moneda, tc) {
  if (moneda === 'usd') return usdCentavos
  const tasa = tc?.[moneda]
  if (!tasa) throw new Error(`Falta el tipo de cambio de ${moneda}`)
  return Math.round(usdCentavos * tasa)
}

// Cada venta está en UNA sola moneda: nunca se suman monedas distintas entre sí.
export function totalesPorMoneda(ventas) {
  const out = {}
  for (const v of ventas) out[v.moneda] = (out[v.moneda] ?? 0) + v.total_cent
  return MONEDAS.filter((m) => m in out).map((m) => ({ moneda: m, total_cent: out[m] }))
}
