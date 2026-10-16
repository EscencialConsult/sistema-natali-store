// Precio público de una docena y de media docena, en USD, Bs y ARS.
// Reutiliza las funciones del sistema de nota para heredar su orden de redondeo exacto:
// primero se convierte el precio de la docena y recién después se calcula la media docena.
import { precioDocena } from '../../ventas/calculos.js'
import { subtotal, UNIDADES_POR_DOCENA } from '../../../lib/docenas.js'

const tasaValida = (t) => typeof t === 'number' && Number.isFinite(t) && t > 0

/**
 * @param {{ precioUsdCent: number|null|undefined, ajustes?: {tipo_cambio_bs?: any, tipo_cambio_ars?: any, tipo_cambio_es_ejemplo?: boolean} }} p
 * @returns {{ oculto: boolean, unidadesDocena: number, monedas: {moneda: 'usd'|'ars'|'bs', docena: number, media: number}[] }}
 */
export function precioPublico({ precioUsdCent, ajustes } = {}) {
  const base = { unidadesDocena: UNIDADES_POR_DOCENA }
  // Precio oculto o inválido: nunca se calcula nada ("a consultar"). Null no es cero.
  if (!Number.isInteger(precioUsdCent) || precioUsdCent < 0) return { ...base, oculto: true, monedas: [] }

  const tc = {
    bs: ajustes?.tipo_cambio_bs == null ? NaN : Number(ajustes.tipo_cambio_bs),
    ars: ajustes?.tipo_cambio_ars == null ? NaN : Number(ajustes.tipo_cambio_ars),
  }
  // Con una tasa de ejemplo no se muestran importes convertidos: solo USD.
  const convertir = !ajustes?.tipo_cambio_es_ejemplo
  const monedas = []
  for (const moneda of ['usd', 'ars', 'bs']) {
    if (moneda !== 'usd' && (!convertir || !tasaValida(tc[moneda]))) continue
    const docena = precioDocena({ precioUsdCent, moneda, tc })
    monedas.push({ moneda, docena, media: subtotal(0.5, docena) })
  }
  return { ...base, oculto: false, monedas }
}
