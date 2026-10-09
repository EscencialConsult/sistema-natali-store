import { useCallback, useEffect, useState } from 'react'
import { almacenamiento } from '../../data/repos/index.js'
import { hayBackend, obtenerSupabase } from '../../data/supabase.js'
import { resumenUso } from '../../lib/almacenamiento.js'

const CADA_MS = 5 * 60_000

// Con servidor se pregunta el uso real del plan (naty_uso_almacenamiento); sin servidor se mide este dispositivo.
async function medir() {
  if (!hayBackend) return almacenamiento.medir()
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
