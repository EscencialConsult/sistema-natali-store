// Rangos de fechas para filtrar ventas. Devuelven { desde, hasta } en ISO (o null = sin límite).
import { finDelDia, inicioDelDia } from './fechas.js'

export const PERIODOS = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: '7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'todo', etiqueta: 'Todo' },
]

export function rangoDe(periodo, ahora = new Date()) {
  const hasta = finDelDia(ahora).toISOString()
  if (periodo === 'hoy') return { desde: inicioDelDia(ahora).toISOString(), hasta }
  if (periodo === 'semana') {
    const d = inicioDelDia(ahora)
    d.setDate(d.getDate() - 6)
    return { desde: d.toISOString(), hasta }
  }
  if (periodo === 'mes') return { desde: inicioDelDia(new Date(ahora.getFullYear(), ahora.getMonth(), 1)).toISOString(), hasta }
  return { desde: null, hasta: null }
}

// Un <input type="date"> da "2026-10-08": se toma como día local completo.
export const desdeDeFecha = (texto) => (texto ? inicioDelDia(new Date(`${texto}T00:00:00`)).toISOString() : null)
export const hastaDeFecha = (texto) => (texto ? finDelDia(new Date(`${texto}T00:00:00`)).toISOString() : null)
