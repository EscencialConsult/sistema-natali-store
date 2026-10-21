import { useSyncExternalStore } from 'react'

// Diferencia entre la hora de esta computadora y la del servidor (positivo = la PC está atrasada). La hora de una PC mal puesta rompe
// la sesión (el token «vence» para el servidor antes que para la app) y deja las notas con fecha equivocada.
const CLAVE = 'one.desfase_reloj'
export const TOLERANCIA_MS = 2 * 60_000

let desfase = (() => {
  try {
    const guardado = Number(localStorage.getItem(CLAVE))
    return Number.isFinite(guardado) ? guardado : 0
  } catch {
    return 0
  }
})()
const oyentes = new Set()

// fechaHttp: valor del encabezado `Date` de una respuesta del servidor (precisión de 1 segundo).
export function registrarHoraServidor(fechaHttp, ahora = Date.now()) {
  const hora = Date.parse(fechaHttp ?? '')
  if (Number.isNaN(hora)) return
  const nuevo = hora - ahora
  if (Math.abs(nuevo - desfase) < 1_000) return
  desfase = nuevo
  try {
    localStorage.setItem(CLAVE, String(nuevo))
  } catch {
    /* sin almacenamiento: queda solo en memoria */
  }
  oyentes.forEach((o) => o())
}

export const desfaseReloj = () => desfase
export const relojDesfasado = () => Math.abs(desfase) > TOLERANCIA_MS

const suscribir = (o) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}
export const useDesfaseReloj = () => useSyncExternalStore(suscribir, desfaseReloj, () => 0)

export function textoDesfase(ms) {
  const min = Math.round(Math.abs(ms) / 60_000)
  const cuanto = min >= 120 ? `${Math.round(min / 60)} horas` : `${min} minutos`
  return `${cuanto} ${ms > 0 ? 'atrasada' : 'adelantada'}`
}
