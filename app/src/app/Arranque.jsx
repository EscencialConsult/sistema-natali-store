import { useEffect, useState } from 'react'
import { ErrorState, Skeleton } from '../components/ui/index.js'
import { prepararBase } from '../data/seed/cargar.js'
import { hayBackend } from '../data/supabase.js'

// Prepara la base local (datos de prueba la primera vez) antes de mostrar la app.
export default function Arranque({ children }) {
  const [estado, setEstado] = useState('cargando')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    prepararBase({ conServidor: hayBackend })
      .then(() => vigente && setEstado('listo'))
      .catch(() => vigente && setEstado('error'))
    return () => {
      vigente = false
    }
  }, [intento])

  if (estado === 'listo') return children
  if (estado === 'error') {
    return (
      <ErrorState
        mensaje="No pudimos preparar los datos de este dispositivo."
        onReintentar={() => {
          setEstado('cargando')
          setIntento((n) => n + 1)
        }}
      />
    )
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6" role="status" aria-label="Cargando">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </div>
  )
}
