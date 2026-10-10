// Todo se maneja en docenas (de 0,5 en 0,5: docena o media docena). Nunca se vende ni se carga por unidad.
// Por dentro el stock se guarda en prendas (enteros: media docena = 6), pero se ingresa y se muestra siempre en docenas.
export const PASO_DOCENA = 0.5
export const CANTIDAD_MAXIMA = 999
export const UNIDADES_POR_DOCENA = 12
export const normalizarCantidad = (n) => Math.min(CANTIDAD_MAXIMA, Math.max(PASO_DOCENA, Math.round((Number(n) || 0) / PASO_DOCENA) * PASO_DOCENA))
export const esCantidadValida = (n) => n > 0 && Number.isInteger(n / PASO_DOCENA)

const formato = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 })
// 1,5 · 10 · (datos viejos que no son media docena exacta: 5,33)
export const textoCantidad = (n) => formato.format(n)

export const aDocenas = (prendas) => prendas / UNIDADES_POR_DOCENA
export const aPrendas = (docenas) => Math.round(docenas * UNIDADES_POR_DOCENA)

// Stock (en prendas) como texto en docenas: "1,5 doc." / "1 docena" / "3 docenas".
export const textoDocenas = (prendas, { corto = true } = {}) => {
  const d = aDocenas(prendas)
  if (corto) return `${textoCantidad(d)} doc.`
  return `${textoCantidad(d)} ${Math.abs(d) === 1 ? 'docena' : 'docenas'}`
}

// Lo que escribe la persona ("1,5", "2") → docenas válidas, o error. permitirCero: para un conteo real (ajuste).
export function leerDocenas(texto, { permitirCero = false } = {}) {
  const t = String(texto ?? '').trim().replace(',', '.')
  const n = Number(t)
  if (t === '' || !Number.isFinite(n) || n < 0) return { error: 'Ingresá la cantidad en docenas (ej. 1, 1,5, 2).' }
  if (!Number.isInteger(n / PASO_DOCENA)) return { error: 'Solo docenas o medias docenas (ej. 1, 1,5, 2).' }
  if (n === 0 && !permitirCero) return { error: 'La cantidad debe ser mayor a 0.' }
  return { docenas: n }
}

// Media docena de un precio impar deja medio centavo: se redondea (igual que en el servidor).
export const subtotal = (cantidad, precioCent) => Math.round(cantidad * precioCent)
