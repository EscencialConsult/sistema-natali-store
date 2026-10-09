// Se vende por docena o media docena: la cantidad (en docenas) va de 0,5 en 0,5.
export const PASO_DOCENA = 0.5
export const CANTIDAD_MAXIMA = 999
export const normalizarCantidad = (n) => Math.min(CANTIDAD_MAXIMA, Math.max(PASO_DOCENA, Math.round((Number(n) || 0) / PASO_DOCENA) * PASO_DOCENA))
export const esCantidadValida = (n) => n > 0 && Number.isInteger(n / PASO_DOCENA)
export const textoCantidad = (n) => String(n).replace('.', ',')

// Media docena de un precio impar deja medio centavo: se redondea (igual que en el servidor).
export const subtotal = (cantidad, precioCent) => Math.round(cantidad * precioCent)
