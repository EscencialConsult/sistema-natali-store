// Estado de stock de un color. Nunca solo por color: lleva texto.
export function estadoStock(unidades, umbral) {
  if (unidades <= 0) return { clave: 'agotado', texto: 'Agotado' }
  if (unidades <= umbral) return { clave: 'bajo', texto: `Quedan ${unidades}` }
  return { clave: 'ok', texto: `${unidades} u.` }
}
