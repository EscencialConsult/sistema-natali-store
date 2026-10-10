import { textoDocenas } from './docenas.js'

// Estado de stock de un color (unidades y umbral en prendas; el texto, en docenas). Nunca solo por color: lleva texto.
export function estadoStock(unidades, umbral) {
  if (unidades <= 0) return { clave: 'agotado', texto: 'Agotado' }
  if (unidades <= umbral) return { clave: 'bajo', texto: `Quedan ${textoDocenas(unidades)}` }
  return { clave: 'ok', texto: textoDocenas(unidades) }
}
