import { useEffect, useRef, useState } from 'react'

const CADA_MS = 30_000
const LENTA_MS = 2_500
const LIMITE_MS = 6_000

// Estados: 'conectado' | 'lenta' | 'sin_conexion'.
// navigator.onLine solo dice si hay red local; por eso además se pide un archivo chico y se mide.
async function medir() {
  if (navigator.onLine === false) return 'sin_conexion'
  const ctrl = new AbortController()
  const corte = setTimeout(() => ctrl.abort(), LIMITE_MS)
  const t0 = performance.now()
  try {
    const r = await fetch(`/favicon.svg?_=${Date.now()}`, { cache: 'no-store', signal: ctrl.signal })
    if (!r.ok) return 'sin_conexion'
    return performance.now() - t0 > LENTA_MS ? 'lenta' : 'conectado'
  } catch {
    return ctrl.signal.aborted ? 'lenta' : 'sin_conexion'
  } finally {
    clearTimeout(corte)
  }
}

const AVISO_VOLVIO_MS = 5_000

// Devuelve { estado, restablecida }: restablecida = true durante unos segundos al volver de "sin conexión".
export function useConexion() {
  const [estado, setEstado] = useState(() => (navigator.onLine === false ? 'sin_conexion' : 'conectado'))
  const [restablecida, setRestablecida] = useState(false)
  const previo = useRef(estado)
  const timer = useRef(null)

  useEffect(() => {
    let vigente = true
    const aplicar = (e) => {
      if (!vigente) return
      if (previo.current === 'sin_conexion' && e === 'conectado') {
        setRestablecida(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setRestablecida(false), AVISO_VOLVIO_MS)
      } else if (e !== 'conectado') setRestablecida(false)
      previo.current = e
      setEstado(e)
    }
    const revisar = () => medir().then(aplicar)
    const caer = () => aplicar('sin_conexion')
    window.addEventListener('online', revisar)
    window.addEventListener('offline', caer)
    revisar()
    const t = setInterval(revisar, CADA_MS)
    return () => {
      vigente = false
      window.removeEventListener('online', revisar)
      window.removeEventListener('offline', caer)
      clearInterval(t)
      clearTimeout(timer.current)
    }
  }, [])

  return { estado, restablecida }
}
