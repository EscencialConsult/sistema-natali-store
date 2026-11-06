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

// Lo que escribe la persona → centavos. Entiende "59.000" (miles con punto), "59.000,50", "1,234.50", "12,5" y "US$ 99".
// El último separador es el decimal, salvo "869.000": punto seguido de 3 cifras y sin coma = miles.
export function leerMonto(texto) {
  const t = String(texto ?? '').replace(/[^\d.,-]/g, '')
  if (!String(texto ?? '').trim()) return { error: 'Falta el monto.' }
  if (!t) return { error: `Monto inválido: “${texto}”.` }
  const ultimo = Math.max(t.lastIndexOf(','), t.lastIndexOf('.'))
  const soloMiles = ultimo !== -1 && t.length - ultimo - 1 === 3 && !t.includes(',')
  const limpio = ultimo === -1 || soloMiles ? t.replace(/[.,]/g, '') : t.slice(0, ultimo).replace(/[.,]/g, '') + '.' + t.slice(ultimo + 1)
  const n = Number(limpio)
  if (!Number.isFinite(n) || n < 0) return { error: `Monto inválido: “${texto}”.` }
  return { cent: aCentavos(n) }
}

// Centavos → texto para editar en un campo ("59.000,00").
export const montoEditable = (cent) => numero.format(cent / 100)

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
