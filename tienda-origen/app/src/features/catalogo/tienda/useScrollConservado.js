import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Al volver de una ficha, la grilla aparece donde estaba. Se guarda por entrada del historial { y, visibles }:
// primero se restauran las tandas (estado inicial de la página) y recién después del render se restaura la posición,
// una sola vez. Si cambia la búsqueda o el filtro, la entrada del historial es otra y se arranca arriba.
const leer = (clave) => {
  try {
    return JSON.parse(sessionStorage.getItem(clave) ?? 'null')
  } catch {
    return null
  }
}

export const claveScroll = (key) => `catalogo:${key}`
export const tandasGuardadas = (key) => leer(claveScroll(key))?.visibles ?? null

export function useScrollConservado(listo, visibles) {
  const { key } = useLocation()
  const clave = claveScroll(key)
  const restaurado = useRef(null)
  const visiblesRef = useRef(visibles)
  useEffect(() => {
    visiblesRef.current = visibles
  }, [visibles])

  useEffect(() => {
    if (!listo || restaurado.current === clave) return
    restaurado.current = clave
    const y = leer(clave)?.y ?? 0
    if (y > 0) window.scrollTo({ top: Math.min(y, document.documentElement.scrollHeight) })
  }, [clave, listo])

  useEffect(() => {
    let pendiente = 0
    const guardar = () => {
      cancelAnimationFrame(pendiente)
      pendiente = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(clave, JSON.stringify({ y: window.scrollY, visibles: visiblesRef.current }))
        } catch {
          /* sin almacenamiento */
        }
      })
    }
    window.addEventListener('scroll', guardar, { passive: true })
    return () => {
      cancelAnimationFrame(pendiente)
      window.removeEventListener('scroll', guardar)
    }
  }, [clave])
}
