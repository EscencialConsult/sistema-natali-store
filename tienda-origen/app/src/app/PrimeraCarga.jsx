import { useEffect, useState } from 'react'
import { ErrorState, Skeleton } from '../components/ui/index.js'
import { db } from '../data/db.js'
import { hayBackend, obtenerSupabase } from '../data/supabase.js'
import { descargarCatalogoPublico, limpiarDatosPublicos } from '../data/sync/publico.js'
import { descargar } from '../data/sync/remoto.js'
import { useAuth } from '../features/auth/AuthContext.js'

// Con servidor, la primera vez que se abre la app en un dispositivo hay que bajar el catálogo ANTES de mostrarla:
//  · sin sesión (compradora, kiosco): el catálogo público (vista tienda_catalogo_publico);
//  · con sesión (panel): el catálogo completo con stock real.
// Las veces siguientes abre al instante con lo que ya tiene y se actualiza en segundo plano (SyncRunner).
// Si cambia quién usa el dispositivo (entra o sale una persona), se vuelve a preparar.
export default function PrimeraCarga({ children }) {
  const { usuario } = useAuth()
  const clave = usuario?.id ?? 'publico'
  const [listo, setListo] = useState({ clave: null, error: false })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!hayBackend) return
    let vigente = true
    ;(async () => {
      const origen = (await db.config.get('origen_datos'))?.valor
      const hayProductos = (await db.productos.count()) > 0
      if (usuario) {
        if (origen === 'completo' && hayProductos) return
        await limpiarDatosPublicos()
        await descargar(await obtenerSupabase())
        await db.config.put({ clave: 'origen_datos', valor: 'completo' })
      } else if (!(origen === 'publico' && hayProductos)) {
        await descargarCatalogoPublico(await obtenerSupabase())
      }
    })()
      .then(() => vigente && setListo({ clave, error: false }))
      .catch(() => vigente && setListo({ clave, error: true }))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])

  if (!hayBackend || (listo.clave === clave && !listo.error)) return children
  if (listo.clave === clave && listo.error) {
    return (
      <ErrorState
        mensaje="No pudimos preparar el catálogo. La primera vez en cada dispositivo hace falta internet."
        onReintentar={() => {
          setListo({ clave: null, error: false })
          setIntento((n) => n + 1)
        }}
      />
    )
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6" role="status" aria-label="Preparando el catálogo">
      <p className="text-sm text-texto-suave">Preparando el catálogo en este dispositivo…</p>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </div>
  )
}
