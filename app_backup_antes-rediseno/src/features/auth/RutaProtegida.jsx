import { Lock } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { EmptyState, Skeleton } from '../../components/ui/index.js'
import { puedeAlguna } from '../../lib/permisos.js'
import { useAuth } from './AuthContext.js'

// Sin sesión → login. Con sesión pero sin permiso → aviso (no se redirige en silencio).
export default function RutaProtegida({ accion }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Skeleton className="m-4 h-40" />
  if (!usuario) return <Navigate to="/" replace />
  if (accion && !puedeAlguna(usuario.rol, accion)) {
    return <EmptyState icono={Lock} titulo="No tenés acceso a esta pantalla" texto="Si lo necesitás, pedíselo a la administración." />
  }
  return <Outlet />
}
