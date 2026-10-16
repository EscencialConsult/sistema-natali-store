// Rangos de fechas para filtrar pedidos y reportes. Devuelven { desde, hasta } en ISO (o null = sin límite).
// Los días se cortan en la zona de la tienda (America/La_Paz), ver fechas.js.
import { finDelDia, inicioDeDiaLaPaz, inicioDelDia, inicioDelMes, sumarDias } from './fechas.js'

export const PERIODOS = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: '7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'todo', etiqueta: 'Todo' },
]

export function rangoDe(periodo, ahora = new Date()) {
  const hasta = finDelDia(ahora).toISOString()
  if (periodo === 'hoy') return { desde: inicioDelDia(ahora).toISOString(), hasta }
  if (periodo === 'semana') return { desde: sumarDias(ahora, -6).toISOString(), hasta }
  if (periodo === 'mes') return { desde: inicioDelMes(ahora).toISOString(), hasta }
  return { desde: null, hasta: null }
}

// Un <input type="date"> da "2026-10-08": se toma como día completo en Bolivia.
export const desdeDeFecha = (texto) => (texto ? inicioDeDiaLaPaz(texto).toISOString() : null)
export const hastaDeFecha = (texto) => (texto ? new Date(inicioDeDiaLaPaz(texto).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : null)
