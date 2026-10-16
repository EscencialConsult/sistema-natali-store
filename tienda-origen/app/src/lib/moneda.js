// Único lugar donde se formatea y convierte dinero. Todo importe es un entero en centavos.
// La tienda vende en Bs; el pago en línea con Mercado Pago (cuenta argentina) se hace en ARS (ver docs/05-pagos.md).
export const MONEDA_TIENDA = 'bs'

// Orden fijo en toda la app (pedido de la clienta): USD primero, Bs al final.
export const MONEDAS = ['usd', 'ars', 'bs']

export const META_MONEDA = {
  usd: { simbolo: 'US$', nombre: 'Dólares', corto: 'USD' },
  ars: { simbolo: '$', nombre: 'Pesos arg.', corto: 'ARS' },
  bs: { simbolo: 'Bs', nombre: 'Bolivianos', corto: 'Bs' },
}

export const aCentavos = (monto) => Math.round(Number.parseFloat((Number(monto) * 100).toPrecision(15)))

const numero = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const numeroEntero = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 })

export function formatear(centavos, moneda = MONEDA_TIENDA) {
  const m = META_MONEDA[moneda] ?? META_MONEDA[MONEDA_TIENDA]
  // Los pesos argentinos de la tienda son enteros: se muestran sin ",00" (si traen centavos, se muestran).
  if (moneda === 'ars' && Number.isInteger(centavos) && centavos % 100 === 0) return `${m.simbolo} ${numeroEntero.format(centavos / 100)}`
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

// Pesos argentinos por 1 boliviano, derivado del tipo de cambio que carga la administración ({ bs, ars } por 1 USD: el
// mismo dato que usa el sistema de nota). null si falta o es inválido.
export function arsPorBs(tc) {
  const bs = Number(tc?.bs)
  const ars = Number(tc?.ars)
  return bs > 0 && ars > 0 ? ars / bs : null
}

// Bs (centavos) → pesos (centavos), redondeado al centavo y nunca en cero para un precio positivo. Es el mismo cálculo que
// hace la base al crear el pedido (tienda_crear_pedido): lo que se muestra es lo que se cobra.
export const bsAPesosCent = (bsCent, tasa) => {
  if (!tasa || !Number.isFinite(bsCent)) return null
  return bsCent > 0 ? Math.max(1, Math.round(bsCent * tasa)) : 0
}

// Pesos sin ",00" cuando el importe es entero (los precios en pesos son enteros).
export function formatearPesos(centavos) {
  if (centavos == null) return ''
  if (centavos % 100 !== 0) return formatear(centavos, 'ars')
  return `${META_MONEDA.ars.simbolo} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(centavos / 100)}`
}

// Total de una compra en pesos: precio por unidad convertido y redondeado, por la cantidad (igual que la base).
export function totalEnPesos(lineas, envioBsCent, tasa) {
  if (!tasa) return null
  const items = lineas.reduce((t, l) => t + bsAPesosCent(l.precio_cent, tasa) * l.cantidad, 0)
  return items + (envioBsCent ? bsAPesosCent(envioBsCent, tasa) : 0)
}

// Recargo por pago en línea (Mercado Pago y QR): se cobra total / (1 - pct/100) para que, descontada la comisión de
// Mercado Pago, a la tienda le llegue su total. Misma fórmula que el servidor (netlify/functions/_lib/recargo.js).
export const conRecargo = (totalCent, pct) => {
  const p = Number(pct)
  return Number.isFinite(p) && p > 0 && p < 50 ? Math.round(Number(totalCent) / (1 - p / 100)) : Number(totalCent)
}
export const textoPorcentaje = (pct) => `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(Number(pct) || 0)} %`
