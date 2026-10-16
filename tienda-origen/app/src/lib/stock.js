// Estado de stock de un color. Nunca solo por color: lleva texto.
export function estadoStock(unidades, umbral) {
  if (unidades <= 0) return { clave: 'agotado', texto: 'Agotado' }
  if (unidades <= umbral) return { clave: 'bajo', texto: `Quedan ${unidades}` }
  return { clave: 'ok', texto: `${unidades} u.` }
}

// Disponibilidad para el público: nunca muestra cantidades grandes (solo cuando quedan pocas).
export function disponibilidad(unidades, umbral) {
  if (unidades <= 0) return { clave: 'agotado', texto: 'Sin stock' }
  if (unidades <= umbral) return { clave: 'bajo', texto: `Quedan ${unidades}` }
  return { clave: 'ok', texto: 'Disponible' }
}

// Umbral de "stock bajo" (prendas por color). Un solo valor por defecto para todo el sistema; se configura en el panel.
export const UMBRAL_STOCK_BAJO = 6
export const umbralStockBajo = (config) => {
  const n = Number(config?.stock_bajo_unidades)
  return Number.isInteger(n) && n >= 0 ? n : UMBRAL_STOCK_BAJO
}
