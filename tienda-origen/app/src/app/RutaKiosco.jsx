import { Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { Skeleton } from '../components/ui/index.js'
import { useKioscoDispositivo } from '../data/hooks.js'
import { BASE_KIOSCO } from './navegacion.js'

// El kiosco no tiene sesión de persona: tiene un dispositivo activado con PIN (tarea 6.1). Sin activación, va a /kiosco/activar.
export default function RutaKiosco() {
  const contexto = useOutletContext()
  const d = useKioscoDispositivo()
  if (d.cargando) return <Skeleton className="m-6 h-40" />
  if (!d.datos) return <Navigate to={`${BASE_KIOSCO}/activar`} replace />
  // Un Outlet anidado no hereda el contexto del layout: se reenvía (imprimir, dispositivo).
  return <Outlet context={contexto} />
}
