import { useLayoutEffect } from 'react'

// Al entrar a una pantalla nueva la página arranca arriba. El catálogo no lo usa: recupera su posición guardada.
export function useVolverArriba() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
}
