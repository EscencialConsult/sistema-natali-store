import { useEffect, useState } from 'react'
import { ErrorState, Skeleton } from '../components/ui/index.js'
import { db } from '../data/db.js'
import { obtenerSupabase } from '../data/supabase.js'
import { descargar } from '../data/sync/remoto.js'
import { useAuth } from '../features/auth/AuthContext.js'

// Con servidor: la primera vez que alguien entra en un dispositivo hay que bajar el catálogo antes de mostrar la app.
// Las veces siguientes la app abre al instante con lo que ya tiene (y se actualiza en segundo plano).
export default function PrimeraCarga({ children }) {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState('revisando')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!usuario) return
    let vigente = true
    ;(async () => {
      if ((await db.productos.count()) > 0) return vigente && setEstado('listo')
      setEstado('cargando')
      await descargar(await obtenerSupabase())
      if (vigente) setEstado('listo')
    })().catch(() => vigente && setEstado('error'))
    return () => {
      vigente = false
    }
  }, [usuario, intento])

  if (!usuario || estado === 'listo') return children
  if (estado === 'error') {
    return (
      <ErrorState
        mensaje="No pudimos preparar los datos. La primera vez en cada dispositivo hace falta internet."
        onReintentar={() => {
          setEstado('cargando')
          setIntento((n) => n + 1)
        }}
      />
    )
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6" role="status" aria-label="Preparando tus datos">
      <p className="text-sm text-texto-suave">Preparando el catálogo en este dispositivo…</p>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </div>
  )
}
