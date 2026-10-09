import { useCallback, useEffect, useState } from 'react'
import { obtenerSupabase } from '../../data/supabase.js'
import { resumenUso } from '../../lib/almacenamiento.js'

const CADA_MS = 5 * 60_000

// Uso real del plan, medido por el servidor (naty_uso_almacenamiento: tamaño de la base y de las fotos).
async function medir() {
  const { data, error } = await (await obtenerSupabase()).rpc('naty_uso_almacenamiento')
  if (error) throw error
  return { datos_bytes: Number(data.datos_bytes), fotos_bytes: Number(data.fotos_bytes) }
}

// { uso: resumenUso | null, actualizar() }. Si no se puede medir (sin señal), no muestra nada en vez de inventar.
export function useUsoAlmacenamiento(activo = true) {
  const [uso, setUso] = useState(null)
  const actualizar = useCallback(() => medir().then((m) => setUso(resumenUso(m))).catch(() => {}), [])

  useEffect(() => {
    if (!activo) return
    let vigente = true
    const revisar = () => medir().then((m) => vigente && setUso(resumenUso(m))).catch(() => {})
    revisar()
    const t = setInterval(revisar, CADA_MS)
    return () => {
      vigente = false
      clearInterval(t)
    }
  }, [activo])

  return { uso, actualizar }
}
