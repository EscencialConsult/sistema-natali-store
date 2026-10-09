import { useSyncExternalStore } from 'react'

// true mientras la media query se cumpla (se actualiza al girar o cambiar el tamaño de la ventana).
export function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}

// Escritorio/tablet: desde 768 px (breakpoint md).
export const useEsEscritorio = () => useMediaQuery('(min-width: 768px)')
