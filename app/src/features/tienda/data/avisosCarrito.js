// Último modelo agregado al pedido. Lo escucha el marco de la tienda para hacer volar la foto hasta el ícono del pedido,
// animar el ícono y mostrar el aviso con «Ver pedido». No persiste: es solo para la respuesta visual del momento.
import { useSyncExternalStore } from 'react'

let ultimo = null
const oyentes = new Set()

/** @param {{ nombre: string, cantidad: number, foto?: string, desde?: {x:number,y:number,w:number,h:number} }} datos */
export function avisarAgregado(datos) {
  ultimo = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...datos }
  for (const f of oyentes) f()
}

const suscribir = (f) => {
  oyentes.add(f)
  return () => oyentes.delete(f)
}
const obtener = () => ultimo
const nada = () => null

export const useUltimoAgregado = () => useSyncExternalStore(suscribir, obtener, nada)

/** Posición de un elemento, como objeto plano, para el punto de partida de la animación. */
export const rectDe = (el) => {
  const r = el?.getBoundingClientRect?.()
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : undefined
}
